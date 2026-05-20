"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Hero } from "@/components/member/Hero";
import { NotesBlock } from "@/components/member/NotesBlock";
import { Timeline } from "@/components/member/Timeline";
import { StickyFooter } from "@/components/member/StickyFooter";
import { PaidConfirmation } from "@/components/member/PaidConfirmation";
import type { MemberProposal } from "@/components/member/types";

export function MemberProposalClient({ initial }: { initial: MemberProposal }) {
  const { data: proposal, mutate } = useSWR<MemberProposal>(
    `/api/proposals/${initial.id}`,
    fetcher,
    { fallbackData: initial },
  );
  const current = proposal ?? initial;

  if (current.status === "paid") {
    return <PaidConfirmation proposal={current} />;
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-32">
      <Hero proposal={current} />
      {current.notes && <NotesBlock notes={current.notes} />}
      <Timeline items={current.items} />
      <StickyFooter proposal={current} onChange={() => mutate()} />
    </div>
  );
}
