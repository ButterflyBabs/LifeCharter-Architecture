import { test } from "node:test";
import assert from "node:assert/strict";
import { canEditLines, cleanItem, csvCell, helpState, loggedMinutes, payFor, shiftMinutes, submitBlocker } from "../src/lib/workLog";
import { featureApiAccess, featureForApi, featureForPage } from "../src/lib/teamRoles";

test("shift minutes run from clock in to clock out, or to now while clocked in", () => {
  assert.equal(shiftMinutes({ clock_in: "2026-11-02T16:00:00Z", clock_out: "2026-11-02T19:30:00Z" }), 210);
  assert.equal(shiftMinutes({ clock_in: "2026-11-02T16:00:00Z", clock_out: null }, Date.parse("2026-11-02T16:45:00Z")), 45);
  assert.equal(shiftMinutes({ clock_in: "2026-11-02T16:00:00Z", clock_out: "2026-11-02T15:00:00Z" }), 0);
});

test("pay is minutes at the hourly rate, to the cent, and empty without a rate", () => {
  assert.equal(payFor(90, 20), 30);
  assert.equal(payFor(100, "18.50"), 30.83);
  assert.equal(payFor(60, null), null);
  assert.equal(payFor(60, ""), null);
  assert.equal(payFor(0, 25), 0);
});

test("logged minutes add up the lines and ignore lines with no time", () => {
  assert.equal(loggedMinutes([{ minutes: 30 }, { minutes: null }, { minutes: 45 }]), 75);
});

test("help is waiting until someone has helped", () => {
  assert.equal(helpState({ help_asked_of: null, help_received_from: null }), "none");
  assert.equal(helpState({ help_asked_of: "Sumbal", help_received_from: null }), "waiting");
  assert.equal(helpState({ help_asked_of: "Sumbal", help_received_from: "Sumbal" }), "received");
  assert.equal(helpState({ help_asked_of: "  ", help_received_from: "  " }), "none");
});

test("a line needs words for what was done and sane numbers", () => {
  assert.deepEqual(cleanItem({ what: "  " }), { error: "Say what you did." });
  assert.ok("error" in cleanItem({ what: "DMs", quantity: -1 }));
  assert.ok("error" in cleanItem({ what: "DMs", quantity: "lots" }));
  assert.ok("error" in cleanItem({ what: "DMs", minutes: 24 * 60 + 1 }));
  const ok = cleanItem({ what: " Sent DMs ", quantity: "25", unit: "DMs", minutes: 90.9, challenge: " page timed out ", helpAskedOf: "Sumbal", helpReceivedFrom: "", helpNote: "" });
  assert.ok("item" in ok);
  if ("item" in ok) {
    assert.equal(ok.item.what, "Sent DMs");
    assert.equal(ok.item.quantity, 25);
    assert.equal(ok.item.unit, "DMs");
    assert.equal(ok.item.minutes, 90);
    assert.equal(ok.item.challenge, "page timed out");
    assert.equal(ok.item.help_asked_of, "Sumbal");
    assert.equal(ok.item.help_received_from, null);
  }
});

test("optional numbers can be left empty", () => {
  const r = cleanItem({ what: "Answered email", quantity: "", minutes: "" });
  assert.ok("item" in r);
  if ("item" in r) {
    assert.equal(r.item.quantity, null);
    assert.equal(r.item.minutes, null);
  }
});

test("a day can be submitted only once clocked out with something listed", () => {
  assert.equal(submitBlocker({ clock_out: null }, [{ what: "x" }]), "Clock out before you submit.");
  assert.equal(submitBlocker({ clock_out: "2026-11-02T19:00:00Z" }, []), "List at least one thing you did before you submit.");
  assert.equal(submitBlocker({ clock_out: "2026-11-02T19:00:00Z" }, [{ what: "x" }]), null);
});

test("lines lock once submitted or approved, except for the reviewer", () => {
  assert.equal(canEditLines("open", false), true);
  assert.equal(canEditLines("returned", false), true);
  assert.equal(canEditLines("submitted", false), false);
  assert.equal(canEditLines("approved", false), false);
  assert.equal(canEditLines("approved", true), true);
});

test("csv cells quote commas, quotes and line breaks", () => {
  assert.equal(csvCell("plain"), "plain");
  assert.equal(csvCell('a, "b"'), '"a, ""b"""');
  assert.equal(csvCell(null), "");
});

test("the Work Log is its own team access area", () => {
  assert.equal(featureForPage("/work-log"), "work_log");
  assert.equal(featureForApi("/api/work-log"), "work_log");
  assert.equal(featureApiAccess({ work_log: "edit" }, "/api/work-log", "POST").allow, true);
  assert.equal(featureApiAccess({ work_log: "view" }, "/api/work-log", "POST").allow, false);
  assert.equal(featureApiAccess({ work_log: "view" }, "/api/work-log", "GET").allow, true);
  assert.equal(featureApiAccess({ work_log: "none" }, "/api/work-log", "GET").allow, false);
  assert.equal(featureApiAccess({ tasks: "edit" }, "/api/work-log", "GET").allow, false); // a member saved before this area existed does not get it
});
