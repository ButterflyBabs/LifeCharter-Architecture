import { test } from "node:test";
import assert from "node:assert/strict";

process.env.ZOOM_OAUTH_CLIENT_SECRET = "test-secret";
process.env.ZOOM_OAUTH_WEBHOOK_SECRET = "hook-secret";

test("pickup words: blank matches everything, otherwise any word in the meeting name", async () => {
    const { topicMatches } = await import("../src/lib/volantZoom");
    assert.equal(topicMatches("Weekly Coaching Session", ""), true);
    assert.equal(topicMatches("Weekly Coaching Session", "coaching, mastermind"), true);
    assert.equal(topicMatches("Team standup", "coaching, mastermind"), false);
});

test("the Connect Zoom state belongs to one account and can't be forged", async () => {
    const { oauthState, readState } = await import("../src/lib/volantZoom");
    const s = oauthState("plan-123");
    assert.equal(readState(s), "plan-123");
    assert.equal(readState(s.replace("plan-123", "plan-999")), null);
    assert.equal(readState("nonsense"), null);
});

test("Zoom's signature and URL check use the webhook secret", async () => {
    const { createHmac } = await import("crypto");
    const { zoomSignatureOk, zoomValidationToken } = await import("../src/lib/volantZoom");
    const body = '{"event":"app_deauthorized"}';
    const sig = `v0=${createHmac("sha256", "hook-secret").update(`v0:123:${body}`).digest("hex")}`;
    assert.equal(zoomSignatureOk(body, "123", sig), true);
    assert.equal(zoomSignatureOk(body, "124", sig), false);
    assert.equal(zoomValidationToken("abc"), createHmac("sha256", "hook-secret").update("abc").digest("hex"));
});
