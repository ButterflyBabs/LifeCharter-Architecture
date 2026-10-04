import { randomUUID } from "crypto";
import { createServerClient } from "@/lib/supabase/server";

// The assistant's chat is kept in "conversations". The current one is what the assistant follows and what
// the card shows. Starting a new conversation SAVES the old one (nothing is erased); a saved one can be
// read again, continued, or deleted by the client.
const MAX_SAVED = 40;

export interface SavedConversation {
  id: string;
  archivedAt: string;
  count: number;
  title: string;
}

const shortLine = (s: string) => (s.startsWith("Give me my morning briefing") ? "Morning briefing" : s.replace(/\s+/g, " ").slice(0, 80));

export async function startNewConversation(planId: string): Promise<string | null> {
  const db = createServerClient();
  const { count } = await db.from("assistant_messages").select("id", { count: "exact", head: true }).eq("master_plan_id", planId).is("archive_id", null);
  if (!count) return null;
  const id = randomUUID();
  await db.from("assistant_messages").update({ archive_id: id, archived_at: new Date().toISOString() }).eq("master_plan_id", planId).is("archive_id", null);
  // Keep the most recent saved conversations.
  const list = await listSaved(planId, 200);
  for (const old of list.slice(MAX_SAVED)) await db.from("assistant_messages").delete().eq("master_plan_id", planId).eq("archive_id", old.id);
  return id;
}

export async function listSaved(planId: string, limit = MAX_SAVED): Promise<SavedConversation[]> {
  const { data } = await createServerClient()
    .from("assistant_messages")
    .select("archive_id, archived_at, role, content, created_at")
    .eq("master_plan_id", planId)
    .not("archive_id", "is", null)
    .order("created_at", { ascending: true })
    .limit(4000);
  const by = new Map<string, SavedConversation>();
  for (const m of (data ?? []) as { archive_id: string; archived_at: string; role: string; content: string }[]) {
    const c = by.get(m.archive_id) ?? { id: m.archive_id, archivedAt: m.archived_at, count: 0, title: "" };
    c.count++;
    if (!c.title && m.role === "user") c.title = shortLine(m.content);
    by.set(m.archive_id, c);
  }
  return Array.from(by.values())
    .map((c) => ({ ...c, title: c.title || "Conversation" }))
    .sort((a, b) => b.archivedAt.localeCompare(a.archivedAt))
    .slice(0, limit);
}

export async function readSaved(planId: string, id: string) {
  const { data } = await createServerClient()
    .from("assistant_messages")
    .select("id, role, content, created_at")
    .eq("master_plan_id", planId)
    .eq("archive_id", id)
    .order("created_at", { ascending: true })
    .limit(200);
  return ((data ?? []) as { id: string; role: string; content: string; created_at: string }[]).map((m) => (m.role === "user" ? { ...m, content: shortLine(m.content) } : m));
}

// Make a saved conversation the current one again (the current one is saved first).
export async function continueSaved(planId: string, id: string): Promise<boolean> {
  const db = createServerClient();
  const { count } = await db.from("assistant_messages").select("id", { count: "exact", head: true }).eq("master_plan_id", planId).eq("archive_id", id);
  if (!count) return false;
  await startNewConversation(planId);
  await db.from("assistant_messages").update({ archive_id: null, archived_at: null }).eq("master_plan_id", planId).eq("archive_id", id);
  return true;
}

export async function deleteSaved(planId: string, id: string) {
  await createServerClient().from("assistant_messages").delete().eq("master_plan_id", planId).eq("archive_id", id);
}
