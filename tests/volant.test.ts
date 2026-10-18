import { test } from "node:test";
import assert from "node:assert/strict";
import { VOLANT_TEMPLATES, buildPrompt, cleanCaptionFile, cleanItemEdit, cleanReport, newItem, docxXmlToText, reportToText, templateByKey, templateName } from "../src/lib/volant";

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

test("the prompt lists every non-action section and the hiring rule, and clips long transcripts", () => {
    const t = templateByKey("hiring-interviews")!;
    const { system, clipped } = buildPrompt(t, { title: "x", date: "2026-10-17", contactName: "", transcript: "a".repeat(70000) });
    assert.equal(clipped, true);
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
    assert.deepEqual(cleanItemEdit({ text: " Do it ", owner: "Me", due: "soon" }), { text: "Do it", owner: "Me", due: "" });
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
