// Top-tier projects first, each followed by its secondary-tier projects named "Top › Secondary", so pickers and logs read as tiers.
export function tieredProjects<T extends { id: string; name: string; parent_id?: string | null }>(rows: T[]): { id: string; name: string }[] {
  const byId = new Map(rows.map((r) => [r.id, r]));
  const tops = rows.filter((r) => !r.parent_id || !byId.has(r.parent_id));
  const out: { id: string; name: string }[] = [];
  for (const t of tops) {
    out.push({ id: t.id, name: t.name });
    for (const c of rows.filter((r) => r.parent_id === t.id)) out.push({ id: c.id, name: `${t.name} › ${c.name}` });
  }
  return out;
}
