import { NextResponse } from "next/server";
import { proposalSendService } from "@/services/proposal-send.service";

type Ctx = { params: { id: string } };

export async function POST(_req: Request, { params }: Ctx) {
  const proposal = await proposalSendService.loadSendable(params.id);
  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (proposal.status !== "draft") {
    return NextResponse.json({ error: `Cannot send a ${proposal.status} proposal` }, { status: 409 });
  }
  if (proposal.items.length === 0) {
    return NextResponse.json({ error: "Cannot send an empty proposal" }, { status: 400 });
  }

  const updated = await proposalSendService.sendAndStamp(proposal);
  return NextResponse.json(updated);
}
