import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const adapter = new PrismaBetterSqlite3({ url });
const prisma = new PrismaClient({ adapter, log: ["error", "warn"] });

async function main() {
  const member = await prisma.member.upsert({
    where: { email: "james.whitfield@example.com" },
    update: {},
    create: {
      name: "James Whitfield",
      email: "james.whitfield@example.com",
    },
  });

  const existing = await prisma.reservation.findFirst({
    where: { memberId: member.id, villa: "Villa Punta Mita" },
  });
  if (!existing) {
    await prisma.reservation.create({
      data: {
        memberId: member.id,
        destination: "Punta Mita, Mexico",
        villa: "Villa Punta Mita",
        arrivalDate: new Date("2026-03-15T15:00:00Z"),
        departureDate: new Date("2026-03-22T11:00:00Z"),
      },
    });
  }
  console.log("Seeded member + reservation.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
