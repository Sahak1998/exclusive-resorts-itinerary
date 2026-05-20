# Concierge Itinerary Proposal System

A lightweight, single-app **Next.js 14** implementation of a luxury-travel concierge workflow. A concierge curates an itinerary proposal, sends it as a (mock) email, and the member reviews → approves → "pays" via an unguessable share link before they arrive.

Built for the Exclusive Resorts Full Stack Developer trial task.

---

## Quick start

```bash
npm install
npm run dev
```

Then open **http://localhost:3000**.

`npm run dev` runs `prisma migrate deploy && prisma db seed && next dev`, so the SQLite DB, schema, and the seeded member/reservation are ready on the first boot. No manual setup steps.

To run the API tests:

```bash
npm test
```

Expected: **15 / 15 passed** across 6 files.

---

## Stack

| Layer        | Choice                                                  |
| ------------ | ------------------------------------------------------- |
| Framework    | Next.js 14.2 (App Router)                               |
| Language     | TypeScript (strict, `noUncheckedIndexedAccess`)         |
| Styling      | Tailwind CSS + shadcn/ui (Radix-based primitives)       |
| Persistence  | SQLite via Prisma 7 + `@prisma/adapter-better-sqlite3`  |
| Validation   | Zod (shared schemas between API + client forms)         |
| Data fetching| SWR (with `mutate` for optimistic-feel revalidation)    |
| Animation    | Framer Motion (only on the paid confirmation screen)    |
| Testing      | Vitest (API-level, hitting the real route handlers)     |
| Icons        | lucide-react                                            |
| Notifications| sonner (toast)                                          |

---

## The scenario (seeded)

A single member is hardcoded via Prisma seed:

- **James Whitfield** — `james.whitfield@example.com`
- **Villa Punta Mita, Mexico** — arrival **March 15, 2026**, departure **March 22, 2026**

Both are created idempotently — re-running `npm run db:seed` is safe.

---

## Flows

### Concierge — `/`

1. Banner at the top shows James, the villa, and the trip dates.
2. **+ New proposal** creates a draft against the seeded reservation.
3. **Add item** opens a dialog: pick one of the six categories (Dining, Activities, Wellness, Excursions, Transport, Experiences), fill in title, description, datetime (constrained to the trip window), and price in USD.
4. Edit or delete any item while the proposal is still a draft.
5. Add a concierge **notes** message — rendered as an italic blockquote on the member view.
6. **Send proposal** flips the status to `sent`, writes a `SentEmail` row, logs `[MOCK EMAIL] To: …` to the server console, and pops a toast with a **Copy link** action containing the member share URL.

### Member — `/proposal/[uuid]`

1. Hero with the villa name, dates, and a deep-emerald gradient — sets the tone.
2. The concierge notes block, if any.
3. **Day-by-day timeline** — items grouped by date with a category icon, time, description, and price.
4. Sticky footer with the running total and a state-aware CTA:
   - `sent` → **Approve Itinerary**
   - `approved` → **Pay & Lock In**
   - `paid` → the whole page swaps to an animated confirmation screen ("We can't wait to welcome you, James.")

Draft proposals are deliberately **404** on this route — they exist only inside the concierge dashboard.

---

## API

All endpoints return JSON and accept JSON. All ids are UUIDs.

| Method | Path                                       | Purpose                                                 |
| ------ | ------------------------------------------ | ------------------------------------------------------- |
| GET    | `/api/reservations`                        | Current (only seeded) reservation + member              |
| GET    | `/api/proposals`                           | List all proposals with status + items                  |
| POST   | `/api/proposals`                           | Create a draft against a reservation                    |
| GET    | `/api/proposals/[id]`                      | Single proposal with items, ordered by `scheduledAt`    |
| PATCH  | `/api/proposals/[id]`                      | Update notes and/or transition status (state machine)   |
| POST   | `/api/proposals/[id]/send`                 | Flip draft → sent, write SentEmail, log mock email      |
| POST   | `/api/proposals/[id]/items`                | Add a line item (draft-only)                            |
| PATCH  | `/api/proposals/[id]/items/[itemId]`       | Edit a line item (draft-only)                           |
| DELETE | `/api/proposals/[id]/items/[itemId]`       | Remove a line item (draft-only)                         |

