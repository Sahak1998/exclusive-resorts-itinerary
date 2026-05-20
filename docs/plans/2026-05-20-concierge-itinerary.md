# Concierge Itinerary Proposal System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a single Next.js 14 app where a concierge can curate a luxury-travel itinerary proposal, send it (mock email), and the member can review/approve/pay via an unguessable link.

**Architecture:** Single Next.js 14 App Router project. Route Handlers expose REST-style endpoints over Prisma+SQLite. Tailwind + shadcn/ui for UI. Zod validates at API boundary. Vitest covers API happy path. UUIDs for every model id; member access is via unguessable `/proposal/[uuid]`.

**Tech Stack:** Next.js 14 (App Router), TypeScript strict, Tailwind CSS, shadcn/ui, Prisma + SQLite, Zod, SWR, Framer Motion, Vitest.

**Design doc:** `docs/plans/2026-05-20-concierge-itinerary-design.md`

**Project root:** `/Users/eviphone/Desktop/exclusive-resorts-itinerary`

**Git identity (already configured):** `sahak <sah.iskanyan3@gmail.com>`

---

## Task 1: Scaffold Next.js 14 + TypeScript + Tailwind

**Files:**
- Create: entire `create-next-app` scaffold at project root
- Create: `.gitignore` already added by template

**Step 1: Run scaffolder**

Run from `/Users/eviphone/Desktop/exclusive-resorts-itinerary`:

```bash
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbo --use-npm
```

When prompted to overwrite design doc dir, choose **No** (template should not touch `docs/`).

**Step 2: Verify scaffold**

Run: `ls src/app && cat tsconfig.json | head -20`
Expected: see `page.tsx`, `layout.tsx`, `globals.css`; tsconfig has `"strict": true`.

**Step 3: Enable stricter TS**

Edit `tsconfig.json`: add `"noUncheckedIndexedAccess": true` to `compilerOptions`.

**Step 4: First commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 14 app with TS + Tailwind"
```

---

## Task 2: Install runtime + dev dependencies

**Step 1: Install runtime deps**

```bash
npm install @prisma/client zod swr framer-motion clsx tailwind-merge class-variance-authority lucide-react date-fns
```

**Step 2: Install dev deps**

```bash
npm install -D prisma vitest @vitest/ui tsx @types/node
```

**Step 3: Verify**

Run: `npm ls --depth=0`
Expected: all listed packages appear with no UNMET PEER errors.

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add prisma, zod, swr, framer-motion, vitest"
```

---

## Task 3: Initialize Prisma with SQLite

**Files:**
- Create: `prisma/schema.prisma`
- Create: `.env`

**Step 1: Init Prisma**

```bash
npx prisma init --datasource-provider sqlite
```

**Step 2: Replace `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model Member {
  id           String        @id @default(uuid())
  name         String
  email        String        @unique
  reservations Reservation[]
}

model Reservation {
  id            String     @id @default(uuid())
  memberId      String
  member        Member     @relation(fields: [memberId], references: [id])
  destination   String
  villa         String
  arrivalDate   DateTime
  departureDate DateTime
  proposals     Proposal[]
}

model Proposal {
  id            String         @id @default(uuid())
  reservationId String
  reservation   Reservation    @relation(fields: [reservationId], references: [id])
  status        String         @default("draft")
  notes         String?
  createdAt     DateTime       @default(now())
  sentAt        DateTime?
  approvedAt    DateTime?
  paidAt        DateTime?
  items         ProposalItem[]
  emails        SentEmail[]
}

model ProposalItem {
  id          String   @id @default(uuid())
  proposalId  String
  proposal    Proposal @relation(fields: [proposalId], references: [id], onDelete: Cascade)
  category    String
  title       String
  description String
  scheduledAt DateTime
  priceCents  Int
  sortOrder   Int      @default(0)
}

model SentEmail {
  id          String   @id @default(uuid())
  proposalId  String
  proposal    Proposal @relation(fields: [proposalId], references: [id])
  toEmail     String
  sentAt      DateTime @default(now())
  bodyPreview String
}
```

**Step 3: Ensure `.env` points to local SQLite**

`.env` should contain:
```
DATABASE_URL="file:./dev.db"
```

**Step 4: Create initial migration**

```bash
npx prisma migrate dev --name init
```

