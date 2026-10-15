import { test } from "node:test";
import assert from "node:assert/strict";
import { HUDDLE_MAX_MINUTES, carryOver, cleanActions, cleanAgenda, cleanSummary, huddleToText, templateAgenda, totalMinutes } from "../src/lib/teamHuddle";

test("the standard agenda is exactly the 30-minute limit and has a Parking lot that is not timed", () => {
    const a = templateAgenda();
    assert.equal(totalMinutes(a), HUDDLE_MAX_MINUTES);
    assert.equal(a[a.length - 1].minutes, 0);
    assert.match(a.map((s) => s.title).join(" "), /Wins/);
    assert.match(a.map((s) => s.title).join(" "), /Hot topics/);
    assert.match(a.map((s) => s.title).join(" "), /Urgent/);
});

test("only open to-dos carry over, with fresh ids", () => {
    const prev = cleanActions([
      { id: "a1", text: "Send contract", owner: "Babs", due: "2026-10-20", done: false },
      { id: "a2", text: "Old thing", owner: "Marcello", due: "", done: true },
    ]);
    const next = carryOver(prev);
    assert.equal(next.length, 1);
    assert.equal(next[0].text, "Send contract");
    assert.notEqual(next[0].id, "a1");
});

test("cleans what comes from the browser: bounded minutes, valid dates, no junk", () => {
    const a = cleanAgenda([{ title: "x".repeat(500), minutes: 900, items: [{ text: "hi", owner: "Babs" }, null] }, "nope"]);
    assert.equal(a[0].title.length, 120);
    assert.equal(a[0].minutes, 60);
    assert.equal(a[0].items.length, 2);
    const acts = cleanActions([{ text: "t", due: "next week", done: "yes" }]);
    assert.equal(acts[0].due, "");
    assert.equal(acts[0].done, false);
    assert.deepEqual(cleanAgenda("bad"), []);
});

test("a summary from the model is trimmed to a safe shape", () => {
    const s = cleanSummary({ summary: " Good call. ", wins: ["a", 5, ""], action_items: [{ text: "Call Franc", owner: "Babs", due: "2026-10-16" }, { text: "" }, { text: "x", due: "Friday" }], follow_ups: "none" }, "2026-10-15T12:00:00Z");
    assert.equal(s.summary, "Good call.");
    assert.deepEqual(s.wins, ["a"]);
    assert.deepEqual(s.action_items, [{ text: "Call Franc", owner: "Babs", due: "2026-10-16" }, { text: "x", owner: "", due: "" }]);
    assert.deepEqual(s.follow_ups, []);
});

test("the email text lists the agenda, the open to-dos and the close", () => {
    const t = huddleToText({
      title: "Weekly LifeCharter Team Huddle", call_date: "2026-10-15", start_time: "08:00",
      agenda: [{ id: "s", title: "Wins on the wall", minutes: 5, items: [{ id: "i", text: "Stripe tests passed", owner: "Sumbal" }] }],
      actions: [{ id: "a", text: "Ship it", owner: "Babs", due: "2026-10-16", done: false }, { id: "b", text: "Done thing", owner: "", due: "", done: true }],
      notes: "",
    });
    assert.ok(t.includes("Wins on the wall (5 min)"));
    assert.ok(t.includes("Stripe tests passed [Sumbal]"));
    assert.ok(t.includes("Ship it [Babs] (due 2026-10-16)"));
    assert.ok(!t.includes("Done thing"));
    assert.ok(t.includes("Head up. Wings out."));
});
