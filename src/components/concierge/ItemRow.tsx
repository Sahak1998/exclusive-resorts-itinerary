"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { mutate } from "swr";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateLong, formatMoney, formatTime } from "@/lib/format";
import { CATEGORIES } from "@/lib/categories";
import { AddItemDialog } from "./AddItemDialog";
import type { ProposalItem } from "./types";

const labelFor = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

export function ItemRow({
  item,
  proposalId,
  arrivalDate,
  departureDate,
  editable,
}: {
  item: ProposalItem;
  proposalId: string;
  arrivalDate: string;
  departureDate: string;
  editable: boolean;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/items/${item.id}`, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      toast.success("Item removed");
      await mutate(`/api/proposals/${proposalId}`);
      await mutate("/api/proposals");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-start gap-4 rounded-lg border bg-white p-4">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="capitalize">
            {labelFor(item.category)}
          </Badge>
          <span className="font-medium">{item.title}</span>
        </div>
        {item.description && (
          <p className="text-sm text-stone-600">{item.description}</p>
        )}
        <div className="text-xs text-stone-500">
          {formatDateLong(item.scheduledAt)} &middot; {formatTime(item.scheduledAt)}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="font-medium tabular-nums">{formatMoney(item.priceCents)}</div>
        {editable && (
          <div className="flex items-center gap-1">
            <AddItemDialog
              proposalId={proposalId}
              arrivalDate={arrivalDate}
              departureDate={departureDate}
              item={item}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deleting}
              aria-label="Delete item"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
