// Each person's own order for the Tasks page's sections (the three groups, and the lists and project sections inside
// a group). An order is a list of section keys; a key that is not in it (a new project, say) goes after the ones that
// are, in its usual place among the other new ones.
export function applyOrder(keys: string[], saved: readonly string[] | null | undefined): string[] {
  if (!saved?.length) return keys;
  const known = saved.filter((k) => keys.includes(k));
  return [...known, ...keys.filter((k) => !known.includes(k))];
}

// Dragging `from` onto `to`: it takes that section's place and the others shift along.
export function moveKey(order: readonly string[], from: string, to: string): string[] {
  const a = order.indexOf(from);
  const b = order.indexOf(to);
  if (a < 0 || b < 0 || a === b) return [...order];
  const next = order.filter((k) => k !== from);
  next.splice(b, 0, from);
  return next;
}

// What the preferences API will store: a few named orders, each a short list of short keys.
export function cleanOrders(v: unknown): Record<string, string[]> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const out: Record<string, string[]> = {};
  for (const [scope, list] of Object.entries(v as Record<string, unknown>).slice(0, 40)) {
    if (!/^[\w:.-]{1,60}$/.test(scope) || !Array.isArray(list)) continue;
    const keys = list.filter((k): k is string => typeof k === "string" && k.length > 0 && k.length <= 80).slice(0, 120);
    if (keys.length) out[scope] = keys;
  }
  return out;
}
