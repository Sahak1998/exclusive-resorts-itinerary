import { NextResponse } from "next/server";
import { reservationsService } from "@/services/reservations.service";

export async function GET() {
  const reservation = await reservationsService.findEarliestWithMember();
  if (!reservation) return NextResponse.json({ error: "No reservation" }, { status: 404 });
  return NextResponse.json(reservation);
}
