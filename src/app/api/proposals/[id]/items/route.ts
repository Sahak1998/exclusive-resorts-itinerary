import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { proposalItemInputSchema } from "@/lib/schemas";
import { assertDraft, parseRequest } from "@/lib/api";

type Ctx = { params: { id: string } };

export async function POST(req: Request, { params }: Ctx) {
  const proposal = await prisma.proposal.findUnique({ where: { id: params.id } });
  if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  const draftError = assertDraft(proposal.status);
  if (draftError) return draftError;

  const parsed = await parseRequest(req, proposalItemInputSchema);
  if (!parsed.ok) return parsed.response;

  const last = await prisma.proposalItem.findFirst({
    where: { proposalId: params.id },
    orderBy: { sortOrder: "desc" },
  });

  const item = await prisma.proposalItem.create({
    data: {
      proposalId: params.id,
      category: parsed.data.category,
      title: parsed.data.title,
      description: parsed.data.description,
      scheduledAt: new Date(parsed.data.scheduledAt),
      priceCents: parsed.data.priceCents,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
