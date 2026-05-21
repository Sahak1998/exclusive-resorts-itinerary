import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getTotalPrice } from "@/lib/format";

type Ctx = { params: { id: string } };

export async function POST(_req: Request, { params }: Ctx) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: params.id },
    include: { items: true, reservation: { include: { member: true } } },
  });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (proposal.status !== "draft") {
    return NextResponse.json({ error: `Cannot send a ${proposal.status} proposal` }, { status: 409 });
  }
  if (proposal.items.length === 0) {
    return NextResponse.json({ error: "Cannot send an empty proposal" }, { status: 400 });
  }

  const now = new Date();
  const total = getTotalPrice(proposal.items);
  const bodyPreview = `Itinerary for ${proposal.reservation.member.name} at ${proposal.reservation.villa} — ${proposal.items.length} items, $${(total / 100).toFixed(0)}. Review: /proposal/${proposal.id}`;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.sentEmail.create({
      data: {
        proposalId: proposal.id,
        toEmail: proposal.reservation.member.email,
        bodyPreview,
      },
    });
    return tx.proposal.update({
      where: { id: proposal.id },
      data: { status: "sent", sentAt: now },
      include: { items: true, emails: true, reservation: { include: { member: true } } },
    });
  });

  console.log(`[MOCK EMAIL] To: ${proposal.reservation.member.email}\n${bodyPreview}`);
  return NextResponse.json(updated);
}