Expected: migration created under `prisma/migrations/`, `dev.db` generated, Prisma Client installed.

**Step 5: Add `.env` and `prisma/dev.db*` to gitignore**

Edit `.gitignore`, append:
```
.env
prisma/dev.db
prisma/dev.db-journal
```

**Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations .gitignore
git commit -m "feat(db): prisma schema + initial migration"
```

---

## Task 4: Prisma client singleton + seed

**Files:**
- Create: `src/lib/db.ts`
- Create: `prisma/seed.ts`
- Modify: `package.json` (add `prisma.seed` config)

**Step 1: Write Prisma singleton**

`src/lib/db.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error", "warn"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Step 2: Write seed**

`prisma/seed.ts`:
```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
```

**Step 3: Wire seed in package.json**

Add to `package.json`:
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

Also add scripts:
```json
"db:migrate": "prisma migrate deploy",
"db:seed": "prisma db seed",
"db:reset": "prisma migrate reset --force",
"postinstall": "prisma generate"
```

(Do **not** auto-run migrate+seed on `postinstall`; we run them in `dev` script — see Task 11.)

**Step 4: Run seed**

```bash
npm run db:seed
```

Expected: "Seeded member + reservation."

**Step 5: Commit**

```bash
git add src/lib/db.ts prisma/seed.ts package.json package-lock.json
git commit -m "feat(db): prisma client singleton + seed James Whitfield"
```

---

## Task 5: Shared lib — Zod schemas, categories, formatters

**Files:**
- Create: `src/lib/categories.ts`
- Create: `src/lib/format.ts`
- Create: `src/lib/schemas.ts`
- Create: `src/lib/state.ts`

**Step 1: Categories**

`src/lib/categories.ts`:
```typescript
export const CATEGORIES = [
  { id: "dining",      label: "Dining",      examples: "Private chef dinner, restaurant reservation" },
  { id: "activities",  label: "Activities",  examples: "Surf lesson, snorkeling, ATV tour" },
  { id: "wellness",    label: "Wellness",    examples: "Spa treatment, yoga session, massage" },
  { id: "excursions",  label: "Excursions",  examples: "Whale watching, sailing charter, cultural tour" },
  { id: "transport",   label: "Transport",   examples: "Airport transfer, private car, helicopter" },
  { id: "experiences", label: "Experiences", examples: "Sunset cocktails, bonfire, tequila tasting" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as readonly CategoryId[];
```

**Step 2: Formatters**

`src/lib/format.ts`:
```typescript
export const formatMoney = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    .format(cents / 100);

export const formatDateLong = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

export const formatTime = (d: Date | string) =>
  new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export const formatDayKey = (d: Date | string) => new Date(d).toISOString().slice(0, 10);
```

**Step 3: State machine**

`src/lib/state.ts`:
```typescript
export const STATUSES = ["draft", "sent", "approved", "paid"] as const;
export type Status = (typeof STATUSES)[number];

const NEXT: Record<Status, Status[]> = {
  draft:    ["sent"],
  sent:     ["approved"],
  approved: ["paid"],
  paid:     [],
};

export const canTransition = (from: Status, to: Status) => NEXT[from].includes(to);
```

**Step 4: Zod schemas**

`src/lib/schemas.ts`:
```typescript
import { z } from "zod";
import { CATEGORY_IDS } from "./categories";
import { STATUSES } from "./state";

export const proposalItemInputSchema = z.object({
  category: z.enum(CATEGORY_IDS as unknown as [string, ...string[]]),
  title: z.string().min(1).max(120),
  description: z.string().max(1000).default(""),
  scheduledAt: z.string().datetime(),
  priceCents: z.number().int().nonnegative(),
});

export const proposalCreateSchema = z.object({
  reservationId: z.string().uuid(),
  notes: z.string().max(2000).optional(),
});

export const proposalPatchSchema = z.object({
  status: z.enum(STATUSES).optional(),
  notes: z.string().max(2000).optional(),
});

export const proposalItemPatchSchema = proposalItemInputSchema.partial().extend({
  sortOrder: z.number().int().optional(),
});

export type ProposalItemInput = z.infer<typeof proposalItemInputSchema>;
export type ProposalCreateInput = z.infer<typeof proposalCreateSchema>;
export type ProposalPatchInput = z.infer<typeof proposalPatchSchema>;
```

