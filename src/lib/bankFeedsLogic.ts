// Bank and card feeds (task 1150 part 2): the rules that turn raw bank lines into suggestions. Pure functions only (no database, no
// network), so they are tested on their own. Nothing here posts anything: the client approves every line.

/** Linked accounts allowed per plan (Babs 2026-10-19: Starter 2, Growth 4, VIP 8). Her own account counts as VIP. */
export const BANK_ACCOUNT_CAP_BY_TIER: Record<string, number> = { starter: 2, growth: 4, vip: 8 };
export const BANK_ACCOUNT_DEFAULT_CAP = 2;

export interface BankLine {
  id: string;
  connectionId: string;
  amountCents: number; // Stripe's sign: negative = money out
  description: string;
  day: string; // YYYY-MM-DD
}

export interface LedgerLine {
  id: string;
  type: "income" | "expense";
  amount: number;
  occurred_on: string;
  source: string;
  vendor?: string | null;
  category?: string | null;
}

export const typeOf = (cents: number): "income" | "expense" => (cents < 0 ? "expense" : "income");

// Words banks put on money that is only moving between the client's own accounts or being paid out by a processor.
const TRANSFERISH = /\b(transfer|xfer|online banking|autopay|auto pay|payment thank you|thank you payment|credit card payment|card payment|crd pmt|card pmt|payment - thank|ach pmt|epay|zelle to self|(to|from) (primary|taxes|savings|checking))\b/i;
// A payout from a processor the Suite already counts through its own sync (Stripe sales are posted as income when they happen).
const PROCESSOR_PAYOUT = /\b(stripe|stripe transfer|st-[a-z0-9]{6,})\b.*\b(transfer|payout)\b|\bstripe\b.*\btransfer\b|\bpaypal\b.*\btransfer\b|\bsquare\b.*\bdeposit\b/i;

export const looksLikeTransfer = (description: string) => TRANSFERISH.test(description) || PROCESSOR_PAYOUT.test(description);
export const looksLikeProcessorPayout = (description: string) => PROCESSOR_PAYOUT.test(description);

// Names banks shorten or mangle, shown the way people write them.
const KNOWN_VENDORS: [RegExp, string][] = [
  [/\bfacebk|\bfacebook\b|\bmeta (ads|platforms)/i, "Facebook"],
  [/\bamzn|\bamazon/i, "Amazon"],
  [/\bgodaddy/i, "GoDaddy"],
  [/\bgoogle\b/i, "Google"],
  [/\bzoom/i, "Zoom"],
  [/\bsupabase/i, "Supabase"],
  [/\btwilio/i, "Twilio"],
  [/\bboldsign/i, "BoldSign"],
  [/\bdescript/i, "Descript"],
  [/\belevenlabs/i, "ElevenLabs"],
  [/\bxoom/i, "Xoom"],
  [/\bsecurus/i, "Securus"],
  [/\bvercel/i, "Vercel"],
  [/\bopenai|\bchatgpt/i, "OpenAI"],
  [/\banthropic|\bclaude/i, "Anthropic"],
];
const COUNTRY_OR_STATE = /^(usa|us|sgp|gbr|can|aus|irl|ind|mex|deu|fra|[a-z]{2})$/i;

