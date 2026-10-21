import { test } from "node:test";
import assert from "node:assert/strict";
import { saveLabel } from "../src/components/assessments/SaveNotice";

// John Carter (2026-10-21): the page said "Saved" while his answers had only reached his own browser. The words now follow the account.
const s = (status: "idle" | "saving" | "saved" | "error") => ({ status, unsaved: 0, lastSyncedAt: null, failures: 0 });

test("the save label says where the answers are", () => {
  assert.equal(saveLabel(s("saved"), false, true), "Saved to your account");
  assert.equal(saveLabel(s("error"), false, true), "Not saved to your account yet", "a failed save is never shown as Saved");
  assert.equal(saveLabel(s("saving"), false, true), "Saving...");
  assert.equal(saveLabel(s("idle"), true, false), "Saving...");
  assert.equal(saveLabel(s("idle"), false, true), "Saved on this device", "browser copy only, nothing confirmed by the account yet");
  assert.equal(saveLabel(s("idle"), false, false), "Not saved");
});
