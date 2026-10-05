// Custom Pages: pages a client (or their AI assistant) adds to their own left menu and fills in.
// A page is a list of simple blocks. Everything stored is cleaned here so a page can never hold anything
// but plain text, checklists, tables and web links.

// A block can be a note waiting for the owner's approval: it then shows its own Edit and Approve buttons.
export type BlockReview = { review?: "draft" | "approved"; approvedAt?: string };
export type Block = (
  | { id: string; type: "heading"; text: string }
  | { id: string; type: "text"; text: string }
  | { id: string; type: "checklist"; title: string; items: { id: string; text: string; done: boolean }[] }
  | { id: string; type: "table"; title: string; columns: string[]; rows: string[][] }
  | { id: string; type: "callout"; text: string }
  | { id: string; type: "link"; label: string; url: string }
) &
  BlockReview;

const MAX_BLOCKS = 80;
const MAX_ITEMS = 200;
const MAX_ROWS = 300;
const MAX_COLS = 12;

const s = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
export const newId = () => Math.random().toString(36).slice(2, 10);
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

export function cleanBlocks(raw: unknown): Block[] {
  const out: Block[] = [];
  for (const r of asArray(raw).slice(0, MAX_BLOCKS)) {
    if (!r || typeof r !== "object") continue;
    const b = r as Record<string, unknown>;
    const id = s(b.id, 20) || newId();
    const before = out.length;
    switch (b.type) {
      case "heading":
        out.push({ id, type: "heading", text: s(b.text, 200) });
        break;
      case "text":
        out.push({ id, type: "text", text: s(b.text, 20000) });
        break;
      case "checklist":
        out.push({
          id,
          type: "checklist",
          title: s(b.title, 200),
          items: asArray(b.items).slice(0, MAX_ITEMS).map((i) => {
            const it = (i && typeof i === "object" ? i : { text: i }) as Record<string, unknown>;
            return { id: s(it.id, 20) || newId(), text: s(it.text, 500), done: it.done === true };
          }).filter((i) => i.text.trim()),
        });
        break;
      case "table": {
        const columns = asArray(b.columns).slice(0, MAX_COLS).map((c) => s(c, 80));
        if (!columns.length) break;
        out.push({
          id,
          type: "table",
          title: s(b.title, 200),
          columns,
          rows: asArray(b.rows).slice(0, MAX_ROWS).map((row) => columns.map((_, i) => s(asArray(row)[i], 1000))),
        });
        break;
      }
      case "callout":
        out.push({ id, type: "callout", text: s(b.text, 2000) });
        break;
      case "link": {
        const url = s(b.url, 600).trim();
        if (/^https?:\/\//i.test(url)) out.push({ id, type: "link", label: s(b.label, 200) || url, url });
        break;
      }
    }
    if (out.length > before && (b.review === "draft" || b.review === "approved")) {
      const last = out[out.length - 1];
      last.review = b.review;
      if (b.review === "approved") last.approvedAt = s(b.approvedAt, 40) || new Date().toISOString();
    }
  }
  return out;
}

export const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50) || "page";

// A short outline of a page for the AI assistant to read before it changes anything.
export function outline(blocks: Block[]): string {
  return blocks
    .map((b) => {
      if (b.type === "heading") return `# ${b.text}`;
      if (b.type === "text") return b.text.slice(0, 400);
      if (b.type === "callout") return `[Callout] ${b.text.slice(0, 300)}`;
      if (b.type === "checklist") return `[Checklist "${b.title}"] ${b.items.map((i) => `${i.done ? "[x]" : "[ ]"} ${i.text}`).join("; ")}`;
      if (b.type === "table") return `[Table "${b.title}"] columns: ${b.columns.join(" | ")}; ${b.rows.length} rows${b.rows.length ? "; e.g. " + b.rows.slice(0, 3).map((r) => r.join(" | ")).join(" / ") : ""}`;
      return `[Link] ${b.label} ${b.url}`;
    })
    .join("\n")
    .slice(0, 6000);
}
