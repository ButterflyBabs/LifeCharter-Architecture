import { createServerClient } from "@/lib/supabase/server";
import { resolveActor } from "@/lib/authz";

// Who a task can be assigned to: the account's team members (every workspace
// of this master plan). An unassigned task is the owner's own.

export interface Assignee {
  id: string;
  name: string;
  email: string;
  role: string;
}

export async function planMembers(masterPlanId: string): Promise<Assignee[]> {
  const db = createServerClient();
  const { data: ws } = await db.from("workspaces").select("id").eq("master_plan_id", masterPlanId);
  const ids = (ws ?? []).map((w) => w.id as string);
  if (!ids.length) return [];
  const { data } = await db.from("workspace_members").select("id, name, email, role").in("workspace_id", ids).in("status", ["active", "pending"]).order("name");
  return ((data ?? []) as Assignee[]).filter((m) => m.role !== "sales");
}

// The signed-in member's id (null for the owner).
export async function myMemberId(): Promise<string | null> {
  const a = await resolveActor().catch(() => null);
  return a?.kind === "member" ? a.memberId : null;
}

// Tell someone a task was just assigned to them.
export async function notifyAssignee(m: Assignee, task: { title: string; due_at?: string | null }, byName: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !m.email) return;
  const app = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://lccommandsuite.com";
  const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
  const due = task.due_at ? new Date(task.due_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : null;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: process.env.TASK_REMINDER_FROM || "LifeCharter Command Suite <reminders@lccommandsuite.com>",
      to: m.email,
      subject: `New task for you: ${task.title}`.slice(0, 180),
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#2E3A46;max-width:520px">
<p>Hi ${esc(m.name.split(" ")[0] || "there")},</p>
<p>${esc(byName)} assigned you a task:</p>
<p style="font-size:17px;color:#1a2b4a"><strong>${esc(task.title)}</strong>${due ? `<br><span style="font-size:14px;color:#7a8a99">Due ${esc(due)}</span>` : ""}</p>
<p><a href="${app}/tasks?view=mine" style="display:inline-block;background:#2E7C83;color:#fff;text-decoration:none;font-weight:bold;padding:10px 20px;border-radius:999px">See my tasks</a></p></div>`,
    }),
  }).catch((e) => console.error("task assign mail:", e));
}

// A friendly name for whoever is assigning ("AmiLynne", "Marcello").
export async function actorName(): Promise<string> {
  const a = await resolveActor().catch(() => null);
  if (!a || a.kind === "none") return "Your team";
  const db = createServerClient();
  if (a.kind === "member" && a.memberId) {
    const { data } = await db.from("workspace_members").select("name").eq("id", a.memberId).maybeSingle();
    if (data?.name) return String(data.name).split(" ")[0];
  }
  if (a.userId) {
    const { data } = await db.from("profiles").select("full_name, display_name").eq("id", a.userId).maybeSingle();
    const n = (data?.display_name || data?.full_name || "") as string;
    if (n) return n.split(" ")[0];
  }
  return a.email ? a.email.split("@")[0] : "Your team";
}
