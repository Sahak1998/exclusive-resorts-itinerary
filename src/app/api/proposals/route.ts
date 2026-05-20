import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { proposalCreateSchema } from "@/lib/schemas";

export async function GET() {
  const proposals = await prisma.proposal.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, reservation: { include: { member: true } } },
  });
  return NextResponse.json(proposals);
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = proposalCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const reservation = await prisma.reservation.findUnique({
    where: { id: parsed.data.reservationId },
  });
  if (!reservation) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });

  const proposal = await prisma.proposal.create({
    data: {
      reservationId: parsed.data.reservationId,
      notes: parsed.data.notes ?? null,
      status: "draft",
    },
    include: { items: true },
  });
  return NextResponse.json(proposal, { status: 201 });
}
