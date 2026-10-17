import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { chunkText, parseMetaSignedRequest, signState, validHubSignature, verifyState, withinReplyWindow, REPLY_WINDOW_MS } from "../src/lib/spark/messaging";
import { buildSystemPrompt } from "../src/lib/spark/prompt";
import type { SparkSettings } from "../src/lib/spark/settings";

const settings = { assistant_name: "LC Spark", instructions: null, knowledge: "We help founders.", sites: [] } as unknown as SparkSettings;

test("a long reply is split near a space and never past the platform limit", () => {
  const long = Array.from({ length: 300 }, (_, i) => `word${i}`).join(" ");
  const parts = chunkText(long, 1000);
  assert.ok(parts.length >= 2 && parts.length <= 3);
  for (const p of parts) assert.ok(p.length <= 1000);
  assert.deepEqual(chunkText("short", 1000), ["short"]);
  assert.deepEqual(chunkText("   ", 1000), []);
});

test("Meta webhook signatures: only the right secret and body pass", () => {
  const body = JSON.stringify({ object: "page", entry: [] });
  const sig = "sha256=" + createHmac("sha256", "s3cret").update(body, "utf8").digest("hex");
  assert.equal(validHubSignature("s3cret", body, sig), true);
  assert.equal(validHubSignature("other", body, sig), false);
  assert.equal(validHubSignature("s3cret", body + " ", sig), false);
  assert.equal(validHubSignature("s3cret", body, null), false);
  assert.equal(validHubSignature(undefined, body, sig), false);
});

test("Meta signed_request (deauthorize and data deletion) is verified", () => {
  const payload = Buffer.from(JSON.stringify({ user_id: "123" })).toString("base64url");
  const sig = createHmac("sha256", "s3cret").update(payload).digest("base64url");
  assert.equal(parseMetaSignedRequest("s3cret", `${sig}.${payload}`)?.user_id, "123");
  assert.equal(parseMetaSignedRequest("wrong", `${sig}.${payload}`), null);
  assert.equal(parseMetaSignedRequest("s3cret", "nodot"), null);
});

test("the connect state names the account, expires after 20 minutes, and keeps Instagram and Facebook apart", () => {
  const now = 1_000_000;
  const st = signState("fb", "k", "plan-1", now);
  assert.equal(verifyState("fb", "k", st, now + 60_000), "plan-1");
  assert.equal(verifyState("fb", "k", st, now + 21 * 60_000), null);
  assert.equal(verifyState("sp", "k", st, now), null, "a Facebook state is not an Instagram state");
  assert.equal(verifyState("fb", "other", st, now), null);
  assert.equal(verifyState("fb", "k", st + "x", now), null);
});

test("a reply is allowed only within 24 hours of their last message", () => {
  const now = Date.parse("2026-10-17T20:00:00Z");
  assert.equal(withinReplyWindow(new Date(now - 3_600_000).toISOString(), now), true);
  assert.equal(withinReplyWindow(new Date(now - REPLY_WINDOW_MS - 1000).toISOString(), now), false);
  assert.equal(withinReplyWindow(null, now), false);
});

test("a LinkedIn draft is written as the owner, not as an AI chat, and does not ask for an email", () => {
  const li = buildSystemPrompt(settings, "linkedin", null, null, { name: null, email: null });
  assert.match(li, /LinkedIn/);
  assert.match(li, /review and send herself/);
  assert.doesNotMatch(li, /never a human/);
  assert.doesNotMatch(li, /ask for their first name and email/);
  const ig = buildSystemPrompt(settings, "instagram", null, null, { name: null, email: null });
  assert.match(ig, /never a human/);
  assert.match(ig, /ask for their first name and email/);
  assert.match(buildSystemPrompt(settings, "facebook", null, null, { name: null, email: null }), /Facebook Messenger/);
});
