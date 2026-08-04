// Client helper: load the client's business segments flattened for a dropdown.
export interface SegmentOption {
  id: string;
  label: string;
}

export async function fetchSegmentOptions(): Promise<SegmentOption[]> {
  try {
    const res = await fetch("/api/segments", { cache: "no-store" });
    if (!res.ok) return [];
    const d = await res.json().catch(() => ({}));
    const out: SegmentOption[] = [];
    for (const b of (d.businesses || []) as {
      name?: string;
      segments?: { id: string; name: string }[];
    }[]) {
      for (const s of b.segments || []) {
        out.push({ id: s.id, label: b.name ? `${b.name} · ${s.name}` : s.name });
      }
    }
    return out;
  } catch {
    return [];
  }
}
