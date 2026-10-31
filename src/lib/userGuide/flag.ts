// Client User Guide (task 1604). Open to every account since 2026-10-31.
export const USER_GUIDE_OPEN_TO_ALL = true;
const USER_GUIDE_TESTERS = ["msamilynne+eloise-practice@gmail.com"];

export const isGuideTester = (email: string | null | undefined) => USER_GUIDE_TESTERS.includes((email || "").toLowerCase());

export const userGuideOpenFor = (email: string | null | undefined, architect: boolean) =>
  USER_GUIDE_OPEN_TO_ALL || architect || isGuideTester(email);
