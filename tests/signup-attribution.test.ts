import { test } from "node:test";
import assert from "node:assert/strict";
import { attributionFor } from "../src/lib/signupAttribution";

test("a Meta ad click id marks the registration as a paid ad", () => {
  const a = attributionFor({ utm: { utm_source: "facebook", utm_medium: "paid_social", utm_campaign: "Oct MasterClass", fbclid: "abc" } });
  assert.equal(a.paid, true);
  assert.ok(a.tags.includes("mc-source-paid-ad"));
  assert.ok(a.tags.includes("mc-campaign-oct-masterclass"));
});

test("an organic post link is a channel, not an ad", () => {
  const a = attributionFor({ utm: { utm_source: "instagram", utm_medium: "post", utm_campaign: "masterclass" } });
  assert.equal(a.paid, false);
  assert.deepEqual(a.tags.sort(), ["mc-campaign-masterclass", "mc-medium-post", "mc-source-instagram"]);
});

test("affiliate, personal link and direct visits are told apart", () => {
  assert.deepEqual(attributionFor({ utm: {}, ref: "AMY7" }).tags, ["mc-source-affiliate"]);
  assert.deepEqual(attributionFor({ card: "k3j2" }).tags, ["mc-source-personal-link"]);
  assert.deepEqual(attributionFor({}).tags, ["mc-source-direct"]);
});

test("a link for one video adds a content tag so that video's registrations can be counted on their own", () => {
  const a = attributionFor({ utm: { utm_source: "youtube", utm_medium: "organic-video", utm_campaign: "masterclass", utm_content: "three-big-questions" } });
  assert.equal(a.paid, false);
  assert.deepEqual(a.tags.sort(), ["mc-campaign-masterclass", "mc-content-three-big-questions", "mc-medium-organic-video", "mc-source-youtube"]);
  assert.equal(a.detail.utm_content, "three-big-questions");
});
