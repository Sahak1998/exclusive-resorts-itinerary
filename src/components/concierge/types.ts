import type { Status } from "@/lib/state";
import type { CategoryId } from "@/lib/categories";

export type ProposalItem = {
  id: string;
  proposalId: string;
  category: CategoryId;
  title: string;
  description: string;
  scheduledAt: string;
  priceCents: number;
  sortOrder: number;
};

export type Proposal = {
  id: string;
  reservationId: string;
  status: Status;
  notes: string | null;
  createdAt: string;
  sentAt: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  items: ProposalItem[];
};
