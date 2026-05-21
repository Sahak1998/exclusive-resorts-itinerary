"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Card } from "@/components/ui/card";
import { formatMoney, getTotalPrice } from "@/lib/format";
import { statusClass } from "@/lib/ui";
import {
  ReservationBanner,
  type ReservationWithMember,
} from "@/components/concierge/ReservationBanner";
import { ProposalList } from "@/components/concierge/ProposalList";
import { ItineraryBuilder } from "@/components/concierge/ItineraryBuilder";
import { NewProposalButton } from "@/components/concierge/NewProposalButton";
import { SendButton } from "@/components/concierge/SendButton";
import { Badge } from "@/components/ui/badge";
import type { Proposal } from "@/components/concierge/types";

export default function ConciergePage() {
  const { data: reservation, error: reservationError } = useSWR<ReservationWithMember>(
    "/api/reservations",
    fetcher,
  );
  const { data: proposals, error: proposalsError } = useSWR<Proposal[]>(
    "/api/proposals",
    fetcher,
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  // Auto-select the most recent proposal once they load
  useEffect(() => {
    if (activeId || !proposals) return;
    const first = proposals[0];
    if (first) setActiveId(first.id);
  }, [proposals, activeId]);

  const active = proposals?.find((p) => p.id === activeId) ?? null;
  const total = active ? getTotalPrice(active.items) : 0;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b bg-white px-8 py-6">
        <div className="text-xs uppercase tracking-widest text-stone-500">
          Exclusive Resorts
        </div>
        <h1 className="font-serif text-2xl tracking-tight">Concierge Dashboard</h1>
      </header>

      {reservation && <ReservationBanner reservation={reservation} />}
      {reservationError && (
        <div className="bg-destructive/10 px-8 py-4 text-sm text-destructive">
          Failed to load reservation: {reservationError.message}
        </div>
      )}

      <main className="grid gap-6 px-8 py-6 lg:grid-cols-4">
        <aside className="space-y-4 lg:col-span-1">
          {reservation && (
            <NewProposalButton
              reservationId={reservation.id}
              onCreated={(p) => setActiveId(p.id)}
            />
          )}
          {proposalsError && (
            <Card className="p-4 text-sm text-destructive">
              Failed to load proposals.
            </Card>
          )}
          <ProposalList
            proposals={proposals ?? []}
            activeId={activeId}
            onSelect={setActiveId}
          />
        </aside>

        <section className="lg:col-span-2">
          {activeId ? (
            <ItineraryBuilder
              proposalId={activeId}
              arrival={reservation?.arrivalDate}
              departure={reservation?.departureDate}
            />
          ) : (
            <Card className="p-12 text-center text-stone-500">
              Select a proposal or create a new one.
            </Card>
          )}
        </section>

        <aside className="space-y-4 lg:col-span-1">
          {active && (
            <Card className="space-y-4 p-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-stone-500">
                  Status
                </div>
                <Badge className={`mt-2 capitalize ${statusClass[active.status]}`}>
                  {active.status}
                </Badge>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-stone-500">
                  Items
                </div>
                <div className="mt-1 text-sm">
                  {active.items.length} {active.items.length === 1 ? "item" : "items"}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-stone-500">
                  Total
                </div>
                <div className="mt-1 font-serif text-2xl tabular-nums">
                  {formatMoney(total)}
                </div>
              </div>
            </Card>
          )}
          {active && (
            <SendButton
              proposalId={active.id}
              disabled={active.status !== "draft" || active.items.length === 0}
            />
          )}
        </aside>
      </main>
    </div>
  );
}
