import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { MemberProposalClient } from "./MemberProposalClient";

export const dynamic = "force-dynamic";

export default async function MemberProposalPage({
  params,
}: {
  params: { id: string };
}) {
  const proposal = await prisma.proposal.findUnique({
    where: { id: params.id },
    include: {
      items: { orderBy: [{ scheduledAt: "asc" }, { sortOrder: "asc" }] },
      reservation: { include: { member: true } },
    },
  });
  if (!proposal || proposal.status === "draft") notFound();
  // Serialize Date objects for the client component
  const initial = JSON.parse(JSON.stringify(proposal));
  return <MemberProposalClient initial={initial} />;
}
