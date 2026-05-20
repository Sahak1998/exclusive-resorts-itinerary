import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/reservations/route";
import { seedMemberAndReservation } from "../helpers/db";

describe("GET /api/reservations", () => {
  it("returns the seeded reservation", async () => {
    await seedMemberAndReservation();
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.villa).toBe("Villa Punta Mita");
    expect(body.member.name).toBe("James Whitfield");
  });
});
