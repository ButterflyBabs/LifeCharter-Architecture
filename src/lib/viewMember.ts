// "View as team member": Babs (the Alignment Architect) opens the Suite exactly as one of her team members sees it,
// with that person's role and area limits, read-only. The cookie only means something when the signed-in user is the
// owner, so a forged cookie changes nothing for anyone else. It holds the member's id.
export const VIEW_MEMBER_COOKIE = "lc_view_member";
export const VIEW_MEMBER_MAX_SECONDS = 4 * 60 * 60;
export const isMemberId = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v);
