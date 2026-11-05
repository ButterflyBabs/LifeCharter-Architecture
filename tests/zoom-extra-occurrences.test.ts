import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_MASTERCLASS_MEETING_ID, withExtraOccurrences } from "../src/lib/zoom";

const o = (start: string) => ({ start, duration: 60 });

test("MasterClass gets Nov 25 added in order, once", () => {
  const zoom = [o("2026-11-18T19:00:00.000Z"), o("2026-12-02T19:00:00.000Z")];
  const out = withExtraOccurrences(DEFAULT_MASTERCLASS_MEETING_ID, zoom);
  assert.deepEqual(out.map((x) => x.start), ["2026-11-18T19:00:00.000Z", "2026-11-25T19:00:00.000Z", "2026-12-02T19:00:00.000Z"]);
  assert.equal(withExtraOccurrences(DEFAULT_MASTERCLASS_MEETING_ID, out).length, 3);
});

test("other meetings are unchanged", () => {
  const zoom = [o("2026-11-18T19:00:00.000Z")];
  assert.equal(withExtraOccurrences("123", zoom), zoom);
});
