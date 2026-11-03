import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewTaskMarker, reviewTaskText } from "../src/lib/websiteReviews";

test("a website review task names the client and site and carries its marker", () => {
  const t = reviewTaskText("Franc Godri", "franc@redpagelead.com", "francgodri.com", "f7e84654-cc87-4106-b6ba-404a391c0c21");
  assert.equal(t.title, "Write the Website Alignment Review for Franc Godri: francgodri.com");
  assert.ok(t.description.includes("francgodri.com"));
  assert.ok(t.description.endsWith(reviewTaskMarker("f7e84654-cc87-4106-b6ba-404a391c0c21")));
});
