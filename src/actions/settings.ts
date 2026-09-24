"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getVerifiedAdminSession } from "@/lib/admin-auth";

export async function getSettings() {
  let settings = await prisma.storeSettings.findUnique({
    where: { id: "MAIN" }
  });

  if (!settings) {
    settings = await prisma.storeSettings.create({
      data: {
        id: "MAIN",
        phone: "+33 1 23 45 67 89",
        email: "contact@lamaisonsucree.fr",
        address: "15 Place Vendôme, 75001 Paris, France",
        isVacationMode: false,
        hoursMonday: "Fermé",
        hoursTuesday: "08:00 - 19:30",
        hoursWednesday: "08:00 - 19:30",
        hoursThursday: "08:00 - 19:30",
        hoursFriday: "08:00 - 19:30",
        hoursSaturday: "08:30 - 20:00",
        hoursSunday: "08:30 - 14:00",
      }
    });
  }

  return settings;
}

export async function updateSettings(data: {
  phone: string;
  email: string;
  address: string;
  isVacationMode: boolean;
  hoursMonday: string;
  hoursTuesday: string;
  hoursWednesday: string;
  hoursThursday: string;
  hoursFriday: string;
  hoursSaturday: string;
  hoursSunday: string;
}) {
  const session = await getVerifiedAdminSession();
  if (!session) {
    throw new Error("Non autorisé.");
  }

  const settings = await prisma.storeSettings.upsert({
    where: { id: "MAIN" },
    update: data,
    create: {
      id: "MAIN",
      ...data
    }
  });

  revalidatePath("/", "layout"); // Revalidate entire app
  return settings;
}
