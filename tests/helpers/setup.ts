import { execSync } from "node:child_process";
import { beforeAll, afterEach } from "vitest";
import { prisma } from "@/lib/db";

beforeAll(() => {
  execSync("npx prisma migrate deploy", {
    stdio: "ignore",
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
});

afterEach(async () => {
  await prisma.sentEmail.deleteMany();
  await prisma.proposalItem.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.member.deleteMany();
});
