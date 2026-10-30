// The Tasks page's focus row: separates the LifeCharter Program work from the Incubator work (and shows everything else
// apart). A task counts as Incubator when it is filed under an Incubator project, and as the Program when it is filed under
// the LifeCharter Program offer or a LifeCharter Program project. Nothing is stored: it follows the project and program a
// task is already filed under, so a new task in either one lands in the right place by itself.
export type Focus = "program" | "incubator";
export type FocusFilter = "" | Focus | "other";

export const FOCUS_LABEL: Record<Focus, string> = { program: "LifeCharter Program", incubator: "Incubator" };

export function focusOf(projectName: string | null | undefined, offerName: string | null | undefined): Focus | null {
  if (/^incubator\b/i.test((projectName ?? "").trim())) return "incubator";
  if (/lifecharter program/i.test(offerName ?? "") || /lifecharter program/i.test(projectName ?? "")) return "program";
  return null;
}

export function matchesFocus(filter: FocusFilter, focus: Focus | null): boolean {
  if (!filter) return true;
  return filter === "other" ? focus === null : focus === filter;
}
