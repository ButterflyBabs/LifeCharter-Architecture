import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanSpeakerNames, cleanUtterances, recordingExt, recordingKind, safeFileBase, speakersOf, toSrt, transcriptText } from "../src/lib/volantRecording";

const raw = [
    { speaker: "A", start: 0, end: 4000, text: "Welcome, Eloise. How was your week?" },
    { speaker: "B", start: 4200, end: 9000, text: "Busy but good." },
    { speaker: "A", start: 9100, end: 12000, text: "Tell me about the launch." },
    { speaker: "C", start: 0, end: 0, text: "   " },
];

test("recording files: video and audio in, everything else out", () => {
    assert.equal(recordingKind("Zoom call.MP4"), "video");
    assert.equal(recordingKind("memo.m4a"), "audio");
    assert.equal(recordingKind("clip", "video/quicktime"), "video");
    assert.equal(recordingKind("notes.docx"), null);
    assert.equal(safeFileBase("Coaching Call (Oct 17).mov"), "coaching-call-oct-17");
    assert.equal(recordingExt("a.MOV"), "mov");
    assert.equal(recordingExt("noext"), "bin");
});

test("turns are cleaned, voices listed in speaking order, and only real voices can be named", () => {
    const u = cleanUtterances(raw);
    assert.equal(u.length, 3);
    assert.deepEqual(speakersOf(u).map((v) => [v.speaker, v.lines]), [["A", 2], ["B", 1]]);
    assert.deepEqual(cleanSpeakerNames({ A: " Babs ", B: "", Z: "Nobody" }, u), { A: "Babs" });
    assert.equal(cleanUtterances("nope").length, 0);
});

test("the transcript uses the names given, and captions are timed", () => {
    const u = cleanUtterances(raw);
    const t = transcriptText(u, { A: "Babs", B: "Eloise" });
    assert.equal(t.split("\n")[1], "Eloise: Busy but good.");
    assert.match(transcriptText(u, {}, true), /^\[0:00\] Speaker A:/);
    const srt = toSrt(u);
    assert.match(srt, /^1\n00:00:00,000 --> 00:00:04,000\nWelcome, Eloise/);
    assert.equal(srt.trim().split("\n\n").length, 3);
});
