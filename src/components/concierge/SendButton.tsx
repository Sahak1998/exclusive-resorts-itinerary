"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { mutate } from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function SendButton({
  proposalId,
  disabled,
}: {
  proposalId: string;
  disabled: boolean;
}) {
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/send`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      const shareUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/proposal/${proposalId}`
          : `/proposal/${proposalId}`;
      toast.success("Proposal sent!", {
        description: shareUrl,
        action: {
          label: "Copy link",
          onClick: () => navigator.clipboard.writeText(shareUrl),
        },
        duration: 10_000,
      });
      await mutate(`/api/proposals/${proposalId}`);
      await mutate("/api/proposals");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <Button
      onClick={handleSend}
      disabled={disabled || sending}
      className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
      size="lg"
    >
      <Send className="h-4 w-4" />
      {sending ? "Sending…" : "Send to member"}
    </Button>
  );
}
