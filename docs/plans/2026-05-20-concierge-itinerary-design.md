# Concierge Itinerary Proposal System — Design

**Date:** 2026-05-20
**Author:** Sahak
**Context:** Exclusive Resorts Full Stack Developer trial task

## Problem

Build a Concierge Itinerary Proposal System: concierge curates a trip itinerary for a luxury-travel member, sends as a proposal, member reviews → approves → pays to lock in.

## Stack (per spec)

- Next.js 14 (App Router)
- TypeScript (strict)
- Tailwind CSS + shadcn/ui primitives
- Prisma + SQLite (`prisma/dev.db`)
- Zod for input validation
- Framer Motion for member-view animations
- Vitest for lightweight API tests

## Scenario (seeded)

- Member: **James Whitfield** (`james@example.com`)
- Reservation: **Villa Punta Mita, Mexico** — arrival 2026-03-15, departure 2026-03-22

## Identifiers

All ids `@default(uuid())` across every model. Public link is `/proposal/[uuid]` — unguessable, soft access control without auth. README explicitly calls out that production would sign these links (NextAuth, JWT, or short-lived signed URLs).

## Data model

```prisma
model Member       { id uuid pk; name; email unique; reservations[] }
model Reservation  { id uuid pk; memberId fk; destination; villa; arrivalDate; departureDate; proposals[] }
model Proposal     { id uuid pk; reservationId fk; status; notes?; createdAt; sentAt?; approvedAt?; paidAt?; items[]; emails[] }
model ProposalItem { id uuid pk; proposalId fk cascade; category; title; description; scheduledAt; priceCents int; sortOrder int }
model SentEmail    { id uuid pk; proposalId fk; toEmail; sentAt; bodyPreview }
```

- `priceCents Int` — avoid float drift on totals.
- `status` as string; validate via Zod (no native enum to keep Prisma+SQLite friction low).
- `sortOrder` so concierge can reorder items.

## State machine

`draft → sent → approved → paid`. Illegal transitions return 409.

## Routes

**Pages**
- `/` — concierge dashboard
- `/proposal/[id]` — member view

**API**
- `GET /api/reservations` — current reservation
- `POST /api/proposals` — create draft
- `GET /api/proposals` — list with status
- `GET /api/proposals/[id]` — single proposal + items
- `PATCH /api/proposals/[id]` — status + notes
- `POST /api/proposals/[id]/items` — add item
- `PATCH /api/proposals/[id]/items/[itemId]` — edit/reorder
- `DELETE /api/proposals/[id]/items/[itemId]` — remove
- `POST /api/proposals/[id]/send` — flip to sent + insert SentEmail row + console.log

## UX

**Concierge dashboard (`/`)** — efficient, dense
- Top banner: member + villa + dates
- Left: proposal list with status pills
- Center: itinerary builder — category cards modal, inline edit, drag reorder, notes field, running total
- Right: live preview + Send button → toast with copyable `/proposal/[uuid]` link

**Member view (`/proposal/[uuid]`)** — premium, slow, luxurious
- Hero: villa, dates, gradient + serif typography
- Concierge notes (italic quote treatment)
- Day-by-day timeline (group items by date)
- Sticky footer: total + Approve / Pay & Lock In
- Paid → Framer Motion confirmation screen

## Categories

dining, activities, wellness, excursions, transport, experiences — constants in `src/lib/categories.ts` with icon + label.

## Error handling

- All API routes try/catch; `{ error }` body with 400/404/409/500.
- State machine guard for status transitions.
- Client: SWR fetch, toast on error.
- Shared Zod schemas between client form + server.

## Testing

Vitest API tests on the happy path: create → add item → send → approve → pay. Skip component tests, rely on Loom walkthrough.

## Repo layout

```
exclusive-resorts-itinerary/
├── prisma/{schema.prisma, seed.ts, migrations/}
├── src/
│   ├── app/{page.tsx, proposal/[id]/page.tsx, api/...}
│   ├── components/{concierge/, member/, ui/}
│   └── lib/{db.ts, schemas.ts, categories.ts, format.ts}
├── tests/api/
├── README.md
└── package.json
```

## One-command run

```
npm install && npm run dev
```

`postinstall` runs `prisma migrate deploy && prisma db seed`. App starts on `http://localhost:3000`.

## Stretch goals included

- Concierge notes/message field (rendered in member view)
- Edit draft before sending
- Day-by-day timeline in member view
- Approval/payment animations (Framer Motion)

## README will cover

- Install + run (one command)
- Assumptions: no auth, UUIDs as soft access control, hardcoded member, console.log instead of real email
- What I'd improve: signed/short-lived links or NextAuth, real email via Resend, Stripe checkout, image CDN, full test coverage, multi-tenant support
- What was interesting/challenging
