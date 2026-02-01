import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const BodySchema = z.object({
  longUrl: z.string().min(1),
  customCode: z.string().optional().nullable(),
});

function normalizeUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

function isValidHttpUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function randomCode(length = 7) {
  const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function normalizeAlias(alias: string) {
  return alias.trim();
}

function isValidAlias(alias: string) {
  return /^[a-zA-Z0-9_-]{3,40}$/.test(alias);
}

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const longUrl = normalizeUrl(parsed.data.longUrl);
  if (!isValidHttpUrl(longUrl)) {
    return NextResponse.json({ error: "Invalid URL. Use http/https." }, { status: 400 });
  }

  const rawAlias = parsed.data.customCode ?? "";
  const alias = normalizeAlias(rawAlias);

  let codeToUse: string | null = null;

  // If alias provided: validate + ensure uniqueness
  if (alias.length > 0) {
    if (!isValidAlias(alias)) {
      return NextResponse.json(
        { error: "Alias must be 3-40 chars and contain only letters, numbers, '-' or '_'." },
        { status: 400 }
      );
    }

    const exists = await prisma.link.findUnique({ where: { code: alias } });
    if (exists) {
      return NextResponse.json({ error: "This alias is already taken. Try another." }, { status: 409 });
    }

    codeToUse = alias;
  } else {
    // No alias: generate random 6–8 char code
    for (let i = 0; i < 5; i++) {
      const candidate = randomCode(6 + Math.floor(Math.random() * 3));
      const exists = await prisma.link.findUnique({ where: { code: candidate } });
      if (!exists) {
        codeToUse = candidate;
        break;
      }
    }
  }

  if (!codeToUse) {
    return NextResponse.json({ error: "Could not generate a unique code" }, { status: 500 });
  }

  const link = await prisma.link.create({
    data: { code: codeToUse, longUrl },
  });

  const base = process.env.BASE_URL || "http://localhost:3000";
  const shortUrl = `${base.replace(/\/$/, "")}/${link.code}`;

  return NextResponse.json({ code: link.code, shortUrl, longUrl: link.longUrl });
}