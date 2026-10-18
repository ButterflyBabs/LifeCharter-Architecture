import { test } from "node:test";
import assert from "node:assert/strict";
import { CC, CC_FORMS, CC_SERIES } from "../src/lib/clientCareAccounts";

test("client care templates: every form asks name and email, every series is in the account's own voice", () => {
  for (const f of Object.values(CC_FORMS)) {
    assert.deepEqual(f.fields.slice(0, 2).map((x) => x.name), ["first_name", "email"]);
    assert.ok(f.fields.every((x) => x.name && x.label));
  }
  for (const s of Object.values(CC_SERIES)) {
    for (const st of s.steps) {
      assert.match(st.subject, /\{\{first_name\}\}/);
      assert.doesNotMatch(st.body, /Command Suite|Babs|AmiLynne|Head up/); // signed by the account's own sign-off
    }
  }
  assert.deepEqual(CC_SERIES.quiet.steps.map((s) => s.day), [0, 7, 14]);
  assert.equal(new Set(Object.values(CC).map((x) => x.seq)).size, 4);
});
