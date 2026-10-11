import { test } from "node:test";
import assert from "node:assert/strict";
import { taskFollowThrough, cultureOps } from "../src/lib/scoring/operational";

const NOW = Date.parse("2026-10-11T12:00:00Z");
const day = (n: number) => new Date(NOW + n * 86_400_000).toISOString();

test("too few tasks to judge: no score", () => {
  assert.equal(taskFollowThrough([{ status: "done", completed_at: day(-1) }, { status: "backlog" }], NOW), null);
});

test("an undated backlog is never counted against anyone", () => {
  const backlog = Array.from({ length: 300 }, () => ({ status: "backlog" }));
  const done = Array.from({ length: 5 }, () => ({ status: "done", completed_at: day(-3) }));
  assert.equal(taskFollowThrough([...backlog, ...done], NOW), 100);
});

test("finishing work lifts it and slipped due dates lower it", () => {
  const done = Array.from({ length: 6 }, () => ({ status: "done", completed_at: day(-5) }));
  const slipped = Array.from({ length: 4 }, () => ({ status: "backlog", due_date: day(-2) }));
  const good = taskFollowThrough(done, NOW) as number;
  const mixed = taskFollowThrough([...done, ...slipped], NOW) as number;
  assert.ok(good >= 95);
  assert.ok(mixed < good && mixed > 40, `mixed ${mixed}`);
});

test("work finished more than 60 days ago no longer counts", () => {
  const old = Array.from({ length: 5 }, () => ({ status: "done", completed_at: day(-90) }));
  const slipped = Array.from({ length: 3 }, () => ({ status: "backlog", due_date: day(-1) }));
  assert.equal(taskFollowThrough([...old, ...slipped], NOW), 25);
});

test("follow-through is one of the culture pillar's parts", () => {
  assert.equal(cultureOps({ task_follow_through: 80 }), 80);
  assert.equal(cultureOps({ sops_created: 10, task_follow_through: 60 }), 80);
});
