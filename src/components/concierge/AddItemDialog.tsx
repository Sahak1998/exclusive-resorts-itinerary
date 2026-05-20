"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { mutate } from "swr";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { proposalItemInputSchema } from "@/lib/schemas";
import type { ProposalItem } from "./types";

type Props = {
  proposalId: string;
  arrivalDate: string;
  departureDate: string;
  onAdded?: () => void;
  item?: ProposalItem;
};

/** Convert an ISO string to a value compatible with <input type="datetime-local"> in local time. */
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const toLocalDay = (iso: string) => toLocalInput(iso).slice(0, 16);

export function AddItemDialog({ proposalId, arrivalDate, departureDate, onAdded, item }: Props) {
  const isEdit = Boolean(item);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<CategoryId>((item?.category as CategoryId) ?? CATEGORIES[0].id);
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [scheduledAtLocal, setScheduledAtLocal] = useState(
    item ? toLocalInput(item.scheduledAt) : toLocalDay(arrivalDate),
  );
  const [priceDollars, setPriceDollars] = useState<string>(
    item ? String(Math.round(item.priceCents / 100)) : "",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset on close (after a short delay so the dialog animates out cleanly)
      setErrors({});
      if (!isEdit) {
        setCategory(CATEGORIES[0].id);
        setTitle("");
        setDescription("");
        setScheduledAtLocal(toLocalDay(arrivalDate));
        setPriceDollars("");
      }
    }
  }, [open, isEdit, arrivalDate]);

  const minLocal = toLocalDay(arrivalDate);
  const maxLocal = toLocalDay(departureDate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const dollars = Number(priceDollars);
    if (!Number.isFinite(dollars) || dollars < 0) {
      setErrors({ priceCents: "Enter a valid price" });
      return;
    }
    const priceCents = Math.round(dollars * 100);

    let scheduledIso: string;
    try {
      scheduledIso = new Date(scheduledAtLocal).toISOString();
    } catch {
      setErrors({ scheduledAt: "Invalid date/time" });
      return;
    }

    const payload = {
      category,
      title,
      description,
      scheduledAt: scheduledIso,
      priceCents,
    };

    const parsed = proposalItemInputSchema.safeParse(payload);
    if (!parsed.success) {
      const flat = parsed.error.flatten();
      const fieldErrors: Record<string, string> = {};
      for (const [k, v] of Object.entries(flat.fieldErrors)) {
        if (v && v.length > 0) fieldErrors[k] = v[0]!;
      }
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/proposals/${proposalId}/items/${item!.id}`
        : `/api/proposals/${proposalId}/items`;
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      toast.success(isEdit ? "Item updated" : "Item added");
      await mutate(`/api/proposals/${proposalId}`);
      await mutate("/api/proposals");
      setOpen(false);
      onAdded?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" aria-label="Edit item">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="default">
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit item" : "Add itinerary item"}</DialogTitle>
            <DialogDescription>
              Schedule a dining, activity, or experience for the member.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="item-category">Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as CategoryId)}
            >
              <SelectTrigger id="item-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-title">Title</Label>
            <Input
              id="item-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Private chef dinner"
              maxLength={120}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-description">Description</Label>
            <Textarea
              id="item-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details the member will see…"
              maxLength={1000}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="item-scheduled">Date &amp; time</Label>
              <Input
                id="item-scheduled"
                type="datetime-local"
                value={scheduledAtLocal}
                min={minLocal}
                max={maxLocal}
                onChange={(e) => setScheduledAtLocal(e.target.value)}
              />
              {errors.scheduledAt && (
                <p className="text-xs text-destructive">{errors.scheduledAt}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-price">Price (USD)</Label>
              <Input
                id="item-price"
                type="number"
                step="1"
                min="0"
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value)}
                placeholder="1250"
              />
              {errors.priceCents && (
                <p className="text-xs text-destructive">{errors.priceCents}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
