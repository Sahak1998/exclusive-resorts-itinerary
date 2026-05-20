"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { MemberProposal } from "./types";

export function PaidConfirmation({ proposal }: { proposal: MemberProposal }) {
  const firstName = proposal.reservation.member.name.split(" ")[0];
  const total = proposal.items.reduce((sum, i) => sum + i.priceCents, 0);
  const count = proposal.items.length;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-amber-200/70 px-6 py-20 text-center text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.12),transparent_60%)]" />
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 mx-auto max-w-2xl"
      >
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur">
          <CheckCircle2 className="h-16 w-16 text-emerald-200" strokeWidth={1.5} />
        </div>
        <h1 className="font-serif text-4xl leading-tight tracking-tight md:text-5xl">
          We can&apos;t wait to welcome you, {firstName}.
        </h1>
        <p className="mt-6 text-lg font-light text-white/90">
          {count} {count === 1 ? "experience" : "experiences"} locked in.{" "}
          {formatMoney(total)} confirmed.
        </p>
        <div className="mt-10 text-xs uppercase tracking-[0.35em] text-white/70">
          Exclusive Resorts
        </div>
      </motion.div>
    </main>
  );
}
