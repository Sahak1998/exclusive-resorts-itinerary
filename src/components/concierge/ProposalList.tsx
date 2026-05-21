"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { statusClass, statusVariant } from "@/lib/ui";
import type { Proposal } from "./types";

export function ProposalList({
  proposals,
  activeId,
  onSelect,
}: {
  proposals: Proposal[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  if (proposals.length === 0) {
    return (
      <Card className="p-6 text-center text-sm text-stone-500">
        No proposals yet — create one to start.
      </Card>
    );
  }

  return (
    <div className="max-h-[calc(100vh-22rem)] space-y-2 overflow-y-auto pr-1">
      {proposals.map((p) => {
        const isActive = p.id === activeId;
        const created = new Date(p.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={cn(
              "w-full rounded-lg border border-stone-200 bg-white p-3 text-left transition-colors hover:bg-stone-50",
              isActive && "border-brand bg-brand/5",
            )}
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Proposal {created}</div>
              <Badge
                variant={statusVariant[p.status]}
                className={cn("capitalize", statusClass[p.status])}
              >
                {p.status}
              </Badge>
            </div>
            <div className="mt-1 text-xs text-stone-500">
              {p.items.length} {p.items.length === 1 ? "item" : "items"}
            </div>
          </button>
        );
      })}
    </div>
  );
}
