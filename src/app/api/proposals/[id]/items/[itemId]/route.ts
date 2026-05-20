import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { proposalItemPatchSchema } from "@/lib/schemas";

type Ctx = { params: { id: string; itemId: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const item = await prisma.proposalItem.findUnique({
    where: { id: params.itemId },
    include: { proposal: true },
  });
  if (!item || item.proposalId !== params.id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (item.proposal.status !== "draft") {
    return NextResponse.json({ error: "Can only edit items on a draft proposal" }, { status: 409 });
  }

  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = proposalItemPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.scheduledAt) data.scheduledAt = new Date(parsed.data.scheduledAt);

  const updated = await prisma.proposalItem.update({ where: { id: params.itemId }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const item = await prisma.proposalItem.findUnique({
    where: { id: params.itemId },
    include: { proposal: true },
  });
  if (!item || item.proposalId !== params.id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (item.proposal.status !== "draft") {
    return NextResponse.json({ error: "Can only edit items on a draft proposal" }, { status: 409 });
  }
  await prisma.proposalItem.delete({ where: { id: params.itemId } });
  return new NextResponse(null, { status: 204 });
}
