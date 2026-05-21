import { prisma } from "@/lib/db";

export const reservationsService = {
  findEarliestWithMember() {
    return prisma.reservation.findFirst({
      orderBy: { arrivalDate: "asc" },
      include: { member: true },
    });
  },

  findById(id: string) {
    return prisma.reservation.findUnique({ where: { id } });
  },
};
