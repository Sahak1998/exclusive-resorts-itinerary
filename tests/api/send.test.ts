import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/proposals/[id]/send/route";
import { prisma } from "@/lib/db";
import { seedMemberAndReservation } from "../helpers/db";

async function makeDraftWithItem() {
  const { reservation } = await seedMemberAndReservation();
  return prisma.proposal.create({
    data: {
      reservationId: reservation.id,
      status: "draft",
      items: {
        create: [{
          category: "dining", title: "Private chef dinner", description: "",
          scheduledAt: new Date("2026-03-16T20:00:00Z"), priceCents: 75000, sortOrder: 0,
        }],
      },
    },
  });
}

describe("POST /api/proposals/[id]/send", () => {
  it("flips status to sent + records a SentEmail", async () => {
    const p = await makeDraftWithItem();
    const res = await POST(new Request("http://test", { method: "POST" }), { params: { id: p.id } });
    expect(res.status).toBe(200);
    const updated = await prisma.proposal.findUnique({ where: { id: p.id }, include: { emails: true } });
    expect(updated?.status).toBe("sent");
    expect(updated?.emails).toHaveLength(1);
    expect(updated?.emails[0]?.toEmail).toBe("james.whitfield@example.com");
  });

  it("409 if not draft", async () => {
    const p = await makeDraftWithItem();
    await prisma.proposal.update({ where: { id: p.id }, data: { status: "sent", sentAt: new Date() } });
    const res = await POST(new Request("http://test", { method: "POST" }), { params: { id: p.id } });
    expect(res.status).toBe(409);
  });
});
