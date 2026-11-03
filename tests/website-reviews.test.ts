import { reviewReadyEmail } from "../src/lib/websiteReviewEmail";
import { SEO_SECTION_HEADING, SEO_SECTION_OUTLINE, assistantSectionOutline, hasAssistantSection, hasSeoSection } from "../src/lib/websiteReviews";
import test from "node:test";
import assert from "node:assert/strict";

import { WEBSITE_REVIEW_CAP_BY_TIER, isWebsiteAddress, siteKey, upgradeNote } from "../src/lib/websiteReviews";

test("website review limits by plan: Starter 1, Growth 2, VIP 5", () => {
  assert.deepEqual(WEBSITE_REVIEW_CAP_BY_TIER, { starter: 1, growth: 2, vip: 5 });
});

test("the same site is the same however it is typed", () => {
  assert.equal(siteKey("https://www.Example.com/"), "example.com");
  assert.equal(siteKey("example.com"), siteKey("HTTP://example.com//"));
  assert.notEqual(siteKey("example.com"), siteKey("example.org"));
});

test("website addresses: real ones pass, junk does not", () => {
  assert.ok(isWebsiteAddress("yourbusiness.com"));
  assert.ok(isWebsiteAddress("https://yourbusiness.com/about"));
  assert.ok(!isWebsiteAddress("not a website"));
  assert.ok(!isWebsiteAddress("nodot"));
});

test("the upgrade note points at the next plan up, and says nothing at the top", () => {
  assert.match(upgradeNote(1), /Growth includes 2.*VIP includes 5/);
  assert.match(upgradeNote(2), /VIP includes 5/);
  assert.equal(upgradeNote(5), "");
});

test("every Review is checked for the Keywords and SEO section, and the outline carries its heading", () => {
  assert.equal(hasSeoSection("## What's working\n\n- ok"), false);
  assert.equal(hasSeoSection(`## What's working\n\n${SEO_SECTION_OUTLINE}`), true);
  assert.ok(SEO_SECTION_OUTLINE.startsWith(SEO_SECTION_HEADING));
});

test("every Review also carries a section on the client's own AI Assistant, under the name they gave it", () => {
  assert.equal(hasAssistantSection("## What's working"), false);
  const out = assistantSectionOutline("CuJo");
  assert.equal(hasAssistantSection(out), true);
  assert.ok(out.includes("Putting this into action with CuJo, your AI Assistant"));
  assert.ok(assistantSectionOutline("").includes("your assistant"));
});

test("the review-ready email names the client and site, links to the Website Review page and escapes markup", () => {
  const m = reviewReadyEmail({ name: "Franc <b>Godri", website: "francgodri.com", origin: "https://lccommandsuite.com" });
  assert.equal(m.subject, "Your Website Alignment Review for francgodri.com is ready");
  assert.ok(m.html.includes("https://lccommandsuite.com/website-review"));
  assert.ok(m.html.includes("Hi Franc,"));
  assert.ok(!m.html.includes("<b>Godri"));
  assert.ok(m.text.includes("Keywords and SEO"));
  assert.ok(m.html.includes("https://lccommandsuite.com/book/sip-and-soul"));
  assert.ok(m.html.includes("Connect with Babs"));
  assert.ok(m.text.includes("https://lccommandsuite.com/book/sip-and-soul"));
  assert.equal(reviewReadyEmail({ name: "", website: "", origin: "https://x.test" }).subject, "Your Website Alignment Review is ready");
});