**Step 5: Commit**

```bash
git add src/lib
git commit -m "feat(lib): categories, formatters, state machine, zod schemas"
```

---

## Task 6: Vitest setup + test DB helper

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/helpers/db.ts`
- Modify: `package.json` (test script)

**Step 1: vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    pool: "forks",
    poolOptions: { forks: { singleFork: true } },
    setupFiles: ["./tests/helpers/setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
```

**Step 2: tests/helpers/setup.ts**

```typescript
import { execSync } from "node:child_process";
import { beforeAll, afterEach } from "vitest";
import { prisma } from "@/lib/db";

process.env.DATABASE_URL = "file:./test.db";

beforeAll(() => {
  execSync("npx prisma migrate deploy", { stdio: "ignore", env: process.env });
});

afterEach(async () => {
  await prisma.sentEmail.deleteMany();
  await prisma.proposalItem.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.member.deleteMany();
});
```

**Step 3: tests/helpers/db.ts**

```typescript
import { prisma } from "@/lib/db";

export async function seedMemberAndReservation() {
  const member = await prisma.member.create({
    data: { name: "James Whitfield", email: "james.whitfield@example.com" },
  });
  const reservation = await prisma.reservation.create({
    data: {
      memberId: member.id,
      destination: "Punta Mita, Mexico",
      villa: "Villa Punta Mita",
      arrivalDate: new Date("2026-03-15T15:00:00Z"),
      departureDate: new Date("2026-03-22T11:00:00Z"),
    },
  });
  return { member, reservation };
}
```

**Step 4: Add test scripts**

In `package.json` scripts:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 5: Smoke test**

`tests/smoke.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { seedMemberAndReservation } from "./helpers/db";

describe("smoke", () => {
  it("seeds member + reservation", async () => {
    const { member, reservation } = await seedMemberAndReservation();
    expect(member.email).toBe("james.whitfield@example.com");
    expect(reservation.villa).toBe("Villa Punta Mita");
  });
});
```

Run: `npm test`
Expected: 1 passed.

**Step 6: Commit**

```bash
git add vitest.config.ts tests package.json package-lock.json
git commit -m "test: vitest config + db helpers + smoke test"
```

---

## Task 7: API — `GET /api/reservations` (TDD)

**Files:**
- Create: `tests/api/reservations.test.ts`
- Create: `src/app/api/reservations/route.ts`

**Step 1: Write failing test**

```typescript
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
```

**Step 2: Run, expect fail**

```bash
npm test -- tests/api/reservations.test.ts
```

Expected: import error for `@/app/api/reservations/route`.

**Step 3: Implement**

`src/app/api/reservations/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const reservation = await prisma.reservation.findFirst({
    orderBy: { arrivalDate: "asc" },
    include: { member: true },
  });
  if (!reservation) return NextResponse.json({ error: "No reservation" }, { status: 404 });
  return NextResponse.json(reservation);
}
```

**Step 4: Run, expect pass**

```bash
npm test -- tests/api/reservations.test.ts
```

Expected: 1 passed.

**Step 5: Commit**

```bash
git add tests/api/reservations.test.ts src/app/api/reservations/route.ts
git commit -m "feat(api): GET /api/reservations"
```

---

## Task 8: API — Proposals collection (`POST` + `GET /api/proposals`)

**Files:**
- Create: `tests/api/proposals.test.ts`
- Create: `src/app/api/proposals/route.ts`

**Step 1: Write failing tests**

```typescript
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
```

**Step 2: Run, expect fail.**

**Step 3: Implement**

`src/app/api/proposals/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { proposalCreateSchema } from "@/lib/schemas";

export async function GET() {
  const proposals = await prisma.proposal.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, reservation: { include: { member: true } } },
  });
  return NextResponse.json(proposals);
}

export async function POST(req: Request) {
  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = proposalCreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }
  const reservation = await prisma.reservation.findUnique({ where: { id: parsed.data.reservationId } });
  if (!reservation) return NextResponse.json({ error: "Reservation not found" }, { status: 404 });

  const proposal = await prisma.proposal.create({
    data: { reservationId: parsed.data.reservationId, notes: parsed.data.notes ?? null, status: "draft" },
    include: { items: true },
  });
  return NextResponse.json(proposal, { status: 201 });
}
```

