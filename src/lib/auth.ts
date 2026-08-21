import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import EmailProvider from "next-auth/providers/email";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

function html(params: { url: string; host: string }) {
  const { url, host } = params;
  const escapedHost = host.replace(/\./g, "&#8203;.");

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
      <a href="${url}" style="display: inline-block; background-color: #1A1A1A; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 30px; font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">
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

function text({ url, host }: { url: string; host: string }) {
  return `Connexion à La Maison Sucrée\n\nCliquez sur ce lien pour vous connecter : ${url}\n\n`;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
      sendVerificationRequest: async ({ identifier, url, provider, theme }) => {
        // En mode dev, on log toujours le lien au cas où l'envoi échoue
        if (process.env.NODE_ENV !== "production") {
          console.log(`\n=========================================\nMAGIC LINK FOR ${identifier}:\n${url}\n=========================================\n`);
        }

        // Si SMTP_USER n'est pas défini, on ne tente pas l'envoi
        if (!process.env.SMTP_USER) {
          console.warn("⚠️ SMTP_USER is not set. Magic link is only printed to console.");
          return;
        }

        const { host } = new URL(url);
        const transport = nodemailer.createTransport({
          host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
          port: Number(process.env.SMTP_PORT) || 587,
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
            text: text({ url, host }),
            html: html({ url, host }),
          });
          const failed = result.rejected.concat(result.pending).filter(Boolean);
          if (failed.length) {
            throw new Error(`Email(s) (${failed.join(", ")}) could not be sent`);
          }
        } catch (error) {
          console.error("SEND_VERIFICATION_EMAIL_ERROR", error);
          throw new Error("Erreur d'envoi de l'email");
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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        // Only allow users with a password to login via credentials (which are our admins)
        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        } as any;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "USER";
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin", // We will create a custom sign-in page
    verifyRequest: "/auth/verify-request",
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secret-key-for-dev",
};
