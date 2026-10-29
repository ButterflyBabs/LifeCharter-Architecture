import { test } from "node:test";
import assert from "node:assert/strict";
import { isSameCard, normProfileUrl } from "../src/lib/dmCardDuplicate";

const card = (o: Partial<{ name: string; profile_url: string; handle: string; platform: string }> = {}) => ({
  name: "Sam Lee", profile_url: null as string | null, handle: null as string | null, platform: "FB" as string | null, ...o,
});
const inc = (o: Partial<{ name: string; profileUrl: string; handle: string; platform: string }> = {}) => ({
  name: "Sam Lee", profileUrl: null as string | null, handle: null as string | null, platform: "FB" as string | null, ...o,
});

test("the same profile link is the same person, however it is written", () => {
  assert.equal(normProfileUrl("https://www.facebook.com/sam.lee/?ref=x#top"), "facebook.com/sam.lee");
  assert.ok(isSameCard(card({ profile_url: "https://facebook.com/sam.lee" }), inc({ name: "Samuel Lee", profileUrl: "http://m.facebook.com/Sam.Lee/" })));
});

test("two people with one name but different links are different people", () => {
  assert.ok(!isSameCard(card({ profile_url: "https://facebook.com/sam.lee" }), inc({ profileUrl: "https://facebook.com/sam.lee.2" })));
});

test("no links on either side: the same name on the same platform is a repeat", () => {
  assert.ok(isSameCard(card(), inc({ name: " sam LEE " })));
  assert.ok(!isSameCard(card(), inc({ platform: "LI" })));
  assert.ok(!isSameCard(card(), inc({ name: "Ana Cruz" })));
});

test("a link on only one side falls back to the name", () => {
  assert.ok(isSameCard(card({ profile_url: "https://facebook.com/sam.lee" }), inc()));
  assert.ok(isSameCard(card(), inc({ profileUrl: "https://facebook.com/sam.lee" })));
});

test("the same handle is a repeat even under another name", () => {
  assert.ok(isSameCard(card({ handle: "@samlee" }), inc({ name: "S. Lee", handle: "samlee" })));
});
