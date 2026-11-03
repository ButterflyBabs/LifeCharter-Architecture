import { test } from "node:test";
import assert from "node:assert/strict";
import { BRAND_GOLD, BRAND_INDIGO, BRAND_IVORY, COLOR_PRESETS, DEFAULT_LOOK, PORTAL_FONTS, cleanLook } from "../src/lib/portalLook";

test("a new portal starts from the Command Suite brand board: indigo, ivory, the brand type", () => {
  assert.equal(DEFAULT_LOOK.accent, BRAND_INDIGO);
  assert.equal(DEFAULT_LOOK.background, BRAND_IVORY);
  assert.equal(DEFAULT_LOOK.font, "brand");
  assert.equal(BRAND_GOLD, "#D4AF63");
  assert.equal(COLOR_PRESETS[0].name, "Command Suite");
  assert.ok(PORTAL_FONTS.some((f) => f.key === "brand" && f.heading.startsWith("'Cormorant Garamond'")));
  assert.equal(cleanLook({}).font, "brand");
  assert.equal(cleanLook({ font: "brand", accent: "#123456" }).accent, "#123456");
});

test("the owner's own clients see the product brand in the portal header, not the legal company", async () => {
  const { HOUSE_PORTAL_NAME, HOUSE_PORTAL_LOGO } = await import("../src/lib/portal");
  assert.equal(HOUSE_PORTAL_NAME, "LifeCharter Command Suite");
  assert.equal(HOUSE_PORTAL_LOGO, "/brand/command-suite-logo.png");
});