/** "AMZN Mktp US*2K4TY8 Amzn.com/bill WA" -> "Amazon"; strips card noise, codes, dates, and trailing state and country codes. */
export function cleanVendor(description: string): string {
  for (const [re, nice] of KNOWN_VENDORS) if (re.test(description || "")) return nice;
  let s = (description || "").replace(/[*#]/g, " ").replace(/\b(pos|debit|credit|purchase|card|checkcard|visa|mastercard|recurring|payment|pmt|ach|web id|online)\b/gi, " ");
  s = s.replace(/\b\d{2}\/\d{2}(\/\d{2,4})?\b/g, " ").replace(/\b(?=[A-Z0-9]*\d)[A-Z0-9]{8,}\b/g, " ").replace(/\b\d{3,}\b/g, " ");
  s = s.replace(/\b[a-z0-9.-]+\.(com|net|org|co|io)\b[^ ]*/gi, " ");
  s = s.replace(/[^A-Za-z0-9&' .,-]/g, " ").replace(/\s+/g, " ").trim();
  // Banks write "NAME, CITY, ST , USA": keep only what is before the first comma, then drop trailing state and country codes.
  s = s.split(",")[0].trim();
  const words = s.split(" ").filter(Boolean);
  while (words.length > 1 && COUNTRY_OR_STATE.test(words[words.length - 1])) words.pop();
  return words.slice(0, 3).map((w) => (w === w.toUpperCase() && w.length > 3 ? w[0] + w.slice(1).toLowerCase() : w)).join(" ").slice(0, 60);
}

const normalize = (s: string) => cleanVendor(s).toLowerCase();

// Plain keyword rules. The first match wins. The name is a standard label; if the client already uses a similar category, theirs is used instead.
const RULES: { test: RegExp; type?: "income" | "expense"; category: string }[] = [
  { test: /\b(zoom|google workspace|g suite|microsoft|office 365|adobe|canva|dropbox|notion|slack|openai|anthropic|chatgpt|github|vercel|supabase|squarespace|wix|godaddy|namecheap|mailchimp|convertkit|kajabi|teachable|calendly|zapier|make\.com|lastpass|1password|twilio|boldsign|descript|elevenlabs|answerthepublic|smtp|heygen|riverside|loom|zoom\.us|vimeo|assemblyai)\b/i, type: "expense", category: "Software" },
  { test: /\b(facebook|facebk|meta ads|fb ads|instagram|linkedin|google ads|youtube ads|tiktok ads|advertis)/i, type: "expense", category: "Advertising" },
  { test: /\b(restaurant|cafe|coffee|starbucks|doordash|grubhub|ubereats|uber eats|chipotle|mcdonald|pizza|grill|bistro|diner)\b/i, type: "expense", category: "Meals" },
  { test: /\b(airlines|delta|united air|southwest|american air|hotel|marriott|hilton|airbnb|uber|lyft|rental car|hertz|avis)\b/i, type: "expense", category: "Travel" },
  { test: /\b(staples|office depot|amazon|amzn|walmart|target|costco)\b/i, type: "expense", category: "Office supplies" },
  { test: /\b(insurance|geico|state farm|progressive|allstate)\b/i, type: "expense", category: "Insurance" },
  { test: /\b(verizon|at&t|t-mobile|comcast|xfinity|spectrum|cox|internet|wireless)\b/i, type: "expense", category: "Phone & internet" },
  { test: /\b(electric|gas company|water|utility|utilities|xcel|waste)\b/i, type: "expense", category: "Utilities" },
  { test: /\b(attorney|law office|legal|cpa|accounting|bookkeep|quickbooks|intuit|tax prep)\b/i, type: "expense", category: "Professional fees" },
  { test: /\b(irs|usataxpayment|state tax|dept of revenue|eftps)\b/i, type: "expense", category: "Taxes" },
  { test: /\b(service fee|monthly fee|maintenance fee|overdraft|wire fee|bank fee|interest charge|annual fee)\b/i, type: "expense", category: "Bank fees" },
  { test: /\b(payroll|gusto|adp|paychex)\b/i, type: "expense", category: "Payroll" },
  { test: /\b(interest paid|interest earned|dividend)\b/i, type: "income", category: "Interest" },
  { test: /\b(deposit|payment from|invoice|venmo|cash app|zelle from)\b/i, type: "income", category: "Client payments" },
];

// Other names clients commonly use for the same thing, so "Ads" or "Marketing" is chosen over a new "Advertising".
const ALIASES: Record<string, string[]> = {
  Advertising: ["ads", "advertising", "marketing", "promotion"],
  Software: ["software", "tools", "apps", "technology", "ai support", "subscriptions"],
  "Professional fees": ["professional fees", "professional services", "legal", "accounting", "contractors"],
  "Office supplies": ["office supplies", "supplies", "office"],
  "Phone & internet": ["phone & internet", "phone", "internet", "telecom"],
  Meals: ["meals", "meals & entertainment", "food"],
  Travel: ["travel", "travel & lodging"],
};

/** Picks the client's own spelling when they already have a similar category; otherwise the standard label. */
export function pickCategory(label: string, mine: string[]): string {
  const want = label.toLowerCase();
  const exact = mine.find((c) => c.toLowerCase() === want);
  if (exact) return exact;
  const aliases = (ALIASES[label] ?? []).map((a) => a.toLowerCase());
  const alias = mine.find((c) => aliases.includes(c.toLowerCase()));
  if (alias) return alias;
  const near = mine.find((c) => c.toLowerCase().includes(want) || want.includes(c.toLowerCase()));
  return near || label;
}

export interface Suggestion {
  type: "income" | "expense";
  vendor: string;
  category: string;
}

/**
 * The suggestion for one line. A vendor the client has already categorized (their own ledger) wins over a keyword guess.
 * `history` maps a normalized vendor to the category the client used last time.
 */
export function suggest(line: Pick<BankLine, "amountCents" | "description">, history: Map<string, string>, mineIncome: string[], mineExpense: string[]): Suggestion {
  const type = typeOf(line.amountCents);
  const vendor = cleanVendor(line.description) || (type === "income" ? "Deposit" : "Payment");
  const learned = history.get(normalize(line.description));
  const mine = type === "income" ? mineIncome : mineExpense;
  if (learned) return { type, vendor, category: learned };
  for (const r of RULES) {
    if (r.test.test(line.description) && (!r.type || r.type === type)) return { type, vendor, category: pickCategory(r.category, mine) };
  }
  return { type, vendor, category: type === "income" ? pickCategory("Income", mineIncome) : pickCategory("Uncategorized", mineExpense) };
}

const dayNum = (d: string) => Math.round(Date.parse(`${d}T00:00:00Z`) / 86400000);

/** Money moving between the client's own linked accounts: the same amount out of one and into another within a few days. Returns the ids to set aside. */
export function findOwnTransfers(lines: BankLine[], windowDays = 4): Set<string> {
  const out = new Set<string>();
  const used = new Set<string>();
  const sorted = [...lines].sort((a, b) => a.day.localeCompare(b.day));
  for (const a of sorted) {
    if (used.has(a.id) || a.amountCents === 0) continue;
    const mate = sorted.find((b) => b.id !== a.id && !used.has(b.id) && b.connectionId !== a.connectionId && b.amountCents === -a.amountCents && Math.abs(dayNum(b.day) - dayNum(a.day)) <= windowDays);
    if (mate) {
      used.add(a.id);
      used.add(mate.id);
      out.add(a.id);
      out.add(mate.id);
    }
  }
  return out;
}

/** An existing ledger line that looks like the same money (same direction and amount, within three days), e.g. one entered by hand. */
export function findDuplicate(line: Pick<BankLine, "amountCents" | "day">, ledger: LedgerLine[], takenIds: Set<string>): LedgerLine | null {
  const type = typeOf(line.amountCents);
  const amount = Math.abs(line.amountCents) / 100;
  for (const e of ledger) {
    if (takenIds.has(e.id) || e.type !== type) continue;
    if (Math.abs(Number(e.amount) - amount) > 0.005) continue;
    if (Math.abs(dayNum(e.occurred_on) - dayNum(line.day)) <= 3) return e;
  }
  return null;
}

/** The day Stripe's timestamp falls on, in Mountain time (the Suite's day boundary). */
export const dayOf = (unixSeconds: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Denver", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(unixSeconds * 1000));
