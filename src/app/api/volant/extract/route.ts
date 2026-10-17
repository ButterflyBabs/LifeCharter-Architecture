import { NextResponse } from "next/server";
import { volantAccount } from "@/lib/volantServer";
import { cleanCaptionFile, docxXmlToText, VOLANT_MAX_TRANSCRIPT } from "@/lib/volant";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_BYTES = 4 * 1024 * 1024; // under the host's request limit; a 2-hour transcript is far smaller

// LC Volant: read the words out of an uploaded transcript file (from any app or device) and hand them back to the
// page. Nothing is stored here; the text is saved only when the report is made. Accepts .txt .md .vtt .srt .docx .pdf.
export async function POST(request: Request) {
  const a = await volantAccount(request);
  if ("denied" in a) return a.denied;
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || typeof file === "string") return NextResponse.json({ error: "Choose a transcript file first." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "That file is over 4 MB. Save the transcript as a .txt or .docx file, or paste the text." }, { status: 400 });
  const name = file.name || "transcript.txt";
  try {
    let text = "";
    if (/\.docx$/i.test(name)) {
      const JSZip = (await import("jszip")).default;
      const zip = await JSZip.loadAsync(await file.arrayBuffer());
      const xml = await zip.file("word/document.xml")?.async("string");
      if (!xml) return NextResponse.json({ error: "That Word file could not be read. Try saving it again as .docx, or paste the text." }, { status: 400 });
      text = docxXmlToText(xml);
    } else if (/\.pdf$/i.test(name)) {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(await file.arrayBuffer()));
      text = String((await extractText(pdf, { mergePages: true })).text || "").trim();
      if (!text) return NextResponse.json({ error: "That PDF has no text to read (it may be a scanned image). Paste the text instead." }, { status: 400 });
    } else if (/\.(txt|md|vtt|srt|text)$/i.test(name) || (file.type || "").startsWith("text/")) {
      text = cleanCaptionFile(name, await file.text());
    } else if (/\.doc$/i.test(name)) {
      return NextResponse.json({ error: "Older .doc files can't be read. In Word, choose Save As and pick .docx, or paste the text." }, { status: 400 });
    } else {
      return NextResponse.json({ error: "Upload a transcript as .txt, .docx, .pdf, .vtt, .srt or .md. Audio and video files come in the next update." }, { status: 400 });
    }
    text = text.replace(/\u0000/g, "").trim();
    if (!text) return NextResponse.json({ error: "That file looks empty." }, { status: 400 });
    return NextResponse.json({ text: text.slice(0, VOLANT_MAX_TRANSCRIPT), name, cut: text.length > VOLANT_MAX_TRANSCRIPT });
  } catch (e) {
    console.error("POST /api/volant/extract:", e instanceof Error ? e.message : e);
    return NextResponse.json({ error: "That file could not be read. Paste the text instead." }, { status: 400 });
  }
}
