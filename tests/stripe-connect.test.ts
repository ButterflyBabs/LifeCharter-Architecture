import { test } from "node:test";
import assert from "node:assert/strict";

process.env.STRIPE_CONNECT_SECRET_KEY = "sk_test_unit";
process.env.STRIPE_CONNECT_CLIENT_ID = "ca_unit";

test("a payment link is made only for a priced, pay-in-full or monthly offer", async () => {
    const { linkPlan } = await import("../src/lib/stripeConnect");
    const base = { id: "o1", name: "Coaching", payment_count: null };
    assert.deepEqual(linkPlan({ ...base, price: 2500, billing: "one_time" }), { ok: true, kind: "one_time", cents: 250000, note: "2500.00 USD, paid in full" });
    assert.equal((linkPlan({ ...base, price: 497, billing: "monthly" }) as { kind: string }).kind, "monthly");
    assert.equal(linkPlan({ ...base, price: null, billing: "one_time" }).ok, false);
    assert.equal(linkPlan({ ...base, price: 0.25, billing: "one_time" }).ok, false);
    const plan = linkPlan({ ...base, price: 3000, billing: "payment_plan", payment_count: 3 });
    assert.equal(plan.ok, false); // plans wait for step b, so they always stop after the last payment
});

test("the Connect state belongs to one account and can't be forged; the sign-in asks for read_write on their own account", async () => {
    const { connectState, readConnectState, connectUrl, platformTestMode } = await import("../src/lib/stripeConnect");
    const s = connectState("plan-1");
    assert.equal(readConnectState(s), "plan-1");
    assert.equal(readConnectState(s.replace("plan-1", "plan-2")), null);
    const u = new URL(connectUrl("plan-1", "eloise@example.com"));
    assert.equal(u.host, "connect.stripe.com");
    assert.equal(u.searchParams.get("scope"), "read_write");
    assert.equal(u.searchParams.get("client_id"), "ca_unit");
    assert.equal(platformTestMode(), true);
});
