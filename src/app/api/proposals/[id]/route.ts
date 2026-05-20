import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { proposalPatchSchema } from "@/lib/schemas";
import { canTransition, type Status } from "@/lib/state";

type Ctx = { params: { id: string } };

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

  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = proposalPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

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
    const now = new Date();
    if (parsed.data.status === "sent") data.sentAt = now;
    if (parsed.data.status === "approved") data.approvedAt = now;
    if (parsed.data.status === "paid") data.paidAt = now;
  }

  const updated = await prisma.proposal.update({
    where: { id: params.id },
    data,
    include: { items: true, reservation: { include: { member: true } } },
  });
  return NextResponse.json(updated);
}
