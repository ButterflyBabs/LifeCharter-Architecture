import { test } from "node:test";
import assert from "node:assert/strict";
import { noSignInEmailReminder } from "../src/lib/email/noSignInEmail";

test("the reminder says who, why, and what to do", () => {
  const w = { name: "Eloise Practice", email: "eloise@example.com" };
  const d = noSignInEmailReminder(w, "draft", "https://lccommandsuite.com");
  assert.match(d.title, /Eloise Practice/);
  assert.match(d.notes, /still a draft/);
  assert.match(d.notes, /sequences-manager\?tab=clients/);
  assert.match(d.notes, /forgot-password/);
  assert.match(d.notes, /eloise@example\.com/);
  assert.match(noSignInEmailReminder(w, "failed", "https://x.test").notes, /did not send/);
  assert.match(noSignInEmailReminder(w, "no-link", "https://x.test").notes, /could not be made/);
});
