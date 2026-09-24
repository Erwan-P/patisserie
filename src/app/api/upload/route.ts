import { NextResponse } from "next/server";
import { getVerifiedAdminSession } from "@/lib/admin-auth";
import { getPublicStorageUrl, getStorageClient, STORAGE_BUCKET } from "@/lib/storage";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 4 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getVerifiedAdminSession();
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }

    const extensions: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    if (!extensions[file.type]) {
      return NextResponse.json({ error: "Format d'image non autorisé." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "L'image ne doit pas dépasser 4 Mo." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isGif = buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.subarray(0, 6).toString("ascii"));
    const isWebp = buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
    const validContent = {
      "image/jpeg": isJpeg,
      "image/png": isPng,
      "image/webp": isWebp,
      "image/gif": isGif,
    }[file.type];
    if (!validContent) {
      return NextResponse.json({ error: "Le contenu du fichier ne correspond pas à une image valide." }, { status: 400 });
    }

    const filename = `${crypto.randomUUID()}.${extensions[file.type]}`;
    const now = new Date();
    const objectPath = `products/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${filename}`;
    const supabase = getStorageClient();
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(objectPath, buffer, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false,
    });

    if (error) {
      console.error("Supabase upload error:", error.message);
      return NextResponse.json({ error: "Le stockage de l'image a échoué." }, { status: 502 });
    }

    return NextResponse.json({ url: getPublicStorageUrl(objectPath) });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Erreur lors de l'upload de l'image." }, { status: 500 });
  }
}
