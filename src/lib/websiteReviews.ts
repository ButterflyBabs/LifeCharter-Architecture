import { createServerClient } from "@/lib/supabase/server";
import { housePlanId, isHousePlan } from "@/lib/housePlan";

type Db = ReturnType<typeof createServerClient>;

/** Websites reviewed per account: Starter 1, Growth 2, VIP 5 (plans.capabilities.website_reviews). Babs's own account is VIP. */
export const WEBSITE_REVIEW_CAP_BY_TIER: Record<string, number> = { starter: 1, growth: 2, vip: 5 };
export const WEBSITE_REVIEW_DEFAULT_CAP = 1; // no active plan found: the Starter amount

export async function websiteReviewCap(db: Db, planId: string): Promise<number> {
  if (await isHousePlan(planId, db)) return WEBSITE_REVIEW_CAP_BY_TIER.vip;
  const { data: plan } = await db.from("client_master_plans").select("user_id, metadata").eq("id", planId).maybeSingle();
  // An account with no subscription row (a Pre-Founder beta tester) can carry its tier's number in metadata.website_reviews.
  const own = (plan?.metadata as Record<string, unknown> | null)?.website_reviews;
  if (typeof own === "number" && own >= 0) return own;
  if (!plan?.user_id) return WEBSITE_REVIEW_DEFAULT_CAP;
  const { data: sub } = await db.from("subscriptions").select("plan_id").eq("user_id", plan.user_id).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
  const tier = String(sub?.plan_id || "");
  if (!tier) return WEBSITE_REVIEW_DEFAULT_CAP;
  const { data: row } = await db.from("plans").select("capabilities").eq("id", tier).maybeSingle();
  const n = (row?.capabilities as Record<string, unknown> | null)?.website_reviews;
  return typeof n === "number" && n >= 0 ? n : WEBSITE_REVIEW_CAP_BY_TIER[tier] ?? WEBSITE_REVIEW_DEFAULT_CAP;
}

/** What a client may type: yourbusiness.com, www.yourbusiness.com or https://yourbusiness.com/page. */
export const isWebsiteAddress = (s: string) => /^([a-z]+:\/\/)?[^\s/]+\.[^\s]+$/i.test(s);

