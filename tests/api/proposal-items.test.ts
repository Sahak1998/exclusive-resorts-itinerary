import { describe, it, expect } from "vitest";
import { POST as addItem } from "@/app/api/proposals/[id]/items/route";
import { PATCH as patchItem, DELETE as deleteItem } from "@/app/api/proposals/[id]/items/[itemId]/route";
import { prisma } from "@/lib/db";
import { seedMemberAndReservation } from "../helpers/db";

async function makeDraft() {
  const { reservation } = await seedMemberAndReservation();
  return prisma.proposal.create({ data: { reservationId: reservation.id, status: "draft" } });
}

const sample = {
  category: "dining",
  title: "Private chef dinner",
  description: "Beachfront, 4-course",
  scheduledAt: "2026-03-16T20:00:00.000Z",
  priceCents: 75000,
};

describe("Proposal items", () => {
  it("adds an item to a draft", async () => {
    const p = await makeDraft();
    const res = await addItem(
      new Request("http://test", { method: "POST", body: JSON.stringify(sample) }),
      { params: { id: p.id } },
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.title).toBe("Private chef dinner");
  });

  it("rejects invalid category", async () => {
    const p = await makeDraft();
    const res = await addItem(
      new Request("http://test", { method: "POST", body: JSON.stringify({ ...sample, category: "bogus" }) }),
      { params: { id: p.id } },
    );
    expect(res.status).toBe(400);
  });

  it("patches and deletes an item", async () => {
    const p = await makeDraft();
    const created = await prisma.proposalItem.create({
      data: { ...sample, scheduledAt: new Date(sample.scheduledAt), proposalId: p.id },
    });
    const patch = await patchItem(
      new Request("http://test", { method: "PATCH", body: JSON.stringify({ priceCents: 90000 }) }),
      { params: { id: p.id, itemId: created.id } },
    );
    expect((await patch.json()).priceCents).toBe(90000);

    const del = await deleteItem(new Request("http://test"), { params: { id: p.id, itemId: created.id } });
    expect(del.status).toBe(204);
    expect(await prisma.proposalItem.count({ where: { id: created.id } })).toBe(0);
  });
});
