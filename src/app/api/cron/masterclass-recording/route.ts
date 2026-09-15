import { NextResponse } from "next/server";
import * as google from "@/lib/google";
import * as readai from "@/lib/readai";

export const dynamic = "force-dynamic";
// Experimental: a 90-minute recording can take a while to stream through.
// Raise or lower this once we see how long a real run actually takes on
// whatever Vercel plan this project is on — that's the open question this
// build is meant to answer.
export const maxDuration = 300;

// Where finished MasterClass recordings land. Override via env if the folder
// ever changes; this default matches the "MasterClass" Drive folder already
// in use (see the pre-launch punch list).
const DEFAULT_FOLDER_ID = "1zht-CzdQLU8lCDLF6eHhHfTvcuqGRU9M";

// How far back to look for a not-yet-uploaded MasterClass. Wider than one
// day on purpose: if Read.ai is slow to finish processing, or this cron
// doesn't fire exactly when expected, the next run still catches it — the
// Drive existence check below keeps repeat runs from double-uploading.
const LOOKBACK_DAYS = 8;

function folderId(): string {
  return process.env.MASTERCLASS_DRIVE_FOLDER_ID || DEFAULT_FOLDER_ID;
}

function titleMatches(): string[] {
  const raw = process.env.MASTERCLASS_TITLE_MATCH || "masterclass,hustle to command";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

// "LCCS MC 2026-09-24" — dated in Mountain Time (not server UTC), so a class
// that runs 5-6:30pm MT always gets the calendar date a person watching it
// would say out loud, never the next day's UTC date.
function driveFileName(startMs: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Denver",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(startMs));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `LCCS MC ${get("year")}-${get("month")}-${get("day")}`;
}

async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization") || "";
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const driveToken = await google.getValidAccessToken();
  if (!driveToken) {
    return NextResponse.json({ error: "Google not connected (Settings → Integrations)" }, { status: 500 });
  }
  if (!readai.isReadAiConfigured()) {
    return NextResponse.json({ error: "READ_AI_CLIENT_ID / READ_AI_CLIENT_SECRET not set" }, { status: 500 });
  }
  const readaiToken = await readai.getValidAccessToken();
  if (!readaiToken) {
    return NextResponse.json({ error: "Read.ai not connected yet (one-time /api/readai/bootstrap step)" }, { status: 500 });
  }

  // Test-only override: ?titleTest=<substring> matches against ANY recent
  // meeting regardless of the real MasterClass title filter, so this can be
  // verified against a real, already-existing recording without waiting for
  // an actual class or cycling env vars. Not used by the real weekly cron.
  const url = new URL(request.url);
  const titleTest = url.searchParams.get("titleTest");
  const namePrefix = titleTest ? "TEST DELETE ME — " : "";

  let meeting;
  try {
    meeting = await readai.findRecentMeetingRecording(readaiToken, {
      titleContains: titleTest ? [titleTest] : titleMatches(),
      sinceMs: Date.now() - LOOKBACK_DAYS * 86_400_000,
    });
  } catch (e) {
    console.error("masterclass-recording: read.ai lookup failed", e);
    return NextResponse.json({ error: "read.ai lookup failed" }, { status: 502 });
  }

  if (!meeting || !meeting.recording_download?.url) {
    return NextResponse.json({ status: "no matching recording ready yet" });
  }

  const name = namePrefix + driveFileName(meeting.start_time_ms);

  try {
    const already = await google.driveFileExistsInFolder(driveToken, folderId(), name);
    if (already) {
      return NextResponse.json({ status: "already uploaded", name });
    }

    const file = await google.uploadUrlToDriveFile(driveToken, {
      sourceUrl: meeting.recording_download.url,
      folderId: folderId(),
      name,
      mimeType: "video/mp4",
    });

    return NextResponse.json({ status: "uploaded", name, driveFileId: file.id, meetingId: meeting.id });
  } catch (e) {
    console.error("masterclass-recording: upload failed", e);
    return NextResponse.json({ error: "upload failed", detail: String(e) }, { status: 502 });
  }
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