**Step 4: Run, expect pass.**

**Step 5: Commit**

```bash
git add tests/api/proposals.test.ts src/app/api/proposals/route.ts
git commit -m "feat(api): POST + GET /api/proposals with zod validation"
```

---

## Task 9: API — Single proposal (`GET` + `PATCH /api/proposals/[id]`) with state machine

**Files:**
- Create: `tests/api/proposal-detail.test.ts`
- Create: `src/app/api/proposals/[id]/route.ts`

**Step 1: Write failing tests**

```typescript
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
```

**Step 2: Run, expect fail.**

**Step 3: Implement**

`src/app/api/proposals/[id]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { proposalPatchSchema } from "@/lib/schemas";
import { canTransition, type Status } from "@/lib/state";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: params.id },
    include: {
      items: { orderBy: [{ scheduledAt: "asc" }, { sortOrder: "asc" }] },
      reservation: { include: { member: true } },
    },
  });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(proposal);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const existing = await prisma.proposal.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = proposalPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;

  if (parsed.data.status && parsed.data.status !== existing.status) {
    if (!canTransition(existing.status as Status, parsed.data.status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${existing.status} to ${parsed.data.status}` },
        { status: 409 },
      );
    }
    data.status = parsed.data.status;
    const now = new Date();
    if (parsed.data.status === "sent") data.sentAt = now;
    if (parsed.data.status === "approved") data.approvedAt = now;
    if (parsed.data.status === "paid") data.paidAt = now;
  }

  const updated = await prisma.proposal.update({
    where: { id: params.id },
    data,
    include: { items: true, reservation: { include: { member: true } } },
  });
  return NextResponse.json(updated);
}
```

**Step 4: Run, expect pass.**

**Step 5: Commit**

```bash
git add tests/api/proposal-detail.test.ts src/app/api/proposals/[id]/route.ts
git commit -m "feat(api): GET + PATCH /api/proposals/[id] with state-machine guard"
```

---

## Task 10: API — Proposal items (`POST /items`, `PATCH/DELETE /items/[itemId]`)

**Files:**
- Create: `tests/api/proposal-items.test.ts`
- Create: `src/app/api/proposals/[id]/items/route.ts`
- Create: `src/app/api/proposals/[id]/items/[itemId]/route.ts`

**Step 1: Write failing tests**

```typescript
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
```

**Step 2: Run, expect fail.**

**Step 3: Implement collection route**

`src/app/api/proposals/[id]/items/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { proposalItemInputSchema } from "@/lib/schemas";

type Ctx = { params: { id: string } };

