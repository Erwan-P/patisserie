import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes, randomInt } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const prisma = new PrismaClient({ log: [], ...(process.env.DIRECT_URL ? { datasources: { db: { url: process.env.DIRECT_URL } } } : {}) });
let file;
try {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true, email: true } });
  if (admins.length !== 1 || !admins[0].email) throw new Error("La rotation exige exactement un administrateur avec une adresse e-mail.");
  const admin = admins[0];
  const credentials = {
    email: admin.email,
    password: randomBytes(24).toString("base64url"),
    pin: String(randomInt(1000000)).padStart(6, "0"),
    createdAt: new Date().toISOString(), applied: false,
  };
  mkdirSync(resolve(".private"), { recursive: true });
  file = resolve(".private", `admin-access-${Date.now()}.json`);
  // Keep the new access information before the write; never retry an ambiguous
  // database operation by generating different credentials.
  writeFileSync(file, JSON.stringify(credentials, null, 2), { flag: "wx", mode: 0o600 });
  const password = await bcrypt.hash(credentials.password, 12);
  const twoFactorHash = await bcrypt.hash(credentials.pin, 12);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: admin.id, role: "ADMIN" }, data: { password, twoFactorHash }, select: { id: true } });
    await tx.session.deleteMany({ where: { userId: admin.id } });
    await tx.verificationToken.deleteMany({ where: { identifier: admin.email } });
  });
  credentials.applied = true;
  writeFileSync(file, JSON.stringify(credentials, null, 2), { mode: 0o600 });
  console.log(`Accès administrateur renouvelés. Ouvrez le fichier privé : ${file}`);
  console.log("Le code corrigé révoque automatiquement les anciens JWT et cookies de sécurité de cet administrateur.");
} catch (error) {
  console.error(error instanceof Error && error.message.startsWith("La rotation") ? error.message : "Rotation non confirmée : vérifier la connexion à la base avant de poursuivre.");
  if (file) console.error(`Les accès préparés sont conservés ici : ${file}. Ne relancez pas sans vérifier si la transaction a abouti.`);
  process.exitCode = 1;
} finally { await prisma.$disconnect(); }
