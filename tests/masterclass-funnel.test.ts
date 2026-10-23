import { test } from "node:test";
import assert from "node:assert/strict";
import { computeFunnel, totalsOf, fivePmMT, type FunnelInput } from "../src/lib/masterclass/results";

const base = (over: Partial<FunnelInput>): FunnelInput => ({
  now: new Date("2026-10-11T18:00:00Z"),
  registrants: [],
  attendance: [],
  clicks: [],
  consultRequests: [],
  bookings: [],
  clients: [],
  websiteBuilds: [],
  adSpend: [],
  ...over,
});

test("Oct 8 is held, Oct 22 is next, Oct 28 (the first Wednesday at noon) is upcoming", () => {
  const s = computeFunnel(base({}));
  assert.deepEqual(s.map((x) => [x.date, x.state]), [["2026-10-08", "held"], ["2026-10-22", "next"], ["2026-10-28", "upcoming"]]);
});

test("registrations since the previous session go to the next session; test addresses are ignored", () => {
  const s = computeFunnel(base({
    registrants: [
      { email: "a@x.com", at: "2026-10-07T12:00:00Z" },
      { email: "b@x.com", at: "2026-10-09T15:00:00Z" },
      { email: "c@x.com", at: "2026-10-10T17:00:00Z" },
      { email: "msamilynne+eloise-oct22@gmail.com", at: "2026-10-11T01:00:00Z" },
    ],
  }));
  assert.equal(s[0].newRegistrations, 1);
  assert.equal(s[1].newRegistrations, 2);
  assert.equal(s[1].daysToGo, 11);
});

test("ad spend only counts from Oct 10 and lands in the session it promoted", () => {
  const s = computeFunnel(base({
    adSpend: [{ occurred_on: "2026-10-05", amount: 99 }, { occurred_on: "2026-10-12", amount: 50 }, { occurred_on: "2026-10-20", amount: 25 }],
    registrants: [{ email: "b@x.com", at: "2026-10-09T15:00:00Z" }, { email: "c@x.com", at: "2026-10-10T17:00:00Z" }],
  }));
  assert.equal(s[0].adSpend, 0);
  assert.equal(s[1].adSpend, 75);
  assert.equal(s[1].costPerRegistration, 37.5);
  assert.equal(s[1].costPerClose, null);
});

test("bookings and clients after a session are credited to it; cost per close appears with a close", () => {
  const after = new Date(fivePmMT("2026-10-22").getTime() + 3 * 86400_000).toISOString();
  const s = computeFunnel(base({
    now: new Date("2026-10-30T18:00:00Z"),
    adSpend: [{ occurred_on: "2026-10-15", amount: 100 }],
    bookings: [{ email: "z@x.com", created_at: after }],
    clients: [{ tier: "starter", at: after }],
  }));
  const oct22 = s.find((x) => x.date === "2026-10-22")!;
  assert.equal(oct22.consultBooked, 1);
  assert.equal(oct22.closes, 1);
  assert.equal(oct22.costPerClose, 100);
  assert.equal(totalsOf(s).closes, 1);
});

import { registrationsByEvent } from "../src/lib/masterclass/results";

test("registrations by event: grouped by session, newest first, returning people flagged, tests left out", () => {
  const input = base({
    registrants: [
      { email: "john@x.com", at: "2026-10-07T19:17:00Z" },
      { email: "john@x.com", at: "2026-10-09T15:47:00Z" },
      { email: "angelina@x.com", at: "2026-10-10T17:33:00Z" },
      { email: "msamilynne+eloise-oct22@gmail.com", at: "2026-10-11T01:55:00Z" },
    ],
    attendance: [{ session_date: "2026-10-08", email: "john@x.com" }],
  });
  const sessions = computeFunnel(input);
  const ev = registrationsByEvent(input, sessions, new Map([["john@x.com", { name: "John", tags: ["from-linkedin"] }]]));
  assert.deepEqual(ev.map((e) => e.date), ["2026-10-28", "2026-10-22", "2026-10-08"]);
  const oct22 = ev.find((e) => e.date === "2026-10-22")!;
  assert.equal(oct22.rows.length, 2);
  assert.equal(oct22.rows.find((r) => r.email === "john@x.com")!.returning, true);
  assert.equal(oct22.rows.find((r) => r.email === "john@x.com")!.source, "LinkedIn");
  assert.equal(ev.find((e) => e.date === "2026-10-08")!.rows[0].status, "attended");
});

import { registrantDetails } from "../src/lib/zoom";

test("registration form answers are kept by label and blanks are dropped", () => {
  const d = registrantDetails({
    id: "1",
    email: "a@x.com",
    phone: " 555 111 2222 ",
    org: "Acme",
    city: "",
    country: "US",
    custom_questions: [{ title: "What do you most want help with?", value: "Hiring" }, { title: "Empty", value: " " }],
  });
  assert.deepEqual(d, { Phone: "555 111 2222", Organization: "Acme", Country: "US", "What do you most want help with?": "Hiring" });
});

test("the weekly run starts at noon Mountain, skips Nov 25, Dec 23 and Dec 30, and the old dates stay at 5pm", async () => {
  const { startMT } = await import("../src/lib/masterclass/results");
  assert.equal(startMT("2026-10-22").toISOString(), "2026-10-22T23:00:00.000Z"); // Thursday 5pm MDT
  assert.equal(startMT("2026-10-28").toISOString(), "2026-10-28T18:00:00.000Z"); // Wednesday noon MDT
  assert.equal(startMT("2026-11-04").toISOString(), "2026-11-04T19:00:00.000Z"); // Wednesday noon MST
  const s = computeFunnel(base({ now: new Date("2026-11-18T22:00:00Z") }));
  const dates = s.map((x) => x.date);
  assert.ok(dates.includes("2026-11-18"));
  assert.ok(!dates.includes("2026-11-25"));
});
