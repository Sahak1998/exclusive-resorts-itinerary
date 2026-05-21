import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { proposalPatchSchema } from "@/lib/schemas";
import { canTransition, type Status } from "@/lib/state";
import { parseRequest } from "@/lib/api";

type Ctx = { params: { id: string } };

const STATUS_TIMESTAMP: Partial<Record<Status, "sentAt" | "approvedAt" | "paidAt">> = {
  sent: "sentAt",
  approved: "approvedAt",
  paid: "paidAt",
};

export async function GET(_req: Request, { params }: Ctx) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: params.id },
    include: {
      items: { orderBy: [{ scheduledAt: "asc" }, { sortOrder: "asc" }] },
      reservation: { include: { member: true } },
    },
  });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(proposal);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const existing = await prisma.proposal.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = await parseRequest(req, proposalPatchSchema);
  if (!parsed.ok) return parsed.response;

  const data: Record<string, unknown> = {};
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;

  if (parsed.data.status && parsed.data.status !== existing.status) {
    if (!canTransition(existing.status as Status, parsed.data.status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${existing.status} to ${parsed.data.status}` },
        { status: 409 },
      );
    }
    data.status = parsed.data.status;
    const stampField = STATUS_TIMESTAMP[parsed.data.status];
    if (stampField) data[stampField] = new Date();
  }

  const updated = await prisma.proposal.update({
    where: { id: params.id },
    data,
    include: { items: true, reservation: { include: { member: true } } },
  });
  return NextResponse.json(updated);
}
