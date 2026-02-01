import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(_req: Request, props: { params: Promise<{ code: string }> }) {
  const { code } = await props.params;

  const link = await prisma.link.findUnique({ where: { code } });
  if (!link) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const recent = await prisma.clickEvent.findMany({
    where: { linkId: link.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { createdAt: true, referrer: true, userAgent: true },
  });

  return NextResponse.json({
    code: link.code,
    longUrl: link.longUrl,
    clicks: link.clicks,
    recent,
  });
}