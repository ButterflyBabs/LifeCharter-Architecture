import { test } from "node:test";
import assert from "node:assert/strict";
import { switcherAllowed } from "../src/lib/accountSwitcher";

// The account switcher is limited to Marcello's login for now (Babs, 2026-10-10).
test("switcher is allowed for Marcello only", () => {
  assert.equal(switcherAllowed("marcello@amilynnecarroll.com"), true);
  assert.equal(switcherAllowed("Marcello@AmiLynneCarroll.com"), true);
  assert.equal(switcherAllowed("sumbal@amilynnecarroll.com"), false);
  assert.equal(switcherAllowed("amilynne@amilynnecarroll.com"), false);
  assert.equal(switcherAllowed(null), false);
  assert.equal(switcherAllowed(""), false);
});
