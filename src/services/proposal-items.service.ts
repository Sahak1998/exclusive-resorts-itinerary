import { prisma } from "@/lib/db";
import type { ProposalItemInput } from "@/lib/schemas";

export const proposalItemsService = {
  findWithProposal(itemId: string) {
    return prisma.proposalItem.findUnique({
      where: { id: itemId },
      include: { proposal: true },
    });
  },

  async appendToProposal(proposalId: string, input: ProposalItemInput) {
    const last = await prisma.proposalItem.findFirst({
      where: { proposalId },
      orderBy: { sortOrder: "desc" },
    });
    return prisma.proposalItem.create({
      data: {
        proposalId,
        category: input.category,
        title: input.title,
        description: input.description,
        scheduledAt: new Date(input.scheduledAt),
        priceCents: input.priceCents,
        sortOrder: (last?.sortOrder ?? -1) + 1,
      },
    });
  },

  update(itemId: string, patch: Partial<ProposalItemInput> & { sortOrder?: number }) {
    const data: Record<string, unknown> = { ...patch };
    if (patch.scheduledAt) data.scheduledAt = new Date(patch.scheduledAt);
    return prisma.proposalItem.update({ where: { id: itemId }, data });
  },

  delete(itemId: string) {
    return prisma.proposalItem.delete({ where: { id: itemId } });
  },
};
