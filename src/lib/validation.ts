import { boundedText, normalizeEmail, safeMediaUrl } from "@/lib/security";

type MediaInput = { url: string; type: string; order: number };
type ProductInput = {
  name: string; description: string; price: number; category: string; inventory: number;
  isSignature?: boolean; signatureOrder?: number | null; media?: MediaInput[];
};

export function validateProduct(input: ProductInput, mediaRequired: true): ProductInput & { media: MediaInput[] };
export function validateProduct(input: ProductInput, mediaRequired: false): ProductInput;
export function validateProduct(input: ProductInput, mediaRequired: boolean): ProductInput {
  if (!input || typeof input !== "object") throw new Error("Produit invalide.");
  const name = boundedText(input.name, "Nom", 200);
  const description = boundedText(input.description, "Description", 10000, true);
  const category = boundedText(input.category, "Catégorie", 50);
  if (!Number.isFinite(input.price) || input.price <= 0 || input.price > 100000 ||
      !Number.isInteger(input.inventory) || input.inventory < 0 || input.inventory > 1000000 ||
      (input.isSignature !== undefined && typeof input.isSignature !== "boolean") ||
      (input.signatureOrder != null && (!Number.isInteger(input.signatureOrder) || input.signatureOrder < 1 || input.signatureOrder > 10000))) {
    throw new Error("Prix, stock ou ordre invalide.");
  }
  if ((mediaRequired && !Array.isArray(input.media)) ||
      (input.media !== undefined && (!Array.isArray(input.media) || input.media.length > 20))) {
    throw new Error("Liste de médias invalide.");
  }
  const media = input.media?.map((item, index) => {
    if (!item || !["IMAGE", "VIDEO"].includes(item.type)) throw new Error("Type de média invalide.");
    return { url: safeMediaUrl(item.url), type: item.type, order: index + 1 };
  });
  // Copy only allowed fields; never forward nested input objects to Prisma.
  return { name, description, category, price: input.price, inventory: input.inventory,
    isSignature: input.isSignature ?? false, signatureOrder: input.signatureOrder ?? null,
    ...(media === undefined ? {} : { media }),
  };
}

export function validateSettings(input: Record<string, unknown>) {
  if (!input || typeof input !== "object") throw new Error("Paramètres invalides.");
  const email = normalizeEmail(input.email);
  if (!email || typeof input.isVacationMode !== "boolean") throw new Error("Paramètres invalides.");
  const schedule = (key: string) => {
    const value = boundedText(input[key], "Horaires", 100);
    if (value !== "Fermé" && !/^\d{2}:\d{2}\s*-\s*\d{2}:\d{2}(?:\s*,\s*\d{2}:\d{2}\s*-\s*\d{2}:\d{2})*$/.test(value)) {
      throw new Error("Format d'horaires invalide.");
    }
    return value;
  };
  return {
    phone: boundedText(input.phone, "Téléphone", 50), email,
    address: boundedText(input.address, "Adresse", 500), isVacationMode: input.isVacationMode,
    hoursMonday: schedule("hoursMonday"), hoursTuesday: schedule("hoursTuesday"),
    hoursWednesday: schedule("hoursWednesday"), hoursThursday: schedule("hoursThursday"),
    hoursFriday: schedule("hoursFriday"), hoursSaturday: schedule("hoursSaturday"), hoursSunday: schedule("hoursSunday"),
  };
}
