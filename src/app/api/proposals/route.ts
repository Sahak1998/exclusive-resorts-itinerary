import { NextResponse } from "next/server";
import { proposalCreateSchema } from "@/lib/schemas";
import { parseRequest } from "@/lib/api";
import { proposalsService } from "@/services/proposals.service";
import { reservationsService } from "@/services/reservations.service";

export async function GET() {
  const proposals = await proposalsService.listAll();
  return NextResponse.json(proposals);
}

export async function POST(req: Request) {
  const parsed = await parseRequest(req, proposalCreateSchema);
  if (!parsed.ok) return parsed.response;

  const reservation = await reservationsService.findById(parsed.data.reservationId);
  if (!reservation) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });

  const proposal = await proposalsService.createDraft(
    parsed.data.reservationId,
    parsed.data.notes ?? null,
  );
  return NextResponse.json(proposal, { status: 201 });
}
