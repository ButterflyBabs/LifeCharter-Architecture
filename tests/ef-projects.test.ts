import test from "node:test";
import assert from "node:assert/strict";

import { efTaskPatch, shapeEfTask } from "../src/lib/ef/server";

test("an E:F task goes out with its number id, notes as description and plain dates", () => {
  const t = shapeEfTask({ id: "uuid-1", num_id: "42", title: "Call the venue", notes: "ask about parking", status: "today", priority: "high", due_date: "2026-11-02", start_date: "2026-10-30", board_position: 3 });
  assert.deepEqual(t, { id: 42, title: "Call the venue", description: "ask about parking", status: "today", priority: "high", startDay: "2026-10-30", dueDay: "2026-11-02", assigneeMemberId: null, assigneeGuestId: null, shared: false, position: 3 });
});

test("moving a card to Today sets today_on; moving it away clears it; Done stamps completion", () => {
  const today = efTaskPatch({ status: "today" }, "America/Denver").update;
  assert.match(String(today.today_on), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(today.completed_at, null);
  const wait = efTaskPatch({ status: "waiting" }, "America/Denver").update;
  assert.equal(wait.today_on, null);
  const done = efTaskPatch({ status: "done" }, "America/Denver").update;
  assert.ok(typeof done.completed_at === "string");
});

test("bad input is refused, nothing is invented", () => {
  assert.equal(efTaskPatch({ status: "nonsense" }, "UTC").error, "Unknown status.");
  assert.equal(efTaskPatch({ title: "  " }, "UTC").error, "A task needs a title.");
  assert.equal(efTaskPatch({ dueDay: "tomorrow" }, "UTC").error, "Enter a valid date.");
  const cleared = efTaskPatch({ startDay: null, dueDay: "" }, "UTC").update;
  assert.equal(cleared.start_date, null);
  assert.equal(cleared.due_date, null);
});
