import type { Status } from "./state";

export const statusVariant: Record<Status, "default" | "secondary"> = {
  draft: "secondary",
  sent: "default",
  approved: "default",
  paid: "default",
};

export const statusClass: Record<Status, string> = {
  draft: "",
  sent: "bg-amber-500 text-white hover:bg-amber-500/90",
  approved: "bg-green-600 text-white hover:bg-green-600/90",
  paid: "bg-brand text-brand-foreground hover:bg-brand/90",
};
