// How one client's portal looks (task 1147): colors, font, heading, logo, banner, and the sections (shown or hidden,
// renamed, in the order the owner chose). Stored per portal in client_portals.look; the account's default look lives in
// client_portal_defaults and a new portal starts from it. Pure, so the owner page and the portal page share it.

export const PORTAL_SECTIONS = [
  { key: "sessions", title: "Your sessions" },
  { key: "programs", title: "Your programs" },
  { key: "homework", title: "Your homework" },
  { key: "pay", title: "To pay" },
  { key: "goals", title: "Your goals" },
  { key: "notes", title: "Session notes" },
  { key: "files", title: "Files and resources" },
  { key: "messages", title: "Messages" },
] as const;
export type SectionKey = (typeof PORTAL_SECTIONS)[number]["key"];

export const PORTAL_FONTS = [
  { key: "classic", label: "Classic (serif headings)", heading: "'EB Garamond', Georgia, 'Times New Roman', serif", body: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { key: "modern", label: "Modern (clean sans)", heading: "system-ui, -apple-system, 'Segoe UI', sans-serif", body: "system-ui, -apple-system, 'Segoe UI', sans-serif" },
  { key: "warm", label: "Warm (rounded)", heading: "ui-rounded, 'Nunito', 'Trebuchet MS', system-ui, sans-serif", body: "ui-rounded, 'Nunito', 'Trebuchet MS', system-ui, sans-serif" },
  { key: "elegant", label: "Elegant (all serif)", heading: "Georgia, 'Times New Roman', serif", body: "Georgia, 'Times New Roman', serif" },
] as const;
export type FontKey = (typeof PORTAL_FONTS)[number]["key"];

export const COLOR_PRESETS = [
  { name: "Teal", accent: "#2E7C83", background: "#FBF8F1" },
  { name: "Indigo", accent: "#2A2F6B", background: "#F7F4EE" },
  { name: "Plum", accent: "#6B3A6B", background: "#FAF6F8" },
  { name: "Forest", accent: "#2F5D46", background: "#F5F7F2" },
  { name: "Terracotta", accent: "#B4583A", background: "#FBF6F1" },
  { name: "Gold", accent: "#9A7421", background: "#FBF8EF" },
  { name: "Ocean", accent: "#1F5F8B", background: "#F3F7FA" },
  { name: "Charcoal", accent: "#333842", background: "#F7F7F5" },
] as const;

export interface PortalLook {
  accent: string;
  background: string;
  font: FontKey;
  heading: string; // "{first}" becomes the client's first name
  useAccountLogo: boolean;
  logoPath: string | null; // this portal's own logo, in the portal-files bucket
  bannerPath: string | null;
  sections: { key: SectionKey; title: string; hidden: boolean }[];
}

export const DEFAULT_LOOK: PortalLook = {
  accent: "#2E7C83",
  background: "#FBF8F1",
  font: "classic",
  heading: "Welcome, {first}",
  useAccountLogo: true,
  logoPath: null,
  bannerPath: null,
  sections: PORTAL_SECTIONS.map((s) => ({ key: s.key, title: s.title, hidden: false })),
};

const HEX = /^#[0-9a-fA-F]{6}$/;
const str = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

/** A safe, complete look from whatever was saved or sent (unknown values fall back to the default). */
export function cleanLook(raw: unknown, base: PortalLook = DEFAULT_LOOK): PortalLook {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const sections: PortalLook["sections"] = [];
  const seen = new Set<string>();
  if (Array.isArray(r.sections)) {
    for (const s of r.sections as Record<string, unknown>[]) {
      const def = PORTAL_SECTIONS.find((p) => p.key === s?.key);
      if (!def || seen.has(def.key)) continue;
      seen.add(def.key);
      sections.push({ key: def.key, title: str(s.title, 60) || def.title, hidden: Boolean(s.hidden) });
    }
  }
  for (const s of base.sections) if (!seen.has(s.key)) sections.push({ ...s });
  const path = (v: unknown) => (typeof v === "string" && /^[0-9a-f-]{36}\/[A-Za-z0-9._\/-]{1,200}$/.test(v) && !v.includes("..") ? v : null);
  return {
    accent: HEX.test(str(r.accent, 7)) ? str(r.accent, 7) : base.accent,
    background: HEX.test(str(r.background, 7)) ? str(r.background, 7) : base.background,
    font: PORTAL_FONTS.some((f) => f.key === r.font) ? (r.font as FontKey) : base.font,
    heading: str(r.heading, 80) || base.heading,
    useAccountLogo: typeof r.useAccountLogo === "boolean" ? r.useAccountLogo : base.useAccountLogo,
    logoPath: r.logoPath === undefined ? base.logoPath : path(r.logoPath),
    bannerPath: r.bannerPath === undefined ? base.bannerPath : path(r.bannerPath),
    sections,
  };
}

/** The heading with the client's first name filled in. */
export const headingFor = (look: PortalLook, first: string | null) => look.heading.replace(/\{first\}/gi, first || "there").trim();

/** Readable text on the accent color (white or near-black). */
export function onAccent(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62 ? "#1F2B3A" : "#FFFFFF";
}
