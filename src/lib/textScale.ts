// Text size scale. "v1" is the original (Small 14px, Medium 16px, Large 18px base). "v2" is one notch bigger
// (Small 16px, Medium 18px, Large 20px) and also makes the small fixed-pixel labels scale and never drop below 12px
// (see the html.text-v2 block in globals.css). A person's own profile preference (profiles.preferences.textScale)
// wins; everyone without one gets this default. Rolled out on Babs's account first (2026-10-17); flip the default to
// "v2" to roll it out to everyone, or back to "v1" to undo it.
export type TextScale = "v1" | "v2";
export const TEXT_SCALE_DEFAULT: TextScale = "v1";
export const ROOT_SIZES: Record<TextScale, Record<"small" | "medium" | "large", string>> = {
  v1: { small: "14px", medium: "16px", large: "18px" },
  v2: { small: "16px", medium: "18px", large: "20px" },
};
