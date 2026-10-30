// Client User Guide (task 1604). Babs and the Eloise Practice account only until the entries are written and approved;
// switch USER_GUIDE_OPEN_TO_ALL on at release.
export const USER_GUIDE_OPEN_TO_ALL = false;
const USER_GUIDE_TESTERS = ["msamilynne+eloise-practice@gmail.com"];

export const userGuideOpenFor = (email: string | null | undefined, architect: boolean) =>
  USER_GUIDE_OPEN_TO_ALL || architect || USER_GUIDE_TESTERS.includes((email || "").toLowerCase());
