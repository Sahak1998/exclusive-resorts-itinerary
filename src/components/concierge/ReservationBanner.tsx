import { formatDateLong } from "@/lib/format";

export type ReservationWithMember = {
  id: string;
  destination: string;
  villa: string;
  arrivalDate: string;
  departureDate: string;
  member: { id: string; name: string; email: string };
};

export function ReservationBanner({ reservation }: { reservation: ReservationWithMember }) {
  return (
    <section className="border-b bg-cream/60 px-8 py-8">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-xs uppercase tracking-widest text-stone-500">
            {reservation.destination}
          </div>
          <h2 className="mt-1 font-serif text-3xl tracking-tight">{reservation.villa}</h2>
          <div className="mt-1 text-sm text-stone-600">
            Hosting <span className="font-medium text-stone-800">{reservation.member.name}</span>
          </div>
        </div>
        <div className="flex gap-8 text-sm text-stone-700">
          <div>
            <div className="text-xs uppercase tracking-widest text-stone-500">Arrival</div>
            <div className="mt-1">{formatDateLong(reservation.arrivalDate)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-stone-500">Departure</div>
            <div className="mt-1">{formatDateLong(reservation.departureDate)}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
