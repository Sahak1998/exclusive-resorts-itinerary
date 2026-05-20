export const CATEGORIES = [
  { id: "dining",      label: "Dining",      examples: "Private chef dinner, restaurant reservation" },
  { id: "activities",  label: "Activities",  examples: "Surf lesson, snorkeling, ATV tour" },
  { id: "wellness",    label: "Wellness",    examples: "Spa treatment, yoga session, massage" },
  { id: "excursions",  label: "Excursions",  examples: "Whale watching, sailing charter, cultural tour" },
  { id: "transport",   label: "Transport",   examples: "Airport transfer, private car, helicopter" },
  { id: "experiences", label: "Experiences", examples: "Sunset cocktails, bonfire, tequila tasting" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export const CATEGORY_IDS = CATEGORIES.map((c) => c.id) as readonly CategoryId[];
