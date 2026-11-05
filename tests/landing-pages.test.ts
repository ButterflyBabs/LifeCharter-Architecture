import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanContent, cleanPageLook, cleanPixel, cleanUrl, rate, slugify, starterContent, validSlug } from "../src/lib/landingPages";

test("web addresses are clean, sensible and never a reserved word", () => {
  assert.equal(slugify("  Free Guide: Get Your Week Back! "), "free-guide-get-your-week-back");
  assert.equal(slugify("Café résumé"), "cafe-resume");
  assert.equal(validSlug("free-guide"), true);
  assert.equal(validSlug("ab"), false);
  assert.equal(validSlug("-bad"), false);
  assert.equal(validSlug("api"), false);
  assert.equal(validSlug("book"), false);
});

test("content keeps only safe, bounded fields and fills from the template", () => {
  const c = cleanContent({ headline: "  Hello  ", bullets: ["a", "", 3, "b"], testimonials: [{ name: "Ann", quote: "Great" }, { name: "No quote" }], faq: [{ q: "Q?", a: "A." }, { q: "Only q" }], extra: "x" }, "optin");
  assert.equal(c.headline, "Hello");
  assert.deepEqual(c.bullets, ["a", "b"]);
  assert.deepEqual(c.testimonials, [{ name: "Ann", quote: "Great" }]);
  assert.deepEqual(c.faq, [{ q: "Q?", a: "A." }]);
  assert.equal((c as unknown as Record<string, unknown>).extra, undefined);
  const empty = cleanContent({}, "sales");
  assert.equal(empty.headline, starterContent("sales").headline);
  assert.equal(empty.cta, "Join now");
  // A field the owner cleared on purpose stays cleared.
  assert.equal(cleanContent({ eyebrow: "" }, "optin").eyebrow, "");
});

test("looks fall back to safe values", () => {
  const l = cleanPageLook({ accent: "red", background: "#ffffff", font: "nope", showLogo: false });
  assert.equal(l.accent, "#2E7C83");
  assert.equal(l.background, "#ffffff");
  assert.equal(l.font, "classic");
  assert.equal(l.showLogo, false);
});

test("pixel IDs, links and the rate", () => {
  assert.equal(cleanPixel(" 1234567890123456 "), "1234567890123456");
  assert.equal(cleanPixel("12345"), null);
  assert.equal(cleanPixel("abc1234567890"), null);
  assert.equal(cleanUrl("buy.stripe.com/abc"), "https://buy.stripe.com/abc");
  assert.equal(cleanUrl("javascript:alert(1)"), null);
  assert.equal(rate(0, 0), 0);
  assert.equal(rate(200, 17), 8.5);
});

test("a link page keeps only buttons that have words and a real link", () => {
  const c = cleanContent(
    {
      headline: "AmiLynne",
      links: [
        { label: " Take the workshop ", url: "lccommandsuite.com/l/tcs-bio", note: "Free, Nov 16-18" },
        { label: "No link", url: "" },
        { label: "", url: "https://example.com" },
        { label: "Bad scheme", url: "javascript:alert(1)" },
        { label: "Book", url: "https://example.com/book" },
      ],
    },
    "links"
  );
  assert.equal(c.links.length, 2);
  assert.deepEqual(c.links[0], { label: "Take the workshop", url: "https://lccommandsuite.com/l/tcs-bio", note: "Free, Nov 16-18" });
  assert.equal(c.links[1].url, "https://example.com/book");
  // Other templates carry no buttons unless some were saved.
  assert.deepEqual(cleanContent({}, "optin").links, []);
  // No more than 30 buttons.
  const many = cleanContent({ links: Array.from({ length: 40 }, (_, i) => ({ label: `L${i}`, url: "https://example.com" })) }, "links");
  assert.equal(many.links.length, 30);
});