/** The same site however it is typed: no protocol, no www, no trailing slash, lower case. */
export const siteKey = (s: string) => s.trim().toLowerCase().replace(/^[a-z]+:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");

/** The line shown to a client who is at their limit, pointing at the next plan up. */
export function upgradeNote(cap: number): string {
  if (cap < WEBSITE_REVIEW_CAP_BY_TIER.growth) return `Growth includes ${WEBSITE_REVIEW_CAP_BY_TIER.growth} website reviews and VIP includes ${WEBSITE_REVIEW_CAP_BY_TIER.vip}.`;
  if (cap < WEBSITE_REVIEW_CAP_BY_TIER.vip) return `VIP includes ${WEBSITE_REVIEW_CAP_BY_TIER.vip} website reviews.`;
  return "";
}

/** Marks a task as the one for this website's Review, so it is never made twice. */
export const reviewTaskMarker = (reviewId: string) => `[website-review:${reviewId}]`;

/** The title and notes of the task that asks the account owner to write a client's Review. */
export function reviewTaskText(name: string, email: string | null, website: string, reviewId: string): { title: string; description: string } {
  return {
    title: `Write the Website Alignment Review for ${name}: ${website}`,
    description: `${name}${email ? ` (${email})` : ""} added ${website} for a Website Alignment Review. Open Website Reviews (Alignment Architect), press Write on this site, paste the Review, then Publish & email client. ${reviewTaskMarker(reviewId)}`,
  };
}

/** When a client adds a website for review, put a task on the owner's own list (once), so it is on her dashboard and in Tasks. Never throws. */
export async function askForReview(db: Db, review: { id: string; master_plan_id: string; website: string; created_at?: string }): Promise<void> {
  try {
    const house = await housePlanId(db);
    if (!house || review.master_plan_id === house) return;
    const { data: already } = await db.from("tasks").select("id").eq("master_plan_id", house).ilike("description", `%${reviewTaskMarker(review.id)}%`).limit(1).maybeSingle();
    if (already) return;
    const { data: plan } = await db.from("client_master_plans").select("client_name, client_email, created_at").eq("id", review.master_plan_id).maybeSingle();
    const email = ((plan?.client_email as string | null) ?? "").toLowerCase() || null;
    const name = (plan?.client_name as string | null) || email || "A client";
    if (/^eloise\b/i.test(name) || name === "Primary") return;
    const { count: earlier } = await db.from("website_reviews").select("id", { count: "exact", head: true }).eq("master_plan_id", review.master_plan_id).lt("created_at", review.created_at ?? new Date().toISOString());
    const from = (earlier ?? 0) === 0 && plan?.created_at ? (plan.created_at as string) : review.created_at ?? new Date().toISOString();
    const due = new Date(Math.max(Date.now(), new Date(from).getTime() + 14 * 86_400_000)).toISOString().slice(0, 10);
    const text = reviewTaskText(name, email, review.website, review.id);
    await db.from("tasks").insert({ master_plan_id: house, title: text.title, description: text.description, status: "backlog", priority: "medium", owner_action: true, due_date: due });
  } catch (e) {
    console.error("askForReview:", e);
  }
}

/** Every Review carries this section, so each client is shown how to get their pages found in search. */
export const SEO_SECTION_HEADING = "## Keywords and SEO: getting found";
export const hasSeoSection = (text: string) => text.includes(SEO_SECTION_HEADING);

/** The outline the owner starts from for a client's SEO section (filled in from the site's own title, headings, images and sitemap). */
export const SEO_SECTION_OUTLINE = `${SEO_SECTION_HEADING}

**What a search engine sees today**

- **Page title:** ...
- **Headings:** ... (one H1 per page)
- **Image descriptions:** ... of ... images have no alt text.
- **Structured data, sitemap and sharing image:** ...
- **Already good:** ...

**Keywords to target.** A starting list drawn from the client's offers. Check search volume and competition in Google Search Console or Google Keyword Planner before committing to any of it.

- ...

**Where to put them**

- **Title tag** (about 60 characters): ...
- **H1:** ...
- **Meta description** (about 150 characters): ...
- **Alt text:** ...
- **One page per offer or topic:** ...

**Technical fixes**

- ...

**Content that earns rankings**

- ...

**How to measure it.** In Google Search Console, watch Queries and Pages for these phrases. Expect movement in weeks, not days: check at four and eight weeks.
`;

/** Every Review also shows the client how their own AI Assistant in the Suite helps them carry out each change. */
export const ASSISTANT_SECTION_PREFIX = "## Putting this into action with";
export const hasAssistantSection = (text: string) => text.includes(ASSISTANT_SECTION_PREFIX);

/** The outline for that section, using the name the client gave their assistant (their own, never ours). */
export function assistantSectionOutline(assistantName: string): string {
  const n = assistantName.trim() || "your assistant";
  return `${ASSISTANT_SECTION_PREFIX} ${n}, your AI Assistant

${n} works only in your own Command Suite account, on your own AI key. It can write the wording, build your to-do list, and set up forms and booking links inside the Suite. It cannot edit your website or open Google Search Console, so you (or whoever looks after the site) paste its wording in. Anything it changes in your Suite waits for you to press Approve first.

**How to start.** Open ${n} from the AI Assistant box on Executive Home, or from the button in the corner of any page. ${n} cannot see this Review on its own, so paste in the change you are working on, say which page you mean, and say what you want.

- **To plan the whole job:** paste the changes and ask, "Create a project called Website fixes with a task for each of these changes, spread over the next three weeks." You will see a card to Approve.
- **Change 1:** "..." (a request written for this client's first change, and what ${n} will produce)
- **Change 2:** "..."
- **Change 3:** "..."
- **Change 4:** "..."
- **Change 5:** "..."
- **Keywords and SEO:** "Write a page title under 60 characters, an H1 and a meta description of about 150 characters for each page, using these keywords: [paste your list]." Also alt text for the images, and an outline for each article that answers a question buyers ask.
- **To keep it moving:** "Remind me in four weeks and again in eight weeks to check the Queries report in Google Search Console." It comes as a card to Approve.

When ${n}'s wording is not right, say what to change ("shorter", "more direct", "less formal") and it will rewrite it.
`;
}
