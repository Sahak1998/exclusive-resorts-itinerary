import { prisma } from "@/lib/db";
import { getTotalPrice } from "@/lib/format";

type SendableProposal = Awaited<ReturnType<typeof loadSendable>>;

function loadSendable(id: string) {
  return prisma.proposal.findUnique({
    where: { id },
    include: { items: true, reservation: { include: { member: true } } },
  });
}

function buildEmailPreview(p: NonNullable<SendableProposal>) {
  const total = getTotalPrice(p.items);
  return `Itinerary for ${p.reservation.member.name} at ${p.reservation.villa} — ${p.items.length} items, $${(total / 100).toFixed(0)}. Review: /proposal/${p.id}`;
}

export const proposalSendService = {
  loadSendable,
  buildEmailPreview,

  async sendAndStamp(proposal: NonNullable<SendableProposal>) {
    const bodyPreview = buildEmailPreview(proposal);
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
        data: { status: "sent", sentAt: new Date() },
        include: { items: true, emails: true, reservation: { include: { member: true } } },
      });
    });
    console.log(`[MOCK EMAIL] To: ${proposal.reservation.member.email}\n${bodyPreview}`);
    return updated;
  },
};
