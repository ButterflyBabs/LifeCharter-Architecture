// Campaigns & Broadcasts are filed under an offer; each offer is a section header in the lists.
// Anything not filed yet sits under the last header.
export const NO_OFFER = "Not filed under an offer";

export function byOffer<T extends { offer?: string | null }>(items: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const k = (it.offer || "").trim() || NO_OFFER;
    map.set(k, [...(map.get(k) ?? []), it]);
  }
  return Array.from(map.entries()).sort((a, b) => (a[0] === NO_OFFER ? 1 : b[0] === NO_OFFER ? -1 : a[0].localeCompare(b[0])));
}

export const offersOf = (items: { offer?: string | null }[]) => Array.from(new Set(items.map((i) => (i.offer || "").trim()).filter(Boolean))).sort();
