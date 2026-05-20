import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const reservation = await prisma.reservation.findFirst({
    orderBy: { arrivalDate: "asc" },
    include: { member: true },
  });
  if (!reservation) return NextResponse.json({ error: "No reservation" }, { status: 404 });
  return NextResponse.json(reservation);
}
