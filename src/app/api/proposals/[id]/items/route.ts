import { NextResponse } from "next/server";
import { proposalItemInputSchema } from "@/lib/schemas";
import { assertDraft, parseRequest } from "@/lib/api";
import { proposalsService } from "@/services/proposals.service";
import { proposalItemsService } from "@/services/proposal-items.service";

type Ctx = { params: { id: string } };

export async function POST(req: Request, { params }: Ctx) {
  const proposal = await proposalsService.findById(params.id);
  if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  const draftError = assertDraft(proposal.status);
  if (draftError) return draftError;

  const parsed = await parseRequest(req, proposalItemInputSchema);
  if (!parsed.ok) return parsed.response;

  const item = await proposalItemsService.appendToProposal(params.id, parsed.data);
  return NextResponse.json(item, { status: 201 });
}
