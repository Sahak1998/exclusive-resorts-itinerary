"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";
import type { Status } from "@/lib/state";
import type { MemberProposal } from "./types";

export function StickyFooter({
  proposal,
  onChange,
}: {
  proposal: MemberProposal;
  onChange: () => void;
}) {
  const [pending, setPending] = useState<Status | null>(null);
  const total = proposal.items.reduce((sum, i) => sum + i.priceCents, 0);

  const transition = async (to: Status) => {
    setPending(to);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: to }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      onChange();
      if (to === "approved") toast.success("Itinerary approved");
      if (to === "paid") toast.success("Payment confirmed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="sticky bottom-0 z-20 border-t border-stone-200 bg-white/95 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-5">
        <div>
          <div className="text-xs uppercase tracking-widest text-stone-500">
            Total
          </div>
          <div className="font-serif text-2xl tabular-nums text-stone-900">
            {formatMoney(total)}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {proposal.status === "sent" && (
            <Button
              size="lg"
              className="bg-emerald-800 text-white hover:bg-emerald-900"
              onClick={() => transition("approved")}
              disabled={pending !== null}
            >
              {pending === "approved" && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {pending === "approved" ? "Approving…" : "Approve Itinerary"}
            </Button>
          )}

          {proposal.status === "approved" && (
            <>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium uppercase tracking-widest text-emerald-900">
                Approved
              </span>
              <Button
                size="lg"
                className="bg-emerald-800 text-white hover:bg-emerald-900"
                onClick={() => transition("paid")}
                disabled={pending !== null}
              >
                {pending === "paid" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {pending === "paid" ? "Locking in…" : "Pay & Lock In"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
