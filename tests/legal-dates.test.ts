import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

// A legal page edited without refreshing its "Last updated" date fails here. Fix: npm run legal:stamp
test("each legal page's Last updated date is current with its text", () => {
  const r = spawnSync(process.execPath, ["scripts/legal-stamp.mjs", "--check"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr || r.stdout);
});
