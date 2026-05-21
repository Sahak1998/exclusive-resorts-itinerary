import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { proposalCreateSchema } from "@/lib/schemas";
import { parseRequest } from "@/lib/api";

export async function GET() {
  const proposals = await prisma.proposal.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, reservation: { include: { member: true } } },
  });
  return NextResponse.json(proposals);
}

export async function POST(req: Request) {
  const parsed = await parseRequest(req, proposalCreateSchema);
  if (!parsed.ok) return parsed.response;

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
