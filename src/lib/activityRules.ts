// The follow-up engine sends an email, marks its task done AND writes a log row
// with this note. Today's Activity and the Weekly View count the completed task
// (not the log row), so the two never disagree.
export const AUTO_FOLLOWUP_NOTE = "Auto-sent follow-up email";
