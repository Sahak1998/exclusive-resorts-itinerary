import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { proposalItemInputSchema } from "@/lib/schemas";

type Ctx = { params: { id: string } };

export async function POST(req: Request, { params }: Ctx) {
  const proposal = await prisma.proposal.findUnique({ where: { id: params.id } });
  if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  if (proposal.status !== "draft") {
    return NextResponse.json({ error: "Can only edit items on a draft proposal" }, { status: 409 });
  }

  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = proposalItemInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

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
