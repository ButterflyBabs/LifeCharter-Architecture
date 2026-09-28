import type { FormField } from "@/lib/crm";

const TYPES = new Set(["text", "email", "tel", "date", "textarea", "select"]);

// Validates a form's field list. Every form keeps a required email field, since
// the email is how a submission becomes a contact.
export function cleanFields(v: unknown): FormField[] | null {
  if (!Array.isArray(v)) return null;
  const out: FormField[] = [];
  const seen = new Set<string>();
  for (const raw of v.slice(0, 30)) {
    const f = (raw ?? {}) as Record<string, unknown>;
    const label = String(f.label ?? "").trim().slice(0, 120);
    const name = String(f.name || label).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 40);
    if (!label || !name || seen.has(name)) continue;
    seen.add(name);
    const type = TYPES.has(String(f.type)) ? (String(f.type) as FormField["type"]) : "text";
    const options = Array.isArray(f.options) ? f.options.map((o) => String(o).trim().slice(0, 120)).filter(Boolean).slice(0, 30) : undefined;
    out.push({ name, label, type: options?.length ? "select" : type === "select" ? "text" : type, required: Boolean(f.required), ...(options?.length ? { options } : {}) });
  }
  if (!out.some((f) => f.name === "email")) out.unshift({ name: "email", label: "Email", type: "email", required: true });
  else out.forEach((f) => f.name === "email" && Object.assign(f, { type: "email", required: true }));
  return out;
}
