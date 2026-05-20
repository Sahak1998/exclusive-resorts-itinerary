"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { fetcher } from "@/lib/fetcher";
import { formatDateLong, formatMoney } from "@/lib/format";
import { AddItemDialog } from "./AddItemDialog";
import { ItemRow } from "./ItemRow";
import type { Proposal } from "./types";

type ProposalDetail = Proposal & {
  reservation: {
    id: string;
    arrivalDate: string;
    departureDate: string;
    villa: string;
    member: { id: string; name: string; email: string };
  };
};

export function ItineraryBuilder({
  proposalId,
  arrival,
  departure,
}: {
  proposalId: string;
  arrival?: string;
  departure?: string;
}) {
  const { data: proposal, error, isLoading } = useSWR<ProposalDetail>(
    `/api/proposals/${proposalId}`,
    fetcher,
  );
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (proposal) setNotes(proposal.notes ?? "");
  }, [proposal?.id, proposal?.notes]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return <Card className="p-8 text-center text-stone-500">Loading proposal…</Card>;
  }
  if (error || !proposal) {
    return (
      <Card className="p-8 text-center text-destructive">
        Failed to load proposal{error instanceof Error ? `: ${error.message}` : ""}.
      </Card>
    );
  }

  const arrivalDate = proposal.reservation.arrivalDate ?? arrival ?? new Date().toISOString();
  const departureDate =
    proposal.reservation.departureDate ?? departure ?? new Date().toISOString();
  const isDraft = proposal.status === "draft";
  const total = proposal.items.reduce((s, i) => s + i.priceCents, 0);

  const saveNotes = async () => {
    if (!isDraft) return;
    if ((proposal.notes ?? "") === notes) return;
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      await mutate(`/api/proposals/${proposalId}`);
      await mutate("/api/proposals");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save notes");
    } finally {
      setSavingNotes(false);
    }
  };

  return (
    <Card className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-2xl tracking-tight">Itinerary</h3>
          <p className="text-sm text-stone-500">
            Draft an experience for {proposal.reservation.member.name} at {proposal.reservation.villa}.
          </p>
        </div>
        {isDraft && (
          <AddItemDialog
            proposalId={proposalId}
            arrivalDate={arrivalDate}
            departureDate={departureDate}
          />
        )}
      </div>

      {!isDraft && proposal.sentAt && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Read-only — proposal was sent on {formatDateLong(proposal.sentAt)}.
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="proposal-notes">Concierge notes</Label>
        <Textarea
          id="proposal-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          disabled={!isDraft || savingNotes}
          placeholder="A personal note to the member…"
          maxLength={2000}
          rows={3}
        />
      </div>

      <Separator />

      <div className="space-y-3">
        {proposal.items.length === 0 ? (
          <div className="rounded-md border border-dashed py-8 text-center text-sm text-stone-500">
            No items yet. {isDraft && "Add your first itinerary item above."}
          </div>
        ) : (
          proposal.items.map((it) => (
            <ItemRow
              key={it.id}
              item={it}
              proposalId={proposalId}
              arrivalDate={arrivalDate}
              departureDate={departureDate}
              editable={isDraft}
            />
          ))
        )}
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <span className="text-sm uppercase tracking-widest text-stone-500">Running total</span>
        <span className="font-serif text-2xl tabular-nums">{formatMoney(total)}</span>
      </div>
    </Card>
  );
}
