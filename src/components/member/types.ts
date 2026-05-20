import type { Status } from "@/lib/state";
import type { CategoryId } from "@/lib/categories";

export type MemberProposalItem = {
  id: string;
  proposalId: string;
  category: CategoryId;
  title: string;
  description: string;
  scheduledAt: string;
  priceCents: number;
  sortOrder: number;
};

export type MemberProposal = {
  id: string;
  reservationId: string;
  status: Status;
  notes: string | null;
  createdAt: string;
  sentAt: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  items: MemberProposalItem[];
  reservation: {
    id: string;
    arrivalDate: string;
    departureDate: string;
    destination: string;
    villa: string;
    member: { id: string; name: string; email: string };
  };
};
