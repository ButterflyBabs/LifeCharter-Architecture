// @mentions. In storage a mention is "@[Display Name](user-id)", so it keeps
// pointing at the right person even if they rename themselves; while typing,
// people just see "@Display Name".

export const MENTION_TOKEN = /@\[([^\]]{1,80})\]\(([0-9a-fA-F-]{36})\)/g;

// "@[Jordan Smith](uuid)" → "@Jordan Smith", for previews and plain text.
export function toPlain(text: string | null | undefined): string {
  return (text ?? "").replace(MENTION_TOKEN, "@$1");
}

export type Segment = { text: string; mention?: { name: string; id: string } };

export function splitMentions(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of Array.from(text.matchAll(MENTION_TOKEN))) {
    const i = m.index ?? 0;
    if (i > last) out.push({ text: text.slice(last, i) });
    out.push({ text: `@${m[1]}`, mention: { name: m[1], id: m[2] } });
    last = i + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

// Turn the "@Name" the author typed back into tokens for the people they
// picked. Longest names first so "@Ann Lee" wins over "@Ann".
export function encodeMentions(text: string, picked: Map<string, string>): string {
  let out = text;
  const names = Array.from(picked.keys()).sort((a, b) => b.length - a.length);
  for (const name of names) {
    const id = picked.get(name)!;
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`(^|[^\\w\\]])@${escaped}(?![\\w])`, "g"), `$1@[${name}](${id})`);
  }
  return out;
}

// Stored text → what the author sees when editing, plus who was mentioned.
export function decodeMentions(stored: string): { text: string; picked: Map<string, string> } {
  const picked = new Map<string, string>();
  const text = stored.replace(MENTION_TOKEN, (_m, name: string, id: string) => {
    picked.set(name, id);
    return `@${name}`;
  });
  return { text, picked };
}
