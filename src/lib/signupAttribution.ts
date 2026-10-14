// Where a public registration came from, read from the campaign tags (utm_*), the Facebook click id and any
// affiliate or card code on the link. Pure and shared by the sign-up API and its tests.
//
// Tags written (all start mc-): mc-source-paid-ad | mc-source-<channel> | mc-source-affiliate | mc-source-direct,
// plus mc-medium-<medium> and mc-campaign-<campaign> when the link carried them. Short links such as mc-ig-post
// carry utm_source=instagram, utm_medium=post, utm_campaign=masterclass; a Meta ad carries a click id (fbclid) or a
// paid medium.

const slug = (s: string, n = 40) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, n);

const PAID_MEDIUMS = new Set(["paid", "cpc", "ppc", "paid_social", "paidsocial", "paid-social", "paid_social_media", "ad", "ads", "advert", "display", "retargeting"]);

export interface Attribution {
  tags: string[];
  /** true when the click id or a paid medium says it came from an ad. */
  paid: boolean;
  /** Plain words for the contact's timeline. */
  summary: string;
  detail: Record<string, string>;
}

export function attributionFor(i: { utm?: unknown; ref?: string; card?: string }): Attribution {
  const u = (i.utm && typeof i.utm === "object" ? (i.utm as Record<string, unknown>) : {}) as Record<string, unknown>;
  const get = (k: string) => (typeof u[k] === "string" ? String(u[k]).trim().slice(0, 120) : "");
  const source = get("utm_source");
  const medium = get("utm_medium");
  const campaign = get("utm_campaign");
  const fbclid = get("fbclid");
  const tags: string[] = [];
  const detail: Record<string, string> = {};
  if (source) detail.utm_source = source;
  if (medium) detail.utm_medium = medium;
  if (campaign) detail.utm_campaign = campaign;
  if (get("utm_content")) detail.utm_content = get("utm_content");
  if (get("utm_term")) detail.utm_term = get("utm_term");
  if (fbclid) detail.fbclid = "yes";

  const paid = Boolean(fbclid) || PAID_MEDIUMS.has(medium.toLowerCase());
  let summary: string;
  if (paid) {
    tags.push("mc-source-paid-ad");
    summary = `paid ad${source ? ` via ${source}` : ""}${campaign ? `, campaign ${campaign}` : ""}`;
  } else if (source) {
    tags.push(`mc-source-${slug(source)}`);
    summary = `${source}${medium ? ` ${medium}` : ""}${campaign ? `, campaign ${campaign}` : ""}`;
  } else if (i.ref) {
    tags.push("mc-source-affiliate");
    summary = "an affiliate link";
  } else if (i.card) {
    tags.push("mc-source-personal-link");
    summary = "a personal invitation link";
  } else {
    tags.push("mc-source-direct");
    summary = "direct, no campaign tags";
  }
  if (medium) tags.push(`mc-medium-${slug(medium)}`);
  if (campaign) tags.push(`mc-campaign-${slug(campaign)}`);
  return { tags: Array.from(new Set(tags.filter((t) => t.length > 3))), paid, summary, detail };
}
