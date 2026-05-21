import { prisma } from "@/lib/db";
import type { Status } from "@/lib/state";

const STATUS_TIMESTAMP: Partial<Record<Status, "sentAt" | "approvedAt" | "paidAt">> = {
  sent: "sentAt",
  approved: "approvedAt",
  paid: "paidAt",
};

export const proposalsService = {
  listAll() {
    return prisma.proposal.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true, reservation: { include: { member: true } } },
    });
  },

  findById(id: string) {
    return prisma.proposal.findUnique({ where: { id } });
  },

  findDetail(id: string) {
    return prisma.proposal.findUnique({
      where: { id },
      include: {
        items: { orderBy: [{ scheduledAt: "asc" }, { sortOrder: "asc" }] },
        reservation: { include: { member: true } },
      },
    });
  },

  createDraft(reservationId: string, notes: string | null) {
    return prisma.proposal.create({
      data: { reservationId, notes, status: "draft" },
      include: { items: true },
    });
  },

  update(id: string, data: { notes?: string; status?: Status }) {
    const dbData: Record<string, unknown> = {};
    if (data.notes !== undefined) dbData.notes = data.notes;
    if (data.status) {
      dbData.status = data.status;
      const stampField = STATUS_TIMESTAMP[data.status];
      if (stampField) dbData[stampField] = new Date();
    }
    return prisma.proposal.update({
      where: { id },
      data: dbData,
      include: { items: true, reservation: { include: { member: true } } },
    });
  },
};