export async function POST(req: Request, { params }: Ctx) {
  const proposal = await prisma.proposal.findUnique({ where: { id: params.id } });
  if (!proposal) return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  if (proposal.status !== "draft") {
    return NextResponse.json({ error: "Can only edit items on a draft proposal" }, { status: 409 });
  }

  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = proposalItemInputSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const last = await prisma.proposalItem.findFirst({
    where: { proposalId: params.id },
    orderBy: { sortOrder: "desc" },
  });

  const item = await prisma.proposalItem.create({
    data: {
      proposalId: params.id,
      category: parsed.data.category,
      title: parsed.data.title,
      description: parsed.data.description,
      scheduledAt: new Date(parsed.data.scheduledAt),
      priceCents: parsed.data.priceCents,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json(item, { status: 201 });
}
```

**Step 4: Implement item route**

`src/app/api/proposals/[id]/items/[itemId]/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { proposalItemPatchSchema } from "@/lib/schemas";

type Ctx = { params: { id: string; itemId: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const item = await prisma.proposalItem.findUnique({
    where: { id: params.itemId },
    include: { proposal: true },
  });
  if (!item || item.proposalId !== params.id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (item.proposal.status !== "draft") {
    return NextResponse.json({ error: "Can only edit items on a draft proposal" }, { status: 409 });
  }

  let json: unknown;
  try { json = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = proposalItemPatchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.scheduledAt) data.scheduledAt = new Date(parsed.data.scheduledAt);

  const updated = await prisma.proposalItem.update({ where: { id: params.itemId }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const item = await prisma.proposalItem.findUnique({
    where: { id: params.itemId },
    include: { proposal: true },
  });
  if (!item || item.proposalId !== params.id) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (item.proposal.status !== "draft") {
    return NextResponse.json({ error: "Can only edit items on a draft proposal" }, { status: 409 });
  }
  await prisma.proposalItem.delete({ where: { id: params.itemId } });
  return new NextResponse(null, { status: 204 });
}
```

**Step 5: Run, expect pass.**

**Step 6: Commit**

```bash
git add tests/api/proposal-items.test.ts src/app/api/proposals/[id]/items
git commit -m "feat(api): proposal item CRUD (draft-only)"
```

---

## Task 11: API — `POST /api/proposals/[id]/send` (mock email)

**Files:**
- Create: `tests/api/send.test.ts`
- Create: `src/app/api/proposals/[id]/send/route.ts`

**Step 1: Write failing tests**

```typescript
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
    expect(updated?.emails[0].toEmail).toBe("james.whitfield@example.com");
  });

  it("409 if not draft", async () => {
    const p = await makeDraftWithItem();
    await prisma.proposal.update({ where: { id: p.id }, data: { status: "sent", sentAt: new Date() } });
    const res = await POST(new Request("http://test", { method: "POST" }), { params: { id: p.id } });
    expect(res.status).toBe(409);
  });
});
```

**Step 2: Run, expect fail.**

**Step 3: Implement**

`src/app/api/proposals/[id]/send/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

type Ctx = { params: { id: string } };

export async function POST(_req: Request, { params }: Ctx) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: params.id },
    include: { items: true, reservation: { include: { member: true } } },
  });
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (proposal.status !== "draft") {
    return NextResponse.json({ error: `Cannot send a ${proposal.status} proposal` }, { status: 409 });
  }
  if (proposal.items.length === 0) {
    return NextResponse.json({ error: "Cannot send an empty proposal" }, { status: 400 });
  }

  const now = new Date();
  const total = proposal.items.reduce((sum, i) => sum + i.priceCents, 0);
  const bodyPreview = `Itinerary for ${proposal.reservation.member.name} at ${proposal.reservation.villa} — ${proposal.items.length} items, $${(total / 100).toFixed(0)}. Review: /proposal/${proposal.id}`;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.sentEmail.create({
      data: {
        proposalId: proposal.id,
        toEmail: proposal.reservation.member.email,
        bodyPreview,
      },
    });
    return tx.proposal.update({
      where: { id: proposal.id },
      data: { status: "sent", sentAt: now },
      include: { items: true, emails: true, reservation: { include: { member: true } } },
    });
  });

  console.log(`[MOCK EMAIL] To: ${proposal.reservation.member.email}\n${bodyPreview}`);
  return NextResponse.json(updated);
}
```

**Step 4: Run, expect pass.**

**Step 5: Commit**

```bash
git add tests/api/send.test.ts src/app/api/proposals/[id]/send/route.ts
git commit -m "feat(api): POST /api/proposals/[id]/send with mock email log"
```

---

## Task 12: shadcn/ui setup + base theme

**Step 1: Initialize shadcn**

```bash
npx shadcn@latest init -d
```

Choose defaults: TS, RSC, slate base color, CSS variables yes, `src/components`, `src/lib/utils`.

**Step 2: Add primitives we need**

```bash
npx shadcn@latest add button card dialog input textarea select badge label toast separator
```

**Step 3: Update `src/app/globals.css`**

Append a luxury palette override (cream / deep emerald). At end of `globals.css`:

```css
@layer base {
  :root {
    --brand: 158 64% 24%;     /* deep emerald */
    --brand-foreground: 0 0% 100%;
    --cream: 36 33% 96%;
  }
  body { font-feature-settings: "ss01", "cv11"; }
}
.font-serif { font-family: ui-serif, "Iowan Old Style", "Apple Garamond", Georgia, serif; }
```

**Step 4: Commit**

```bash
git add -A
git commit -m "chore(ui): shadcn init + luxury palette base"
```

---

## Task 13: Concierge dashboard page (`/`)

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/components/concierge/ReservationBanner.tsx`
- Create: `src/components/concierge/ProposalList.tsx`
- Create: `src/components/concierge/ItineraryBuilder.tsx`
- Create: `src/components/concierge/AddItemDialog.tsx`
- Create: `src/components/concierge/ItemRow.tsx`
- Create: `src/components/concierge/SendButton.tsx`
- Create: `src/components/concierge/CopyLinkToast.tsx`
- Create: `src/lib/fetcher.ts`

