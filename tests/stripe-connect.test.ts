import { test } from "node:test";
import assert from "node:assert/strict";

process.env.STRIPE_CONNECT_SECRET_KEY = "sk_test_unit";
process.env.STRIPE_CONNECT_CLIENT_ID = "ca_unit";

test("a payment link is made only for a priced offer; plans split the total and know when to stop", async () => {
    const { linkPlan } = await import("../src/lib/stripeConnect");
    const base = { id: "o1", name: "Coaching", payment_count: null };
    assert.deepEqual(linkPlan({ ...base, price: 2500, billing: "one_time" }), { ok: true, kind: "one_time", cents: 250000, count: 1, note: "2500.00 USD, paid in full" });
    assert.equal((linkPlan({ ...base, price: 497, billing: "monthly" }) as { kind: string }).kind, "monthly");
    assert.equal(linkPlan({ ...base, price: null, billing: "one_time" }).ok, false);
    assert.equal(linkPlan({ ...base, price: 0.25, billing: "one_time" }).ok, false);
    const plan = linkPlan({ ...base, price: 3000, billing: "payment_plan", payment_count: 3 });
    assert.deepEqual(plan, { ok: true, kind: "payment_plan", cents: 100000, count: 3, note: "3 monthly payments of 1000.00 USD, then it stops" });
    assert.equal(linkPlan({ ...base, price: 3000, billing: "payment_plan", payment_count: null }).ok, false);
    assert.equal(linkPlan({ ...base, price: 3000, billing: "payment_plan", payment_count: 30 }).ok, false);
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

test("invoices: the amount, the plan split and the reasons an invoice can't go out", async () => {
    const { invoicePlan, splitPlan, offerTag, planComplete } = await import("../src/lib/suitePayments");
    assert.deepEqual(splitPlan(10000, 3), { per: 3333, total: 9999 });
    const one = invoicePlan({ email: "Eloise@Example.com", description: "Strategy day", amount: 1500 });
    assert.equal(one.ok && one.cents, 150000);
    assert.equal(one.ok && one.note, "$1,500.00, due in 7 days");
    const three = invoicePlan({ email: "eloise@example.com", description: "Coaching", amount: 100, paymentCount: 3, daysUntilDue: 5 });
    assert.equal(three.ok && three.per, 3333);
    assert.equal(three.ok && three.cents, 9999);
    assert.match(three.ok ? three.note : "", /^3 monthly payments of \$33\.33 \(\$99\.99 in all\)/);
    assert.equal(invoicePlan({ email: "nope", description: "x", amount: 10 }).ok, false);
    assert.equal(invoicePlan({ email: "e@x.co", description: " ", amount: 10 }).ok, false);
    assert.equal(invoicePlan({ email: "e@x.co", description: "x", amount: 0 }).ok, false);
    assert.equal(invoicePlan({ email: "e@x.co", description: "x", amount: 1, paymentCount: 3 }).ok, false); // under $0.50 each
    assert.equal(invoicePlan({ email: "e@x.co", description: "x", amount: 100, paymentCount: 25 }).ok, false);
    assert.equal(offerTag("LifeCharter Life Planner 2027 (digital)"), "bought-lifecharter-life-planner-2027-digital");
    assert.equal(planComplete(2, 3), false);
    assert.equal(planComplete(3, 3), true);
});

test("paid booking: a calendar asks for nothing, the full price or a deposit (never under $0.50)", async () => {
    const { bookingCharge } = await import("../src/lib/booking/engine");
    assert.equal(bookingCharge({ pay_mode: "none", price: 100, deposit: 25 }), null);
    assert.equal(bookingCharge({ pay_mode: undefined, price: 100, deposit: null }), null);
    assert.deepEqual(bookingCharge({ pay_mode: "full", price: 150, deposit: null }), { cents: 15000, kind: "full" });
    assert.deepEqual(bookingCharge({ pay_mode: "deposit", price: 500, deposit: 100 }), { cents: 10000, kind: "deposit" });
    assert.equal(bookingCharge({ pay_mode: "deposit", price: 500, deposit: null }), null);
    assert.equal(bookingCharge({ pay_mode: "full", price: 0.25, deposit: null }), null);
});

test("a Canadian-dollar offer or invoice is charged in CAD, never in USD (task 1520)", async () => {
    const { linkPlan } = await import("../src/lib/stripeConnect");
    const { invoicePlan } = await import("../src/lib/suitePayments");
    const base = { id: "o1", name: "Coaching", payment_count: null };
    assert.equal((linkPlan({ ...base, price: 2500, billing: "one_time", currency: "cad" }) as { note: string }).note, "2500.00 CAD, paid in full");
    assert.equal((linkPlan({ ...base, price: 3000, billing: "payment_plan", payment_count: 3, currency: "cad" }) as { note: string }).note, "3 monthly payments of 1000.00 CAD, then it stops");
    // No currency on an older offer stays USD, exactly as before.
    assert.equal((linkPlan({ ...base, price: 2500, billing: "one_time" }) as { note: string }).note, "2500.00 USD, paid in full");
    const cad = invoicePlan({ email: "eloise@example.com", description: "Strategy day", amount: 1500, currency: "cad" });
    assert.equal(cad.ok && cad.note, "CA$1,500.00, due in 7 days");
    const cadHome = invoicePlan({ email: "eloise@example.com", description: "Strategy day", amount: 1500, currency: "cad", home: "cad" });
    assert.equal(cadHome.ok && cadHome.note, "$1,500.00, due in 7 days");
    const usdOnCad = invoicePlan({ email: "eloise@example.com", description: "Strategy day", amount: 1500, currency: "usd", home: "cad" });
    assert.equal(usdOnCad.ok && usdOnCad.note, "US$1,500.00, due in 7 days");
});
