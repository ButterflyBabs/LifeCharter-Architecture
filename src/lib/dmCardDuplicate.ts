/**
 * Is this person already on the board? Used when someone is added one at a time (the paste and upload lists have
 * their own check). A profile link decides when both sides have one; otherwise the same name on the same platform,
 * or the same handle, counts. Two people who share a name but have different profile links are different people.
 * A link only identifies a person when it is a personal profile (LinkedIn, Facebook, Instagram...). A shared company page
 * or website does not: two different names on one website are two people who may work in the same office (Babs, 2026-11-04).
 */
export type CardKey = { name: string | null; profile_url: string | null; handle: string | null; platform: string | null };
export type IncomingCard = { name: string; profileUrl: string | null; handle: string | null; platform: string | null };

// A Facebook profile without a custom name is facebook.com/profile.php?id=<number>: the number IS the person, so it stays.
// Without it, profile.php opens whoever is signed in, so it identifies no one.
const FB_PROFILE_ID = /^facebook\.com\/profile\.php\?(?:[^#]*&)?id=(\d+)/;
export function normProfileUrl(u: string | null | undefined): string {
  const t = (u ?? "").trim().toLowerCase().replace(/^https?:\/\/(www\.|m\.|web\.|mbasic\.)?/, "");
  const fb = t.match(FB_PROFILE_ID);
  if (fb) return `facebook.com/profile.php?id=${fb[1]}`;
  const bare = t.replace(/[?#].*$/, "").replace(/\/+$/, "");
  return bare === "facebook.com/profile.php" ? "" : bare;
}

/** A profile link worth saving: a bare facebook.com/profile.php (no id) opens the signed-in person's OWN profile, so it is dropped. */
export function usableProfileUrl(u: string | null | undefined): string | null {
  const t = (u ?? "").trim();
  if (!t) return null;
  return /^(https?:\/\/)?(www\.|m\.|web\.|mbasic\.)?facebook\.com\/profile\.php\/?(\?(?![^#]*\bid=\d)[^#]*)?(#.*)?$/i.test(t) ? null : t;
}

const SOCIAL_HOSTS = /^(linkedin\.com|facebook\.com|fb\.com|instagram\.com|x\.com|twitter\.com|tiktok\.com|threads\.net|youtube\.com|pinterest\.com|wa\.me|t\.me)(\/|$)/;

/** Does this link point at one person (a social profile), rather than a business website or a shared page? */
export function isPersonalProfileLink(u: string | null | undefined): boolean {
  const n = normProfileUrl(u).replace(/^[a-z]{2}\./, "");
  if (/^linkedin\.com\/(company|school|showcase|groups|pulse|jobs)(\/|$)/.test(n)) return false; // a LinkedIn company page is a business page
  return SOCIAL_HOSTS.test(n);
}

/** Is this the same person, judging by the profile link and name? Social profile: the link decides. Any other link: the same name too. */
export function sameLinkSamePerson(linkA: string | null | undefined, nameA: string | null | undefined, linkB: string | null | undefined, nameB: string | null | undefined): boolean {
  const a = normProfileUrl(linkA);
  const b = normProfileUrl(linkB);
  if (!a || !b || a !== b) return false;
  if (isPersonalProfileLink(linkA)) return true;
  const na = clean(nameA);
  return !!na && na === clean(nameB);
}

const clean = (s: string | null | undefined) => (s ?? "").trim().toLowerCase().replace(/^@/, "");

export function isSameCard(existing: CardKey, incoming: IncomingCard): boolean {
  const eu = normProfileUrl(existing.profile_url);
  const iu = normProfileUrl(incoming.profileUrl);
  if (eu && iu) return sameLinkSamePerson(existing.profile_url, existing.name, incoming.profileUrl, incoming.name);
  if ((existing.platform ?? "") !== (incoming.platform ?? "")) return false;
  const ih = clean(incoming.handle);
  if (ih && ih === clean(existing.handle)) return true;
  const n = clean(incoming.name);
  return !!n && n === clean(existing.name);
}
