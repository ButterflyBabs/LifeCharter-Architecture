import { NextResponse } from "next/server";
import { processDue } from "@/lib/sequences/engine";
import { moveBookedCards, stopBooked } from "@/lib/masterclass/followUp";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Every 15 minutes: sends each live sequence's due emails (day N at the
// sequence's hour in each contact's own time zone). Same CRON_SECRET convention
// as the other crons.
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // First, so nobody who has booked an Executive Consultation gets the next follow-up email.
  const stopped = await stopBooked().catch((e) => {
    console.error("masterclass follow-up stop:", e);
    return 0;
  });
  const cardsMoved = await moveBookedCards().catch((e) => {
    console.error("masterclass pipeline booked:", e);
    return 0;
  });
  const out = await processDue();
  return NextResponse.json({ ...out, stopped, cardsMoved });
}

export const GET = run;
export const POST = run;
