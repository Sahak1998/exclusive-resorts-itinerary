import { mutate } from "swr";

export async function parseErrorBody(res: Response): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as { error?: string };
  return body?.error ?? `HTTP ${res.status}`;
}

export async function invalidateProposals(proposalId?: string) {
  if (proposalId) await mutate(`/api/proposals/${proposalId}`);
  await mutate("/api/proposals");
}
