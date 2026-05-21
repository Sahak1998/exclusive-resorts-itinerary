import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { proposalItemPatchSchema } from "@/lib/schemas";
import { assertDraft, parseRequest } from "@/lib/api";

type Ctx = { params: { id: string; itemId: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const item = await prisma.proposalItem.findUnique({
    where: { id: params.itemId },
    include: { proposal: true },
  });
  if (!item || item.proposalId !== params.id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  const draftError = assertDraft(item.proposal.status);
  if (draftError) return draftError;

  const parsed = await parseRequest(req, proposalItemPatchSchema);
  if (!parsed.ok) return parsed.response;

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
  const draftError = assertDraft(item.proposal.status);
  if (draftError) return draftError;

  await prisma.proposalItem.delete({ where: { id: params.itemId } });
  return new NextResponse(null, { status: 204 });
}
