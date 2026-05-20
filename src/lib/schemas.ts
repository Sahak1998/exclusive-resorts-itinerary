import { z } from "zod";
import { CATEGORY_IDS } from "./categories";
import { STATUSES } from "./state";

export const proposalItemInputSchema = z.object({
  category: z.enum(CATEGORY_IDS as unknown as [string, ...string[]]),
  title: z.string().min(1).max(120),
  description: z.string().max(1000).default(""),
  scheduledAt: z.string().datetime(),
  priceCents: z.number().int().nonnegative(),
});

export const proposalCreateSchema = z.object({
  reservationId: z.string().uuid(),
  notes: z.string().max(2000).optional(),
});

export const proposalPatchSchema = z.object({
  status: z.enum(STATUSES).optional(),
  notes: z.string().max(2000).optional(),
});

export const proposalItemPatchSchema = proposalItemInputSchema.partial().extend({
  sortOrder: z.number().int().optional(),
});

export type ProposalItemInput = z.infer<typeof proposalItemInputSchema>;
export type ProposalCreateInput = z.infer<typeof proposalCreateSchema>;
export type ProposalPatchInput = z.infer<typeof proposalPatchSchema>;
