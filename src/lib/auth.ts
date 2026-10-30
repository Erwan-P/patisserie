import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { credentialVersion, normalizeEmail, escapeHtml } from "@/lib/security";
import { publicRequestBudget } from "@/lib/request-security";
import nodemailer from "nodemailer";
import type { Adapter } from "next-auth/adapters";

if (!process.env.NEXTAUTH_URL && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
}

function html({ url }: { url: string }) {

  return `
<body style="background: #FDFBF7; font-family: Arial, sans-serif; padding: 40px 0; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
    <div style="text-align: center; padding: 40px 20px; background: #1A1A1A;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold; letter-spacing: 2px;">LA MAISON SUCRÉE</h1>
    </div>
    <div style="padding: 40px 30px; text-align: center;">
      <h2 style="color: #1A1A1A; font-size: 24px; margin-bottom: 20px;">Connexion à votre compte</h2>
      <p style="color: #666666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
        Cliquez sur le bouton ci-dessous pour vous connecter en toute sécurité à votre espace client. Ce lien magique n'est valable qu'une seule fois.
      </p>
      <a href="${escapeHtml(url)}" style="display: inline-block; background-color: #1A1A1A; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 30px; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
        Me connecter
      </a>
      <p style="color: #999999; font-size: 13px; margin-top: 30px;">
        Si vous n'avez pas demandé cet email, vous pouvez l'ignorer en toute sécurité.
      </p>
    </div>
  </div>
</body>
`;
}

function text({ url }: { url: string }) {
  return `Connexion à La Maison Sucrée\n\nCliquez sur ce lien pour vous connecter : ${url}\n\n`;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      maxAge: 15 * 60,
      normalizeIdentifier(identifier) {
        const email = normalizeEmail(identifier);
        if (!email) throw new Error("Adresse e-mail invalide.");
        return email;
      },
      from: process.env.EMAIL_FROM,
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const existing = await prisma.user.findUnique({ where: { email: identifier }, select: { role: true } });
        if (existing?.role === "ADMIN") return;
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
          console.error("Le service e-mail est indisponible.");
          return;
        }

        const transport = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
          port: Number(process.env.SMTP_PORT) || 587,
          requireTLS: true,
          disableFileAccess: true,
          disableUrlAccess: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        
        try {
          const result = await transport.sendMail({
            to: identifier,
            from: provider.from,
            subject: `Connexion à La Maison Sucrée`,
            text: text({ url }),
            html: html({ url }),
          });
          const failed = result.rejected.concat(result.pending ?? []).filter(Boolean);
          if (failed.length) {
            throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`);
          }
        } catch (error) {
          console.error("SEND_VERIFICATION_EMAIL_ERROR", error instanceof Error ? error.name : "EmailError");
          // Keep the public response identical, including for protected admin
          // addresses. No link, address or mail server response is logged.
        }
      },
    }),
    CredentialsProvider({
      name: "Connexion Administrateur",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" }
      },
      async authorize(credentials) {
        const normalizedEmail = normalizeEmail(credentials?.email);
        if (!normalizedEmail || typeof credentials?.password !== "string" ||
            !credentials.password || Buffer.byteLength(credentials.password, "utf8") > 72) return null;
        if (!await publicRequestBudget("login", normalizedEmail, 5, 15 * 60 * 1000)) return null;
        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        // Never let a client select or obtain a privileged role.
        if (!user || user.role !== "ADMIN" || !user.password) return null;
        if (!await bcrypt.compare(credentials.password, user.password)) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account, email }) {
      if (account?.provider !== "email") return true;
      const address = normalizeEmail(user.email);
      if (!address) return false;
      if (email?.verificationRequest) {
        if (!await publicRequestBudget("email", address, 3, 15 * 60 * 1000)) {
          return new URL("/api/auth/verify-request?provider=email&type=email", process.env.NEXTAUTH_URL || "http://localhost:3000").toString();
        }
      }
      const existing = await prisma.user.findUnique({ where: { email: address }, select: { role: true } });
      // An admin may not bypass their password by using the public e-mail provider.
      if (existing?.role === "ADMIN" && !email?.verificationRequest) return false;
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.securityVersion = token.securityVersion as string;
        session.user.sessionId = token.sessionId as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      const id = user?.id || token.id;
      if (typeof id !== "string") throw new Error("Session révoquée.");
      const current = await prisma.user.findUnique({
        where: { id }, select: { id: true, role: true, password: true, twoFactorHash: true },
      });
      if (!current) throw new Error("Session révoquée.");
      const version = credentialVersion(current);
      if (user) {
        token.id = current.id;
        token.role = current.role;
        token.securityVersion = version;
        token.sessionId = randomUUID();
      } else if (token.securityVersion !== version || !token.sessionId) {
        throw new Error("Session révoquée.");
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin", // We will create a custom sign-in page
    verifyRequest: "/auth/verify-request",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
