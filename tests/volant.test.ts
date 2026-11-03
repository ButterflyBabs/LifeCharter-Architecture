import { test } from "node:test";
import assert from "node:assert/strict";
import { VOLANT_TEMPLATES, buildPrompt, cleanCaptionFile, cleanItemEdit, cleanReport, newItem, docxXmlToText, reportToText, templateByKey, templateName, buildClientEmail, defaultClientMessage, groupItems, inferFor, buildCoachCopy, buildClientEmailHtml, buildCoachCopyHtml, VOLANT_MAX_PROMPT, VOLANT_MAX_TRANSCRIPT } from "../src/lib/volant";

test("all 21 approved templates are there, each with one action list and unique keys", () => {
    assert.equal(VOLANT_TEMPLATES.length, 21);
    assert.equal(new Set(VOLANT_TEMPLATES.map((t) => t.key)).size, 21);
    for (const t of VOLANT_TEMPLATES) assert.equal(t.sections.filter((s) => s.kind === "actions").length, 1, t.key);
    assert.ok(templateByKey("coaching-sessions")!.sections.some((s) => s.kind === "private"));
    assert.ok(templateByKey("hiring-interviews")!.rules);
});

test("the report keeps the template's own order and titles, and never trusts the model's shape", () => {
    const t = templateByKey("team-meetings")!;
    const raw = {
        sections: [{ title: "WINS", content: "Booked 3 calls" }, { title: "Made up", content: "x" }, { title: "Summary", content: "We met." }],
        action_items: [{ text: "Send the deck", owner: "Sam", due: "2026-10-20" }, { text: "", owner: "x" }, { text: "Call Jo", due: "next week" }],
    };
    const r = cleanReport(raw, t, false);
    assert.deepEqual(r.sections.map((s) => s.title), t.sections.filter((s) => s.kind !== "actions").map((s) => s.title));
    assert.equal(r.sections.find((s) => s.title === "Wins")!.content, "Booked 3 calls");
    assert.equal(r.sections.find((s) => s.title === "Summary")!.content, "We met.");
    assert.equal(r.action_items.length, 2);
    assert.equal(r.action_items[1].due, "");
    assert.ok(r.action_items.every((i) => i.id && i.task_id === null));
    assert.equal(cleanReport("nonsense", t, true).clipped, true);
});

test("the prompt lists every non-action section and the hiring rule, and keeps a 70,000-character transcript whole", () => {
    const t = templateByKey("hiring-interviews")!;
    const { system, clipped } = buildPrompt(t, { title: "x", date: "2026-10-17", contactName: "", transcript: "a".repeat(70000) });
    assert.equal(clipped, false);
    for (const s of t.sections.filter((x) => x.kind !== "actions")) assert.ok(system.includes(s.title), s.title);
    assert.match(system, /must not affect a hiring decision/);
    assert.doesNotMatch(system, /Each one gets its own Approve/);
});

test("caption files lose their timestamps; Word XML becomes lines", () => {
    const vtt = "WEBVTT\n\n1\n00:00:01.000 --> 00:00:03.000\nEloise: Hello\n\n2\n00:00:04.000 --> 00:00:05.000\nSam: Hi";
    assert.equal(cleanCaptionFile("call.vtt", vtt), "Eloise: Hello\nSam: Hi");
    assert.equal(cleanCaptionFile("notes.txt", "1\nkeep"), "1\nkeep");
    assert.equal(docxXmlToText('<w:p><w:r><w:t>Hi &amp; welcome</w:t></w:r></w:p><w:p><w:r><w:t>Line two</w:t></w:r></w:p>'), "Hi & welcome\nLine two");
});

