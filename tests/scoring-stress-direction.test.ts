// Quick Pulse's Operational Stress runs from 1 Overwhelmed to 5 Effortless, so a high answer must count as healthy. Run with: npm test
import test from "node:test";
import assert from "node:assert/strict";

import { DIMENSION_MODEL } from "../src/lib/scoring/dimensionModel";

test("no dimension turns Operational Stress upside down", () => {
  for (const d of Object.values(DIMENSION_MODEL)) {
    for (const s of d.sources) if (s.pulseLabels?.includes("Operational Stress")) assert.notEqual(s.invert, true);
  }
});
