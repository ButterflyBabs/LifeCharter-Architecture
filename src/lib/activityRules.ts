// What counts as one piece of activity, shared by Today's Activity and the
// Weekly View so they never disagree.
//
// The follow-up engine sends an email, marks its task done AND writes a log row.
// That is one follow-up, not two — the completed task is the one we count, so the
// mirrored log row is skipped.
export const AUTO_FOLLOWUP_NOTE = "Auto-sent follow-up email";
export const isMirroredLog = (note: string | null | undefined) => note === AUTO_FOLLOWUP_NOTE;
