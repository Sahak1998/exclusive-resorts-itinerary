import { NextResponse } from "next/server";
import { proposalItemPatchSchema } from "@/lib/schemas";
import { assertDraft, parseRequest } from "@/lib/api";
import { proposalItemsService } from "@/services/proposal-items.service";

type Ctx = { params: { id: string; itemId: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const item = await proposalItemsService.findWithProposal(params.itemId);
  if (!item || item.proposalId !== params.id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  const draftError = assertDraft(item.proposal.status);
  if (draftError) return draftError;

  const parsed = await parseRequest(req, proposalItemPatchSchema);
  if (!parsed.ok) return parsed.response;

  const updated = await proposalItemsService.update(params.itemId, parsed.data);
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const item = await proposalItemsService.findWithProposal(params.itemId);
  if (!item || item.proposalId !== params.id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  const draftError = assertDraft(item.proposal.status);
  if (draftError) return draftError;

  await proposalItemsService.delete(params.itemId);
  return new NextResponse(null, { status: 204 });
}
