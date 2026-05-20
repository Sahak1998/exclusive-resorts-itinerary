import { Quote } from "lucide-react";

export function NotesBlock({ notes }: { notes: string }) {
  return (
    <section className="relative mx-auto max-w-2xl px-6 py-16 text-center">
      <Quote
        className="absolute left-1/2 top-6 -translate-x-1/2 text-emerald-900/10"
        style={{ width: "5rem", height: "5rem" }}
        aria-hidden
      />
      <blockquote className="relative font-serif text-2xl italic leading-relaxed text-stone-700 md:text-3xl">
        {notes}
      </blockquote>
    </section>
  );
}
