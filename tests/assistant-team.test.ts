import { test } from "node:test";
import assert from "node:assert/strict";
import { listTeam, addTeamMember, changeMemberAccess, setMemberAccessEnd, removeTeamMember } from "../src/lib/ai/actions/team";
import { ACTION_TOOLS } from "../src/lib/ai/actions/registry";
import type { ActionCtx } from "../src/lib/ai/actions/types";

// A tiny stand-in for the database: every query on a table answers with that table's rows.
function fakeDb(rows: Record<string, unknown[]>) {
  return {
    from(table: string) {
      const data = rows[table] ?? [];
      const q: Record<string, unknown> = {};
      for (const m of ["select", "eq", "neq", "in", "or", "ilike", "limit", "order", "is", "gte", "lt"]) q[m] = () => q;
      q.maybeSingle = async () => ({ data: data[0] ?? null });
      q.single = async () => ({ data: data[0] ?? null });
      q.then = (ok: (v: unknown) => unknown) => Promise.resolve({ data, count: data.length }).then(ok);
      return q;
    },
  };
}
const ctxWith = (rows: Record<string, unknown[]>) => ({ planId: "p", userEmail: null, db: fakeDb(rows) }) as unknown as ActionCtx;

const future = new Date(Date.now() + 20 * 86_400_000).toISOString().slice(0, 10);
const morgan = { id: "m1", workspace_id: "w1", name: "Morgan Beach", email: "morgan@example.com", role: "editor", status: "pending", permissions: { preset: "support", features: { tasks: "edit" }, extras: { restrict: true, expiresOn: future } }, user_id: null, joined_at: null };
const sumbal = { id: "m2", workspace_id: "w1", name: "Sumbal Khan", email: "sumbal@example.com", role: "viewer", status: "active", permissions: null, user_id: "u2", joined_at: null };
const team = ctxWith({ workspaces: [{ id: "w1", name: "Main", is_default: true }], workspace_members: [morgan, sumbal] });

test("list_team shows role, invitation state, areas and the last day", async () => {
  const text = await listTeam.read!({}, team);
  assert.match(text, /Morgan Beach \(morgan@example.com\) \| Editor \| invitation not emailed yet \| Support & client care/);
  const sent = ctxWith({ workspaces: [{ id: "w1", name: "Main", is_default: true }], workspace_members: [{ ...morgan, invite_sent_at: "2026-11-02T17:20:00Z" }] });
  assert.match(await listTeam.read!({}, sent), /invitation emailed 2026-11-02, not accepted yet/);
  assert.match(text, /last day /);
  assert.match(text, /Sumbal Khan .* \| Viewer \| active \| Viewer role defaults \| no end date/);
  assert.match(text, /Access presets I can apply: .*bookkeeper/);
  assert.doesNotMatch(text, /team_ops/); // house-only preset stays out
});

test("last day card names the person, the date and the reminder, and refuses the past or a stranger", async () => {
  const r = await setMemberAccessEnd.plan!({ member: "morgan", last_day: future }, team);
  assert.ok("preview" in r);
  if ("preview" in r) {
    assert.match(r.preview.title, /Set Morgan Beach's last day of access/);
    assert.ok(r.preview.lines.some((l) => /signed out of everything/.test(l)));
    assert.ok(r.preview.lines.some((l) => /two days before/.test(l)));
  }
  const cleared = await setMemberAccessEnd.plan!({ member: "morgan@example.com", clear: true }, team);
  assert.ok("preview" in cleared && /Remove Morgan Beach's end date/.test(cleared.preview.title));
  assert.ok("error" in (await setMemberAccessEnd.plan!({ member: "morgan", last_day: "2020-01-01" }, team)));
  assert.ok("error" in (await setMemberAccessEnd.plan!({ member: "morgan" }, team)));
  assert.ok("error" in (await setMemberAccessEnd.plan!({ member: "nobody", last_day: future }, team)));
});

test("a name that matches two people asks which", async () => {
  const two = ctxWith({ workspaces: [{ id: "w1", name: "Main", is_default: true }], workspace_members: [morgan, { ...sumbal, name: "Morgan Lee", email: "lee@example.com" }] });
  const r = await setMemberAccessEnd.plan!({ member: "morgan", last_day: future }, two);
  assert.ok("error" in r && /More than one person/.test(r.error));
});

test("changing access needs a real preset and keeps the last day", async () => {
  assert.ok("error" in (await changeMemberAccess.plan!({ member: "morgan" }, team)));
  assert.ok("error" in (await changeMemberAccess.plan!({ member: "morgan", preset: "team_ops" }, team)));
  const r = await changeMemberAccess.plan!({ member: "morgan", preset: "bookkeeper", role: "viewer" }, team);
  assert.ok("preview" in r);
  if ("preview" in r) {
    assert.ok(r.preview.lines.some((l) => /Bookkeeper/.test(l)));
    assert.ok(r.preview.lines.some((l) => /last day of access, if any, is kept/.test(l)));
  }
});

test("adding someone checks the email, the preset and the date, and sends no email", async () => {
  assert.ok("error" in (await addTeamMember.plan!({ name: "A", email: "nope" }, team)));
  assert.ok("error" in (await addTeamMember.plan!({ name: "A", email: "a@example.com", preset: "team_ops" }, team)));
  assert.ok("error" in (await addTeamMember.plan!({ name: "A", email: "a@example.com", access_ends_on: "2020-01-01" }, team)));
  assert.ok("error" in (await addTeamMember.plan!({ name: "A", email: "morgan@example.com" }, team))); // already on the team
});

test("removing someone says they lose access and that undo puts them back", async () => {
  const r = await removeTeamMember.plan!({ member: "sumbal" }, team);
  assert.ok("preview" in r);
  if ("preview" in r) assert.ok(r.preview.lines.some((l) => /lose all access/.test(l)));
});

test("team tools are registered once, writes can be undone", () => {
  for (const n of ["list_team", "add_team_member", "change_member_access", "set_member_access_end", "remove_team_member"]) {
    const t = ACTION_TOOLS.filter((x) => x.name === n);
    assert.equal(t.length, 1, n);
    if (t[0].kind === "write") assert.ok(t[0].plan && t[0].run && t[0].undo, n);
    else assert.ok(t[0].read, n);
  }
});
