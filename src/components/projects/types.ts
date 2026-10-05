export interface PTask {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  startDay: string | null;
  dueDay: string | null;
  assigneeMemberId: string | null;
  assigneeGuestId: string | null;
  shared: boolean;
  position: number;
}
export interface PMilestone {
  id: string;
  title: string;
  dueDay: string | null;
  done: boolean;
}
export interface PGuest {
  id: string;
  name: string;
  email: string | null;
  role: "client" | "contractor";
  link: string;
}
export interface PTeam {
  id: string;
  name: string;
  role: string;
}
export interface PProject {
  id: string;
  name: string;
  goal: string;
  status: string;
  startDate: string | null;
  dueDate: string | null;
  color: string | null;
  notes: string;
  ownerMemberId: string | null;
  templateKey: string | null;
}
export interface PData {
  project: PProject;
  tasks: PTask[];
  milestones: PMilestone[];
  guests: PGuest[];
  team: PTeam[];
}

// The board columns are the same stages as the Tasks board, so a project's tasks and today's list always agree.
export const COLUMNS: { key: string; label: string }[] = [
  { key: "backlog", label: "To do" },
  { key: "today", label: "Today" },
  { key: "in_progress", label: "In progress" },
  { key: "waiting", label: "Waiting" },
  { key: "done", label: "Done" },
];
export const STATUS_LABEL: Record<string, string> = Object.fromEntries(COLUMNS.map((c) => [c.key, c.label]));
export const PROJECT_STATUS_LABEL: Record<string, string> = { planning: "Planning", active: "Active", on_hold: "On hold", done: "Done" };
export const PRIORITY_COLOR: Record<string, string> = { low: "#8fb58a", medium: "#7b8fa3", high: "#c9855e", critical: "#b3392b" };

export const tzParam = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {
    return "";
  }
};
export const todayStr = () => new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
export const fmtDay = (d: string | null) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "");
export const dayNum = (d: string) => Math.round(new Date(`${d}T12:00:00Z`).getTime() / 86400000);
