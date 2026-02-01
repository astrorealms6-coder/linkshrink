import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ code: string }> }
) {
  const { code } = await props.params;

  const link = await prisma.link.findUnique({ where: { code } });
  if (!link) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // delete click events first (FK)
  await prisma.clickEvent.deleteMany({ where: { linkId: link.id } });
  await prisma.link.delete({ where: { code } });

  return NextResponse.json({ ok: true });
}