### State machine

`draft → sent → approved → paid`. Any other transition returns `409`. Timestamps (`sentAt`, `approvedAt`, `paidAt`) are stamped automatically on transition.

### Validation

All bodies are validated with Zod schemas in `src/lib/schemas.ts`. Failures return `400 { error, issues }`. The same schemas back the client-side forms — single source of truth.

---

## Data model

```
Member       — id (uuid), name, email (unique)
Reservation  — id (uuid), memberId, destination, villa, arrivalDate, departureDate
Proposal     — id (uuid), reservationId, status, notes?, createdAt, sentAt?, approvedAt?, paidAt?
ProposalItem — id (uuid), proposalId (cascade), category, title, description,
               scheduledAt, priceCents (Int), sortOrder
SentEmail    — id (uuid), proposalId, toEmail, sentAt, bodyPreview
```

Notes on the modelling decisions:

- **`priceCents Int`** rather than a decimal — avoids float drift on totals.
- **`status` as a string** rather than a DB enum — SQLite + Prisma 7 don't agree on native enum support; Zod enforces the four legal values at the API boundary instead.
- **`sortOrder`** is in place so concierge-side drag-reordering is a small lift later (the field is populated on insert; the UI for reordering is deferred).

---

## Auth & access control

There is **no auth in this submission**. The trial task description doesn't specify it, and login + session management would have crowded out the workflow this task is actually testing.

Instead, every model id (including `Proposal.id`) is a **UUID v4**, and the member-facing route `/proposal/[id]` only accepts that id. The link in a (real) email would therefore be unguessable — the same soft-control pattern used by Stripe payment links, Calendly invites, and Notion "anyone with the link" pages. Draft proposals additionally return **404** on that route, so the link only resolves once the concierge has explicitly sent the proposal.

In production I would:

- Sign the share link as a short-lived JWT (e.g. 14 days), so revocation and expiry are first-class.
- Put the concierge dashboard behind SSO (Google Workspace / Okta) via NextAuth — concierges are employees, the member-facing page is the only "public" surface.
- Move the `console.log` to a real transactional email provider (Resend, Postmark, or SES) and keep the existing `SentEmail` table as the audit log.

These are explicit scope choices, not oversights.

---

## Testing

`npm test` runs the Vitest API suite against a separate `test.db` (configured via `vitest.config.ts`). The suite covers the **full happy path**:

- `GET /api/reservations` returns the seeded reservation.
- `POST /api/proposals` creates drafts, rejects non-UUID `reservationId` with `400`.
- `GET /api/proposals` lists with status.
- `GET /api/proposals/[id]` returns 404 for unknown ids, includes reservation/items for known ones.
- `PATCH /api/proposals/[id]` blocks illegal transitions (`draft → paid` → `409`), allows legal ones, stamps `sentAt`, and updates notes without forcing a status change.
- `POST /api/proposals/[id]/items` validates category against the enum and rejects bogus values.
- `PATCH` and `DELETE` work for items belonging to a draft.
- `POST /api/proposals/[id]/send` transitions to `sent`, writes a `SentEmail` row with the right `toEmail`, and refuses to re-send a non-draft proposal.

UI was verified manually via the Loom walkthrough rather than component tests — a deliberate tradeoff given the time box.

---

## Project layout