**Step 1: SWR fetcher**

`src/lib/fetcher.ts`:
```typescript
export const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
};
```

**Step 2: ReservationBanner**

Renders member name, villa, arrival → departure (large, serif headline).

**Step 3: ProposalList**

`useSWR("/api/proposals")`. Each row: created date, item count, status pill. Selected row highlighted; clicking sets the active proposal id (managed in `page.tsx` via `useState`).

**Step 4: AddItemDialog**

shadcn `Dialog`. Form: select category, title, description (textarea), datetime-local (constrained between arrival/departure), price (USD input, multiply by 100 on submit). On submit `POST /api/proposals/[id]/items`, then call `mutate` on the proposal SWR key.

**Step 5: ItemRow**

Shows category badge, title, description, scheduledAt formatted, priceMoney. Edit (opens dialog prefilled, PATCH) + Delete (with confirm) actions, both draft-only.

**Step 6: ItineraryBuilder**

Active proposal panel. Notes textarea (PATCH on blur). List of `ItemRow`. Add Item button. Running total at bottom. Empty state when none.

**Step 7: SendButton**

Disabled unless status === "draft" && items.length > 0. On click: `POST /send`. On success: show `CopyLinkToast` with the `/proposal/[id]` URL and a copy button.

**Step 8: page.tsx assembly**

```typescript
// Three-column layout: list | builder | preview placeholder
// On mount: SWR fetches /api/reservations and /api/proposals
// Local state: activeProposalId, selectedTab
// "New proposal" button at top-left creates a draft (POST /api/proposals) using the reservation id
```

**Step 9: Manual smoke**

```bash
npm run dev
```

Visit `http://localhost:3000`. Verify: banner shows James + villa + dates. "New proposal" creates a draft and selects it. Add an item from each category. Edit and delete work. Total updates. Send button enables after one item; clicking flips status to "sent" and shows the copy-link toast.

**Step 10: Commit**

```bash
git add -A
git commit -m "feat(ui): concierge dashboard with itinerary builder + send flow"
```

---

## Task 14: Member view (`/proposal/[id]`)

**Files:**
- Create: `src/app/proposal/[id]/page.tsx`
- Create: `src/components/member/Hero.tsx`
- Create: `src/components/member/NotesBlock.tsx`
- Create: `src/components/member/Timeline.tsx`
- Create: `src/components/member/StickyFooter.tsx`
- Create: `src/components/member/PaidConfirmation.tsx`

**Step 1: Hero**

Full-bleed gradient (`bg-gradient-to-br from-emerald-900 via-emerald-700 to-amber-200`). Serif title: villa name. Subtitle: "James — March 15 to 22, 2026". Generous padding, slow fade-in.

**Step 2: NotesBlock**

If `proposal.notes`, render as italic serif quote, narrow column.

**Step 3: Timeline (stretch — day-by-day)**

Group items by `formatDayKey(scheduledAt)`. For each day: H2 with `formatDateLong`, then vertical list of items showing time, category icon (lucide-react), title, description, price.

**Step 4: StickyFooter**

Sticky bottom. Left: large total. Right: state-aware buttons:
- status === "sent" → Approve button (`PATCH { status: "approved" }`)
- status === "approved" → "Pay & Lock In" button (`PATCH { status: "paid" }`); also "Awaiting payment" banner above footer
- status === "paid" → hide footer, mount `PaidConfirmation`

**Step 5: PaidConfirmation**

Framer Motion: fade + scale a centered check circle, then headline "We can't wait to welcome you, James." Subtitle with itinerary count + total.

**Step 6: page.tsx**

Server Component fetches the proposal via Prisma directly (`await prisma.proposal.findUnique(...)`). 404 if missing. Hand off to a Client Component (`MemberProposalClient`) that owns mutation state via SWR (`useSWR(/api/proposals/${id})`).

**Step 7: Manual smoke**

In dashboard, send a proposal → copy link → open `/proposal/[id]` in another tab. Verify: gradient hero, notes (if added), day-by-day items, total. Click Approve → state flips. Click Pay & Lock In → paid confirmation animates in.

