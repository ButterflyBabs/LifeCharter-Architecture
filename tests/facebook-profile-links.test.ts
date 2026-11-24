import test from "node:test";
import assert from "node:assert/strict";
import { normProfileUrl, usableProfileUrl, sameLinkSamePerson } from "../src/lib/dmCardDuplicate";

test("a bare facebook profile.php link is dropped: it opens the signed-in person's own profile", () => {
  assert.equal(usableProfileUrl("https://www.facebook.com/profile.php"), null);
  assert.equal(usableProfileUrl("https://www.facebook.com/profile.php?"), null);
  assert.equal(usableProfileUrl("https://m.facebook.com/profile.php?ref=bookmarks"), null);
  assert.equal(normProfileUrl("https://www.facebook.com/profile.php"), "");
});

test("a profile.php link with an id is kept, and the id tells two people apart", () => {
  assert.equal(usableProfileUrl("https://www.facebook.com/profile.php?id=100012345678901"), "https://www.facebook.com/profile.php?id=100012345678901");
  assert.equal(normProfileUrl("https://www.facebook.com/profile.php?id=100012345678901&ref=x"), "facebook.com/profile.php?id=100012345678901");
  assert.equal(sameLinkSamePerson("https://www.facebook.com/profile.php?id=111", "Ann", "https://www.facebook.com/profile.php?id=222", "Bea"), false);
  assert.equal(sameLinkSamePerson("https://www.facebook.com/profile.php?id=111", "Ann", "https://m.facebook.com/profile.php?id=111&x=1", "Ann"), true);
});

test("other links are unchanged", () => {
  assert.equal(usableProfileUrl("https://www.facebook.com/survivormichellela/"), "https://www.facebook.com/survivormichellela/");
  assert.equal(normProfileUrl("https://www.linkedin.com/in/pat-lee/?utm=x"), "linkedin.com/in/pat-lee");
  assert.equal(usableProfileUrl(""), null);
});
