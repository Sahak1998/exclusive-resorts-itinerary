"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { invalidateProposals, parseErrorBody } from "@/lib/client";
import type { Proposal } from "./types";

export function NewProposalButton({
  reservationId,
  onCreated,
}: {
  reservationId: string;
  onCreated: (p: Proposal) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reservationId }),
      });
      if (!res.ok) throw new Error(await parseErrorBody(res));
      const proposal: Proposal = await res.json();
      toast.success("New draft proposal created");
      await invalidateProposals();
      onCreated(proposal);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create proposal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading} className="w-full" variant="default">
      <Plus className="h-4 w-4" />
      {loading ? "Creating..." : "New proposal"}
    </Button>
  );
}