test("renamed templates, item edits and the copied text", () => {
    const t = templateByKey("brain-dumps")!;
    assert.equal(templateName(t, { "brain-dumps": "  Mind Sweep " }), "Mind Sweep");
    assert.equal(templateName(t, {}), "Brain Dumps");
    assert.deepEqual(cleanItemEdit({ text: " Do it ", owner: "Me", due: "soon" }), { text: "Do it", owner: "Me", due: "", for: "coach" });
    const c = templateByKey("coaching-sessions")!;
    const r = cleanReport({ sections: c.sections.filter((s) => s.kind !== "actions").map((s) => ({ title: s.title, content: `about ${s.title}` })) }, c, false);
    const text = reportToText("Session", "Oct 17", r, "Commitments");
    assert.doesNotMatch(text, /Coach's private notes/);
    assert.match(text, /Insights and breakthroughs/);
});

test("an action item typed in by hand is cleaned and marked as added", () => {
    assert.equal(newItem({ text: "   " }), null);
    const it = newItem({ text: " Book the venue ", owner: "Babs", due: "2026-11-01" })!;
    assert.equal(it.text, "Book the venue");
    assert.equal(it.added, true);
    assert.equal(it.task_id, null);
    assert.equal(it.reminder, null);
    assert.equal(it.event, null);
});

test("action items are sorted for the coach or the client, and only the client's go in the client email", () => {
  const t = templateByKey("coaching-sessions")!;
  const raw = {
    sections: t.sections.filter((s) => s.kind !== "actions").map((s) => ({ title: s.title, content: s.kind === "private" ? "SECRET coach note" : s.kind === "draft" ? "Hi Jo, great session.\n\nAmi" : `about ${s.title}` })),
    action_items: [
      { text: "Send the worksheet", owner: "Ami", for: "coach", due: "" },
      { text: "Write the pitch", owner: "Jo", for: "client", due: "2026-11-10" },
      { text: "Think about pricing", owner: "Jo", due: "" },
      { text: "Book a venue", owner: "", due: "" },
    ],
  };
  const r = cleanReport(raw, t, false, "2026-11-03T00:00:00Z", "Jo Lee");
  assert.deepEqual(r.action_items.map((i) => i.for), ["coach", "client", "client", ""]);
  assert.equal(inferFor("jo", "Jo Lee"), "client");
  assert.equal(inferFor("", "Jo Lee"), "");
  const g = groupItems(r.action_items);
  assert.deepEqual([g.coach.length, g.client.length, g.unsorted.length], [1, 2, 1]);

  const msg = defaultClientMessage(r, t, { clientFirst: "Jo", coachFirst: "Ami", date: "Nov 3, 2026" });
  assert.ok(msg.startsWith("Hi Jo, great session."));
  const mail = buildClientEmail(r, { message: msg, summary: true, clientItems: true, coachItems: false }, { title: "Coaching with Jo", date: "Nov 3, 2026", contactName: "Jo Lee" });
  assert.ok(mail.text.includes("Write the pitch (by 2026-11-10)"));
  assert.ok(mail.text.includes("Think about pricing"));
  assert.ok(!mail.text.includes("Send the worksheet"), "the coach's own tasks stay off by default");
  assert.ok(!mail.text.includes("Book a venue"), "unsorted items stay off");
  assert.ok(!mail.text.includes("SECRET"), "private notes are never sent");
  const withCoach = buildClientEmail(r, { message: "Hi", summary: false, clientItems: true, coachItems: true }, { title: "T", date: "d", contactName: "" });
  assert.ok(withCoach.text.includes("What I will do") && withCoach.text.includes("Send the worksheet"));
  assert.ok(!withCoach.text.includes("about Session snapshot"));
});

test("the coach's own copy has everything, including private notes, and a link back", () => {
  const t = templateByKey("coaching-sessions")!;
  const r = cleanReport({ sections: t.sections.filter((s) => s.kind !== "actions").map((s) => ({ title: s.title, content: s.kind === "private" ? "SECRET coach note" : `about ${s.title}` })), action_items: [{ text: "Send the worksheet", owner: "Ami", for: "coach" }, { text: "Write the pitch", owner: "Jo", for: "client" }] }, t, false, "2026-11-03T00:00:00Z", "Jo Lee");
  const c = buildCoachCopy(r, { title: "Coaching with Jo", date: "Nov 3, 2026", contactName: "Jo Lee", link: "https://lccommandsuite.com/volant?report=abc", sentTo: "jo@example.com" });
  assert.equal(c.subject, "Your copy: Coaching with Jo");
  assert.ok(c.text.includes("SECRET coach note") && c.text.includes("(private, only you)"));
  assert.ok(c.text.includes("For you:") && c.text.includes("For Jo Lee:") && c.text.includes("Send the worksheet") && c.text.includes("Write the pitch"));
  assert.ok(c.text.includes("https://lccommandsuite.com/volant?report=abc") && c.text.includes("jo@example.com"));
});

test("the client email links to their private page when their steps were put there, and not otherwise", () => {
  const t = templateByKey("coaching-sessions")!;
  const r = cleanReport({ sections: [], action_items: [{ text: "Write the pitch", owner: "Jo", for: "client" }] }, t, false, "2026-11-03T00:00:00Z", "Jo Lee");
  const ctx = { title: "T", date: "d", contactName: "Jo Lee" };
  const withLink = buildClientEmail(r, { message: "Hi", summary: true, clientItems: true, coachItems: false, portalUrl: "https://x.test/portal/abc" }, ctx);
  assert.ok(withLink.text.includes("https://x.test/portal/abc") && withLink.text.includes("tick them off"));
  assert.ok(!buildClientEmail(r, { message: "Hi", summary: true, clientItems: true, coachItems: false }, ctx).text.includes("portal"));
  assert.ok(!buildClientEmail(r, { message: "Hi", summary: true, clientItems: false, coachItems: false, portalUrl: "https://x.test/portal/abc" }, ctx).text.includes("portal"));
});

test("the recap draft starts the client email even when the report's template key is no longer known", () => {
  const r = { sections: [{ title: "Recap for the client (draft)", kind: "draft" as const, content: "Hi Jo, great session.\n\nAmi" }], action_items: [], made_at: "", clipped: false };
  assert.ok(defaultClientMessage(r, null, { clientFirst: "Jo", coachFirst: "Ami", date: "d" }).startsWith("Hi Jo, great session."));
});

test("the branded client email carries the same content as the text, escapes markup, and leaves out private notes", () => {
  const t = templateByKey("coaching-sessions")!;
  const r = cleanReport({ sections: t.sections.filter((s) => s.kind !== "actions").map((s) => ({ title: s.title, content: s.kind === "private" ? "SECRET <b>coach</b> note" : `about ${s.title} <script>` })), action_items: [{ text: "Write the pitch", owner: "Jo", for: "client", due: "2026-11-10" }, { text: "Send the worksheet", owner: "Ami", for: "coach" }] }, t, false, "2026-11-03T00:00:00Z", "Jo Lee");
  const brand = { name: "LifeCharter Command Suite", logoUrl: "https://x.test/brand/command-suite-logo.png" };
  const html = buildClientEmailHtml(r, { message: "Hi Jo,\n\nGreat session <3", summary: true, clientItems: true, coachItems: false, portalUrl: "https://x.test/portal/abc" }, { title: "Coaching with Jo", date: "Nov 3, 2026", contactName: "Jo Lee" }, brand);
  assert.ok(html.includes("https://x.test/brand/command-suite-logo.png") && html.includes("#D4AF63") && html.includes("#0F1A38"));
  assert.ok(html.includes("Write the pitch") && html.includes("Open my private page") && html.includes("https://x.test/portal/abc"));
  assert.ok(!html.includes("SECRET") && !html.includes("Send the worksheet"));
  assert.ok(!html.includes("<script>") && html.includes("&lt;script&gt;"), "markup in the content is escaped");
  const mine = buildCoachCopyHtml(r, { title: "T", date: "d", contactName: "Jo Lee", link: "https://x.test/volant?report=abc", sentTo: "jo@x.test" }, brand);
  assert.ok(mine.includes("SECRET") && mine.includes("Private, only you") && mine.includes("Open the report in the Suite") && mine.includes("Send the worksheet"));
  assert.ok(mine.includes("&lt;b&gt;coach&lt;/b&gt;"), "private note markup is escaped too");
});

test("the whole stored transcript goes to the model, so a long session is never read in part", () => {
  assert.ok(VOLANT_MAX_PROMPT >= VOLANT_MAX_TRANSCRIPT);
  const t = templateByKey("coaching-sessions")!;
  const long = "word ".repeat(40000); // about 200,000 characters, far past the old 60,000
  const p = buildPrompt(t, { title: "T", date: "2026-11-03", contactName: "Jo", transcript: long });
  assert.equal(p.clipped, false);
  assert.ok(p.user.length > 190000);
});

