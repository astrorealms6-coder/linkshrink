import { PrismaClient } from "@prisma/client";
import { redirect, notFound } from "next/navigation";
import { headers } from "next/headers";

const prisma = new PrismaClient();

const RESERVED = new Set([
  "api",
  "favicon.ico",
  "dashboard",
  "login",
  "pricing",
  "signup",
]);

export default async function CodePage(props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params;

  if (!code || RESERVED.has(code)) return notFound();

  const link = await prisma.link.findUnique({ where: { code } });
  if (!link) return notFound();

  const h = await headers();
  const referrer = h.get("referer");
  const userAgent = h.get("user-agent");

  await prisma.$transaction([
    prisma.link.update({ where: { code }, data: { clicks: { increment: 1 } } }),
    prisma.clickEvent.create({
      data: {
        linkId: link.id,
        referrer: referrer ?? undefined,
        userAgent: userAgent ?? undefined,
      },
    }),
  ]);

  redirect(link.longUrl);
}