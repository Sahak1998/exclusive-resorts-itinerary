import { describe, it, expect } from "vitest";
import { GET, PATCH } from "@/app/api/proposals/[id]/route";
import { prisma } from "@/lib/db";
import { seedMemberAndReservation } from "../helpers/db";

const ctx = (id: string) => ({ params: { id } });

async function makeDraft() {
  const { reservation } = await seedMemberAndReservation();
  return prisma.proposal.create({ data: { reservationId: reservation.id, status: "draft" } });
}

describe("GET /api/proposals/[id]", () => {
  it("returns 404 for unknown uuid", async () => {
    const res = await GET(new Request("http://test"), ctx("00000000-0000-0000-0000-000000000000"));
    expect(res.status).toBe(404);
  });

  it("returns proposal with items + reservation", async () => {
    const proposal = await makeDraft();
    const res = await GET(new Request("http://test"), ctx(proposal.id));
    const body = await res.json();
    expect(body.id).toBe(proposal.id);
    expect(body.reservation.villa).toBe("Villa Punta Mita");
  });
});

describe("PATCH /api/proposals/[id]", () => {
  it("blocks illegal transition draft -> paid", async () => {
    const proposal = await makeDraft();
    const res = await PATCH(
      new Request("http://test", { method: "PATCH", body: JSON.stringify({ status: "paid" }) }),
      ctx(proposal.id),
    );
    expect(res.status).toBe(409);
  });

  it("allows draft -> sent and stamps sentAt", async () => {
    const proposal = await makeDraft();
    const res = await PATCH(
      new Request("http://test", { method: "PATCH", body: JSON.stringify({ status: "sent" }) }),
      ctx(proposal.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("sent");
    expect(body.sentAt).toBeTruthy();
  });

  it("updates notes without status change", async () => {
    const proposal = await makeDraft();
    const res = await PATCH(
      new Request("http://test", { method: "PATCH", body: JSON.stringify({ notes: "New note" }) }),
      ctx(proposal.id),
    );
    const body = await res.json();
    expect(body.notes).toBe("New note");
    expect(body.status).toBe("draft");
  });
});
