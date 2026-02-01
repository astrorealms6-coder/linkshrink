import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const links = await prisma.link.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      code: true,
      longUrl: true,
      clicks: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ links });
}