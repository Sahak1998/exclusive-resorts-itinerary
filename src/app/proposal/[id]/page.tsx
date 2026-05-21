import { notFound } from "next/navigation";
import { proposalsService } from "@/services/proposals.service";
import { MemberProposalClient } from "./MemberProposalClient";

export const dynamic = "force-dynamic";

export default async function MemberProposalPage({
  params,
}: {
  params: { id: string };
}) {
  const proposal = await proposalsService.findDetail(params.id);
  if (!proposal || proposal.status === "draft") notFound();
  // Serialize Date objects for the client component
  const initial = JSON.parse(JSON.stringify(proposal));
  return <MemberProposalClient initial={initial} />;
}
