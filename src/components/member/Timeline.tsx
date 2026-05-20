import { Utensils, Waves, Sparkles, Compass, Car, Flame } from "lucide-react";
import type { ComponentType } from "react";
import type { CategoryId } from "@/lib/categories";
import { formatDayKey, formatDateLong, formatMoney, formatTime } from "@/lib/format";
import type { MemberProposalItem } from "./types";

const CATEGORY_ICON: Record<CategoryId, ComponentType<{ className?: string }>> = {
  dining: Utensils,
  activities: Waves,
  wellness: Sparkles,
  excursions: Compass,
  transport: Car,
  experiences: Flame,
};

function groupByDay(items: MemberProposalItem[]) {
  const groups = new Map<string, MemberProposalItem[]>();
  for (const item of items) {
    const key = formatDayKey(item.scheduledAt);
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export function Timeline({ items }: { items: MemberProposalItem[] }) {
  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-16 text-center text-stone-500">
        Your itinerary is being finalized.
      </section>
    );
  }

  const days = groupByDay(items);

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <div className="space-y-16">
        {days.map(([dayKey, dayItems]) => {
          const first = dayItems[0];
          if (!first) return null;
          const heading = formatDateLong(first.scheduledAt);
          return (
            <div key={dayKey}>
              <h2 className="mb-6 font-serif text-2xl tracking-tight text-stone-900">
                {heading}
              </h2>
              <ol className="relative">
                {dayItems.map((item, idx) => {
                  const Icon = CATEGORY_ICON[item.category] ?? Sparkles;
                  const isLast = idx === dayItems.length - 1;
                  return (
                    <li key={item.id} className="relative pb-8 pl-16 last:pb-0">
                      {!isLast && (
                        <span
                          aria-hidden
                          className="absolute left-[19px] top-12 bottom-0 w-px bg-stone-200"
                        />
                      )}
                      <span
                        aria-hidden
                        className="absolute left-0 top-1 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-900 text-white shadow-sm"
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs uppercase tracking-widest text-stone-500">
                            {formatTime(item.scheduledAt)}
                          </div>
                          <div className="mt-1 font-medium text-stone-900">
                            {item.title}
                          </div>
                          {item.description && (
                            <p className="mt-1 text-sm text-stone-600">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 font-serif text-lg tabular-nums text-stone-900">
                          {formatMoney(item.priceCents)}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
    </section>
  );
}
