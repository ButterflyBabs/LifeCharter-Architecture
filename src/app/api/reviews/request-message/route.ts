import { NextResponse } from "next/server";
import { crossOriginBlocked } from "@/lib/security";
import { planningAssistant, planningSystem, runJson } from "@/lib/ai/planningAi";

export const dynamic = "force-dynamic";

// The client's assistant drafts the note they send with a review link — in their
// voice, about the specific person and what they worked on together.
export async function POST(request: Request) {
  if (crossOriginBlocked(request)) return NextResponse.json({ error: "cross-origin request blocked" }, { status: 403 });
  const a = await planningAssistant();
  if (!a) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!a.key) return NextResponse.json({ needsKey: true });
  const b = await request.json().catch(() => ({}));
  const s = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const clientName = s(b.clientName, 120);
  const program = s(b.program, 120);
  const system = planningSystem(
    a,
    "helping the client ask one of their own clients for a review.",
    "Write a short, warm, personal note (under 110 words) asking them to share a few words about working together, in the client's own voice and sign-off. Mention what they worked on only if it's given. Do not promise anything in return, do not pressure, and leave the review link as the placeholder [review link]. " +
      'Return STRICT JSON: {"message":"the note"}.'
  );
  const out = await runJson(a, system, `Their client: ${clientName || "(name not given)"}. What they worked on together: ${program || "(not given)"}.`, 400, 0.6);
  const message = String(out?.message ?? "").trim();
  if (!message) return NextResponse.json({ error: "Couldn't draft that — try again." }, { status: 502 });
  return NextResponse.json({ message, assistant: a.name });
}