```
exclusive-resorts-itinerary/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── page.tsx                         # concierge dashboard
│   │   ├── layout.tsx                       # mounts Sonner Toaster
│   │   ├── proposal/[id]/
│   │   │   ├── page.tsx                     # member view (RSC)
│   │   │   └── MemberProposalClient.tsx
│   │   └── api/
│   │       ├── reservations/route.ts
│   │       └── proposals/
│   │           ├── route.ts
│   │           ├── [id]/route.ts
│   │           ├── [id]/send/route.ts
│   │           └── [id]/items/{route.ts, [itemId]/route.ts}
│   ├── components/
│   │   ├── concierge/                       # dashboard pieces
│   │   ├── member/                          # luxury member-view pieces
│   │   └── ui/                              # shadcn primitives
│   └── lib/
│       ├── db.ts                            # Prisma singleton + adapter
│       ├── fetcher.ts                       # SWR fetcher
│       ├── schemas.ts                       # Zod (shared client + server)
│       ├── categories.ts
│       ├── state.ts                         # state machine
│       └── format.ts                        # money / date helpers
├── tests/
│   ├── helpers/{db,setup}.ts
│   ├── smoke.test.ts
│   └── api/*.test.ts
├── docs/plans/                              # design + implementation plan
├── README.md
└── package.json
```

---

## Assumptions made

- **Single member, single reservation.** Both seeded; no UI for adding more (the API would already accept it, but the dashboard only renders the first reservation).
- **No real email sending.** The `POST …/send` endpoint inserts a row into the `SentEmail` table (which serves as the audit log) and prints a one-line `[MOCK EMAIL]` to stdout.
- **No real payment processing.** "Pay & Lock In" just transitions the proposal to `paid` and stamps `paidAt` — no Stripe integration.
- **Drag-reorder of items is not implemented.** The `sortOrder` field exists and is populated on insert, so adding `dnd-kit` later would be a small lift.
- **Member-view drafts are 404, not redirects.** The page is treated as if it only exists once the proposal has been sent.
- **Money is stored as `priceCents` (Int).** UI takes whole-dollar input and multiplies by 100.

---

## What I'd improve given more time

- **Signed share links** with expiry (JWT or `next-auth` magic-link flow) instead of bare UUIDs.
- **Concierge auth via SSO** (Google Workspace / Okta), with per-user audit of who sent what.
- **Real transactional email** through Resend or SES, with the existing `SentEmail` table as the log.
- **Stripe Checkout** for "Pay & Lock In", with `paidAt` set from the webhook rather than the button.
- **Image uploads** for line-item hero images (S3 + signed URLs), so the member view can really sing.
- **Drag-reorder of items** with `@dnd-kit/sortable` (already wired into the data model).
- **Multi-tenant support** — multiple members, multiple concurrent reservations, a member-picker on the dashboard.
- **Playwright E2E** covering the full create → send → approve → pay loop in a browser, rather than relying on the Loom for UI verification.
- **Accessibility audit** — focus rings, ARIA labels on dialogs, keyboard navigation through the timeline.
- **Optimistic UI** for status transitions and item add/edit/delete (SWR's `mutate(data, { optimisticData: ... })`).

---

## What was interesting / challenging

- **The state machine and timestamp model.** Deciding which transitions are legal and which timestamps to stamp (`sentAt`, `approvedAt`, `paidAt`) felt right to encode once in `src/lib/state.ts` and then reference from both the PATCH handler and the UI button-disable logic. One source of truth.
- **Sharing primitives between concierge and member views.** They're stylistically opposite (dense/efficient vs. spacious/elegant), but they both work off the same shadcn `Card`, `Button`, `Badge`, etc. Tailwind made it possible to land both feels without forking a component library.
- **Picking UUIDs as soft access control instead of bolting on auth that wasn't asked for.** This wasn't in the spec, but it felt like the responsible default for a real luxury brand. Calling it out explicitly in this README rather than pretending it's not a tradeoff.
- **Prisma 7 + better-sqlite3 driver adapter.** The new Prisma generator engine requires an explicit adapter for SQLite, which moved `DATABASE_URL` from the Prisma schema into `prisma.config.ts`. Worked through it, but it's a real difference if you've only used Prisma 5/6.

---

## Submission contents

- This repository (master branch)
- Loom walkthrough (link added at submission time)
