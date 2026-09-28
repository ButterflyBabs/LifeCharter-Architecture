import { NextResponse } from "next/server";
import { aiTranscribe, logAiUse, memberAiGate } from "@/lib/community/ai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Voice journaling: a short recording from the Alignment Journal → text.
// Same AI rules as the journal assistant (own Command Suite key, or Plus as
// Mariposa under the monthly cap; consent first). The audio is sent to OpenAI
// only to transcribe it and is never stored.

const MAX_BYTES = 4 * 1024 * 1024; // ~5 minutes at the recorder's bitrate; under the host's request limit
const EXT: Record<string, string> = { webm: "webm", ogg: "ogg", mp4: "mp4", "x-m4a": "m4a", m4a: "m4a", mpeg: "mp3", mp3: "mp3", wav: "wav", aac: "m4a" };

export async function POST(request: Request) {
  const gate = await memberAiGate(request);
  if (!gate.ok) return gate.response;
  const { user, ai } = gate;

  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  if (!audio || typeof audio === "string") return NextResponse.json({ error: "No recording came through — try again." }, { status: 400 });
  if (audio.size < 800) return NextResponse.json({ error: "That recording was too short — hold on a moment longer." }, { status: 400 });
  if (audio.size > MAX_BYTES) return NextResponse.json({ error: "That recording is too long — keep voice notes under about 5 minutes." }, { status: 413 });
  const type = (audio.type || "audio/webm").split(";")[0].toLowerCase();
  const [major, minor] = type.split("/");
  const ext = EXT[minor];
  if (!["audio", "video"].includes(major) || !ext) return NextResponse.json({ error: "That audio format isn't supported." }, { status: 415 });

  try {
    const file = new File([await audio.arrayBuffer()], `voice-note.${ext}`, { type });
    const text = await aiTranscribe(ai.key, file);
    if (ai.source) await logAiUse(user.id, "voice_transcribe", ai.source);
    if (!text) return NextResponse.json({ error: "Couldn't hear any words in that recording — try again closer to the mic." }, { status: 422 });
    return NextResponse.json({ text: text.slice(0, 6000) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Couldn't transcribe that." }, { status: 502 });
  }
}
