import { describe, it, expect } from "vitest";
import { seedMemberAndReservation } from "./helpers/db";

describe("smoke", () => {
  it("seeds member + reservation", async () => {
    const { member, reservation } = await seedMemberAndReservation();
    expect(member.email).toBe("james.whitfield@example.com");
    expect(reservation.villa).toBe("Villa Punta Mita");
  });
});
