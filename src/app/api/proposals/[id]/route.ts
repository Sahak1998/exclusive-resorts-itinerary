import { NextResponse } from "next/server";
import { proposalPatchSchema } from "@/lib/schemas";
import { canTransition, type Status } from "@/lib/state";
import { parseRequest } from "@/lib/api";
import { proposalsService } from "@/services/proposals.service";

type Ctx = { params: { id: string } };

export async function GET(_req: Request, { params }: Ctx) {
  const proposal = await proposalsService.findDetail(params.id);
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(proposal);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const existing = await proposalsService.findById(params.id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = await parseRequest(req, proposalPatchSchema);
  if (!parsed.ok) return parsed.response;

  if (parsed.data.status && parsed.data.status !== existing.status) {
    if (!canTransition(existing.status as Status, parsed.data.status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${existing.status} to ${parsed.data.status}` },
        { status: 409 },
      );
    }
  }

  const nextStatus =
    parsed.data.status && parsed.data.status !== existing.status ? parsed.data.status : undefined;
  const updated = await proposalsService.update(params.id, {
    notes: parsed.data.notes,
    status: nextStatus,
  });
  return NextResponse.json(updated);
}
