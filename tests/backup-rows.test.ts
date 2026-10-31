// The account backup never carries a key or a private link. Run with: npm test
import test from "node:test";
import assert from "node:assert/strict";

import { withoutSecrets } from "../src/lib/backupRows";

test("private links, keys and passwords are dropped from every row", () => {
  const [row] = withoutSecrets([{ id: 1, name: "Jo", access_token: "a", portal_token: "b", api_key: "c", password_hash: "d", resend_secret: "e" }]);
  assert.deepEqual(row, { id: 1, name: "Jo" });
});
