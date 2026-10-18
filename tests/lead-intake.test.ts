import { test } from "node:test";
import assert from "node:assert/strict";
import { LEAD_SOURCES, flattenLead, isTestLead, parseLead, slug, validLead } from "../src/lib/leadIntake";

test("a flat Make form body becomes a lead", () => {
  const p = parseLead({ email: "Pat@Example.com", full_name: "Pat Lee", ad_name: "Spring Ad" });
  assert.equal(p.email, "pat@example.com");
  assert.equal(p.first, "Pat");
  assert.equal(p.last, "Lee");
  assert.equal(p.ad, "Spring Ad");
  assert.equal(validLead(p), null);
});

test("LinkedIn style field names are understood", () => {
  const p = parseLead({ emailAddress: "li@example.com", firstName: "Lin", lastName: "Doe", form_name: "MasterClass sign-up", company: "Acme", job_title: "Founder" });
  assert.equal(p.email, "li@example.com");
  assert.equal(p.first, "Lin");
  assert.equal(p.last, "Doe");
  assert.equal(p.form, "MasterClass sign-up");
  assert.deepEqual(p.answers, { company: "Acme", job_title: "Founder" });
});

test("Meta's field_data list and nested objects are flattened", () => {
  const f = flattenLead({ field_data: [{ name: "Work Email", values: ["w@example.com"] }, { name: "city", values: ["Denver"] }], meta: { form_name: "F1" } });
  assert.equal(f.work_email, "w@example.com");
  assert.equal(f.city, "Denver");
  assert.equal(f.form_name, "F1");
});

test("a lead needs a valid email and a name", () => {
  assert.match(validLead(parseLead({ email: "nope", first_name: "A" })) ?? "", /email/);
  assert.match(validLead(parseLead({ email: "a@b.co" })) ?? "", /name/);
});

test("each source tags its leads its own way, and Meta tags did not change", () => {
  assert.equal(LEAD_SOURCES.meta.tag, "lead-meta-ad");
  assert.equal(LEAD_SOURCES.meta.perFormTag("Spring Ad!"), "meta-ad-spring-ad");
  assert.equal(LEAD_SOURCES.linkedin.tag, "lead-linkedin-form");
  assert.equal(LEAD_SOURCES.linkedin.perFormTag("MasterClass sign-up"), "linkedin-form-masterclass-sign-up");
  assert.equal(LEAD_SOURCES.linkedin.perFormTag(""), null);
  assert.equal(slug("--Hello  World--", 40), "hello-world");
});

test("MasterClass registration: Meta on Babs's account always, LinkedIn only when asked", () => {
  assert.equal(LEAD_SOURCES.meta.registersMasterclass(true, false), true);
  assert.equal(LEAD_SOURCES.meta.registersMasterclass(false, true), false);
  assert.equal(LEAD_SOURCES.linkedin.registersMasterclass(true, false), false);
  assert.equal(LEAD_SOURCES.linkedin.registersMasterclass(true, true), true);
  assert.equal(LEAD_SOURCES.linkedin.registersMasterclass(false, true), false);
});

test("Meta's dummy test leads are ignored", () => {
  assert.equal(isTestLead("test@meta.com"), true);
  assert.equal(isTestLead("dummy@x.com"), true);
  assert.equal(isTestLead("real@person.com"), false);
});
