export const STATUSES = ["draft", "sent", "approved", "paid"] as const;
export type Status = (typeof STATUSES)[number];

const NEXT: Record<Status, Status[]> = {
  draft:    ["sent"],
  sent:     ["approved"],
  approved: ["paid"],
  paid:     [],
};

export const canTransition = (from: Status, to: Status) => NEXT[from].includes(to);
