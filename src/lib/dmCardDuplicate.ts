/**
 * Is this person already on the board? Used when someone is added one at a time (the paste and upload lists have
 * their own check). A profile link decides when both sides have one; otherwise the same name on the same platform,
 * or the same handle, counts. Two people who share a name but have different profile links are different people.
 */
export type CardKey = { name: string | null; profile_url: string | null; handle: string | null; platform: string | null };
export type IncomingCard = { name: string; profileUrl: string | null; handle: string | null; platform: string | null };

export function normProfileUrl(u: string | null | undefined): string {
  return (u ?? "").trim().toLowerCase().replace(/^https?:\/\/(www\.|m\.)?/, "").replace(/[?#].*$/, "").replace(/\/+$/, "");
}

const clean = (s: string | null | undefined) => (s ?? "").trim().toLowerCase().replace(/^@/, "");

export function isSameCard(existing: CardKey, incoming: IncomingCard): boolean {
  const eu = normProfileUrl(existing.profile_url);
  const iu = normProfileUrl(incoming.profileUrl);
  if (eu && iu) return eu === iu;
  if ((existing.platform ?? "") !== (incoming.platform ?? "")) return false;
  const ih = clean(incoming.handle);
  if (ih && ih === clean(existing.handle)) return true;
  const n = clean(incoming.name);
  return !!n && n === clean(existing.name);
}
