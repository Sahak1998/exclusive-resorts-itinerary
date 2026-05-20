import { prisma } from "@/lib/db";

export async function seedMemberAndReservation() {
  const member = await prisma.member.create({
    data: { name: "James Whitfield", email: "james.whitfield@example.com" },
  });
  const reservation = await prisma.reservation.create({
    data: {
      memberId: member.id,
      destination: "Punta Mita, Mexico",
      villa: "Villa Punta Mita",
      arrivalDate: new Date("2026-03-15T15:00:00Z"),
      departureDate: new Date("2026-03-22T11:00:00Z"),
    },
  });
  return { member, reservation };
}
