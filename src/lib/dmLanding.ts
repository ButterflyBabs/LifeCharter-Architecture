/**
 * Where a new person lands. A board can have an approval stage for Facebook (key "fb_approval"): Facebook people who
 * would land in "To reach out" wait there until the owner approves them by moving them on. Boards without that stage,
 * other platforms, and anyone placed in a stage on purpose are unchanged.
 */
export const FB_APPROVAL_KEY = "fb_approval";

type StageLike = { key: string | null };

export function landingStage<T extends StageLike>(stages: T[], platform: string | null | undefined, wanted: T | undefined): T | undefined {
  if (!wanted || platform !== "FB" || wanted.key !== "to_reach") return wanted;
  return stages.find((s) => s.key === FB_APPROVAL_KEY) ?? wanted;
}