**Step 8: Commit**

```bash
git add -A
git commit -m "feat(ui): premium member view with timeline + approve/pay flow"
```

---

## Task 15: One-command dev script + auto-migrate

**Files:**
- Modify: `package.json`

**Step 1: Update `dev` script**

```json
"dev": "prisma migrate deploy && prisma db seed && next dev",
"build": "prisma migrate deploy && next build",
"start": "next start"
```

(Seed is idempotent: uses `upsert` on member, `findFirst` on reservation.)

**Step 2: Verify**

```bash
rm -f prisma/dev.db prisma/dev.db-journal
npm run dev
```

Expected: migrations applied, seed runs, Next.js starts on `:3000`, dashboard usable.

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: one-command dev script with migrate+seed"
```

---

## Task 16: README

**Files:**
- Create / overwrite: `README.md`

**Step 1: Write README**

Sections:
- **Concierge Itinerary Proposal System** (one-line description)
- **Quick start** — `npm install && npm run dev` then open `http://localhost:3000`.
- **Stack** — Next.js 14 App Router, TypeScript, Tailwind, shadcn/ui, Prisma + SQLite, Zod, SWR, Framer Motion, Vitest.
- **Scenario** — James Whitfield, Villa Punta Mita, Mar 15–22 (seeded).
- **Flows**
  - Concierge `/`: build itinerary → preview → send → copy share link.
  - Member `/proposal/[id]`: review → approve → pay → confirmation.
- **API** — table of routes with method + purpose.
- **Data model** — short prose summary + diagram link to design doc.
- **Auth & access control** — explicit callout: there is no auth. Member access is via an **unguessable UUID link**, the same soft-control pattern used by Stripe payment links and Calendly invites. In production I'd swap this for signed/expiring links (JWT or `next-auth` `verify-request` flow) and require concierge login (SSO via Okta or Google Workspace). Documented as a deliberate scope tradeoff, not an oversight.
- **Assumptions** — single hardcoded member/reservation; `console.log` instead of real email; `priceCents` Int to avoid float drift; status as string + Zod validation rather than DB enum to keep SQLite/Prisma frictionless.
- **Testing** — `npm test` runs Vitest API tests covering the full happy path (create → add item → send → approve → pay). UI verified via the Loom walkthrough rather than component tests, given the time box.
- **What I'd improve given more time** — signed/expiring share links + NextAuth concierge SSO, real email (Resend/SES), Stripe Checkout for "Pay & Lock In", item drag-reorder via dnd-kit, image uploads to S3 for premium item cards, multi-tenant member support, Playwright E2E, accessibility audit (focus rings, ARIA on dialog).
- **What was interesting / challenging** — designing the state machine and what timestamps to stamp, balancing concierge density vs member elegance from the same component primitives, and choosing UUIDs as a deliberate soft access control instead of bolting on auth that wasn't asked for.

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: README with run instructions, assumptions, auth rationale"
```

---

## Task 17: Final verification

**Step 1: Clean install + run**

```bash
rm -rf node_modules prisma/dev.db prisma/dev.db-journal
npm install
npm run dev
```

Walk the full flow in the browser:
1. Dashboard loads at `/`, banner shows James + villa.
2. Create new proposal.
3. Add one item from each of the 6 categories.
4. Edit one, delete one.
5. Type a concierge note.
6. Total updates correctly.
7. Send proposal → status flips, copy link toast appears.
8. Open `/proposal/[id]` in incognito tab.
9. Verify hero, notes, day-by-day timeline, total.
10. Approve → state changes.
11. Pay & Lock In → animated confirmation.

**Step 2: Run all tests**

```bash
npm test
```

Expected: all green.

**Step 3: Tag**

```bash
git tag v1.0.0
git log --oneline
```

**Step 4: Final commit if anything tweaked during walkthrough**

```bash
git add -A
git commit -m "chore: polish from final walkthrough"
```

---

## Out of scope (do not implement)

- Real auth / login / OAuth
- Real email sending
- Real payment processing
- Image uploads / CDN
- Multi-member support beyond seeded record
- Drag-reorder (sortOrder field exists but reorder UI is deferred — call out in README)
- Component-level UI tests
