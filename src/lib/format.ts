export const formatMoney = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    .format(cents / 100);

export const formatDateLong = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

export const formatTime = (d: Date | string) =>
  new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export const formatDayKey = (d: Date | string) => new Date(d).toISOString().slice(0, 10);
