// The printable business plan, as a neutral document model. Two renderers (PDF and Word) turn it into files.
export type Block =
  | { t: "h2"; text: string }
  | { t: "h3"; text: string }
  | { t: "p"; text: string }
  | { t: "bullets"; items: string[] }
  | { t: "table"; head: string[]; rows: string[][]; widths?: number[]; align?: ("l" | "r")[] }
  | { t: "note"; text: string };

export interface Part {
  title: string; // shown as a main heading and in the contents
  level: 1 | 2; // 2 = a section inside an appendix
  pageBreakBefore?: boolean;
  blocks: Block[];
}

export interface PlanDoc {
  label: string; // "Business Plan"
  tagline: string; // "Funding Request" etc.
  business: string;
  preparedBy: string;
  preparedFor: string; // recipient / organization, may be empty
  date: string; // "October 4, 2026"
  letter: string[] | null; // cover letter paragraphs
  letterSignoff: string;
  parts: Part[];
}

// Section text is plain: paragraphs, "- " or "1. " lines, and short "Heading:" lines. Turn it into blocks.
export function textToBlocks(raw: string): Block[] {
  const text = raw
    .replace(/\r/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
  const out: Block[] = [];
  let list: string[] = [];
  let para: string[] = [];
  const flushList = () => {
    if (list.length) out.push({ t: "bullets", items: list });
    list = [];
  };
  const flushPara = () => {
    if (para.length) out.push({ t: "p", text: para.join(" ") });
    para = [];
  };
  for (const line of text.split("\n")) {
    const l = line.trim();
    if (!l) {
      flushList();
      flushPara();
      continue;
    }
    const bullet = l.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      flushPara();
      list.push(bullet[1]);
    } else if (l.length <= 70 && l.endsWith(":") && !/[.!?]:$/.test(l)) {
      flushList();
      flushPara();
      out.push({ t: "h3", text: l.slice(0, -1) });
    } else {
      flushList();
      para.push(l);
    }
  }
  flushList();
  flushPara();
  return out;
}

export type Version = "funding" | "partnership" | "general";
export const VERSION_LABEL: Record<Version, string> = {
  funding: "Funding Request",
  partnership: "Partnership Proposal",
  general: "Business Plan",
};

const firstSentences = (s: string, n = 2) => (s.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+/g) || [s]).slice(0, n).join(" ").trim();

// A plain cover letter built from the client's own words; the AI can write a richer one.
export function templateLetter(v: Version, f: { business: string; recipient: string; organization: string; ask: string; vision: string }): string[] {
  const to = f.recipient.trim() ? `Dear ${f.recipient.trim()},` : f.organization.trim() ? `Dear ${f.organization.trim()} team,` : "To whom it may concern,";
  const ask = f.ask.trim().replace(/[.\s]+$/, "");
  const brief = f.vision.trim() ? firstSentences(f.vision) : "";
  const paras: string[] = [to];
  if (v === "funding") {
    paras.push(`I am writing on behalf of ${f.business} to request ${ask || "your support"}${f.organization.trim() ? ` from ${f.organization.trim()}` : ""}. The attached business plan sets out who we serve, what we offer, how we earn revenue and the financial picture behind this request.`);
  } else {
    paras.push(`I am writing on behalf of ${f.business} to propose a partnership${f.organization.trim() ? ` with ${f.organization.trim()}` : ""}${ask ? `: ${ask}` : ""}. The attached business plan shows who we serve, what we offer and where we are headed, so you can see how our work could fit together.`);
  }
  if (brief) paras.push(`In brief: ${brief}`);
  paras.push("I would welcome the chance to walk you through the plan and answer any questions. Thank you for your time and consideration.");
  return paras;
}
