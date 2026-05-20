import { describe, it, expect } from "vitest";
import { GET, POST } from "@/app/api/proposals/route";
import { seedMemberAndReservation } from "../helpers/db";

const post = (body: unknown) =>
  POST(new Request("http://test/api/proposals", { method: "POST", body: JSON.stringify(body) }));

describe("POST /api/proposals", () => {
  it("creates a draft proposal", async () => {
    const { reservation } = await seedMemberAndReservation();
    const res = await post({ reservationId: reservation.id, notes: "Welcome James" });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.status).toBe("draft");
    expect(body.notes).toBe("Welcome James");
  });

  it("400 on invalid body", async () => {
    const res = await post({ reservationId: "not-a-uuid" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/proposals", () => {
  it("lists proposals with status", async () => {
    const { reservation } = await seedMemberAndReservation();
    await post({ reservationId: reservation.id });
    const res = await GET();
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].status).toBe("draft");
  });
});
