import type { MemberProposal } from "./types";

export function Hero({ proposal }: { proposal: MemberProposal }) {
  const { reservation } = proposal;
  const arrival = new Date(reservation.arrivalDate);
  const departure = new Date(reservation.departureDate);
  const arrivalLabel = arrival.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const departureLabel = departure.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
  const year = arrival.getFullYear();
  const firstName = reservation.member.name.split(" ")[0];

  return (
    <section className="relative flex min-h-[60vh] items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-700 to-amber-300 px-6 py-20 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.15),transparent_60%)]" />
      <div className="relative z-10 mx-auto max-w-3xl text-white">
        <div className="mb-6 text-xs uppercase tracking-[0.35em] text-white/80">
          Curated for {firstName}
        </div>
        <h1 className="font-serif text-5xl leading-tight tracking-tight md:text-7xl">
          {reservation.villa}
        </h1>
        <div className="mt-2 text-sm uppercase tracking-[0.25em] text-white/75">
          {reservation.destination}
        </div>
        <p className="mt-8 text-lg font-light text-white/90 md:text-xl">
          {reservation.member.name} — {arrivalLabel} to {departureLabel}, {year}
        </p>
      </div>
    </section>
  );
}
