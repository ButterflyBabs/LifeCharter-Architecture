import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { pdfSafe } from "@/lib/esign";

// E-signature (task 1072): the sealed PDF. A written document is set as pages of text; an uploaded PDF keeps its own
// pages. Then come a signature page (each signer's signature, name, email, time and IP) and a certificate of
// completion (the document's id, the SHA-256 of what was signed, and every event in the audit trail).

export interface SealSigner { name: string; email: string; signedAt: string; ip: string | null; type: "typed" | "drawn"; text: string | null; image: string | null }
export interface SealEvent { at: string; event: string; who: string | null; ip: string | null }
export interface SealInput {
  id: string;
  title: string;
  business: string;
  body: string | null;
  original: Uint8Array | null; // an uploaded PDF
  originalHash: string;
  signers: SealSigner[];
  events: SealEvent[];
  completedAt: string;
  consentText: string;
}

const W = 612;
const H = 792;
const M = 60;
const INK = rgb(0.12, 0.17, 0.23);
const MUTED = rgb(0.4, 0.44, 0.5);

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const out: string[] = [];
  for (const para of pdfSafe(text).split("\n")) {
    if (!para.trim()) {
      out.push("");
      continue;
    }
    let line = "";
    for (const word of para.split(/\s+/)) {
      const tryLine = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(tryLine, size) <= width) line = tryLine;
      else {
        if (line) out.push(line);
        // A very long word is cut so it never runs off the page.
        let w = word;
        while (font.widthOfTextAtSize(w, size) > width) {
          let i = w.length;
          while (i > 1 && font.widthOfTextAtSize(w.slice(0, i), size) > width) i--;
          out.push(w.slice(0, i));
          w = w.slice(i);
        }
        line = w;
      }
    }
    out.push(line);
  }
  return out;
}

class Writer {
  page!: PDFPage;
  y = 0;
  constructor(private pdf: PDFDocument, private font: PDFFont, private bold: PDFFont, private footer: string) {
    this.newPage();
  }
  newPage() {
    this.page = this.pdf.addPage([W, H]);
    this.y = H - M;
    this.page.drawText(pdfSafe(this.footer).slice(0, 110), { x: M, y: 30, size: 7.5, font: this.font, color: MUTED });
  }
  need(h: number) {
    if (this.y - h < M) this.newPage();
  }
  text(s: string, opts: { size?: number; bold?: boolean; color?: ReturnType<typeof rgb>; gap?: number } = {}) {
    const size = opts.size ?? 10.5;
    const f = opts.bold ? this.bold : this.font;
    for (const line of wrap(s, f, size, W - 2 * M)) {
      this.need(size + 4);
      if (line) this.page.drawText(line, { x: M, y: this.y - size, size, font: f, color: opts.color ?? INK });
      this.y -= size + 4;
    }
    this.y -= opts.gap ?? 4;
  }
}

export async function sealPdf(input: SealInput): Promise<Uint8Array> {
  const pdf = input.original ? await PDFDocument.load(input.original, { ignoreEncryption: true }) : await PDFDocument.create();
  pdf.setTitle(pdfSafe(input.title));
  pdf.setProducer("LifeCharter Command Suite");
  pdf.setCreationDate(new Date(input.completedAt));
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const script = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const footer = `${input.title} · Document ${input.id}`;

  if (!input.original) {
    const w = new Writer(pdf, font, bold, footer);
    w.text(input.title, { size: 18, bold: true, gap: 10 });
    for (const block of (input.body || "").split(/\n{2,}/)) {
      const b = block.trim();
      if (!b) continue;
      if (/^#{1,3}\s/.test(b)) w.text(b.replace(/^#{1,3}\s+/, ""), { size: 12.5, bold: true, gap: 4 });
      else w.text(b, { gap: 8 });
    }
  }

  // Signature page.
  const s = new Writer(pdf, font, bold, footer);
  s.text("Signatures", { size: 16, bold: true, gap: 6 });
  s.text(`${input.title}`, { color: MUTED, gap: 14 });
  for (const sg of input.signers) {
    s.need(120);
    if (sg.type === "drawn" && sg.image) {
      try {
        const png = await pdf.embedPng(Buffer.from(sg.image.split(",")[1], "base64"));
        const scale = Math.min(220 / png.width, 60 / png.height, 1);
        s.page.drawImage(png, { x: M, y: s.y - png.height * scale, width: png.width * scale, height: png.height * scale });
        s.y -= png.height * scale + 6;
      } catch {
        s.text(`${sg.name} (drawn signature)`, { gap: 2 });
      }
    } else {
      s.page.drawText(pdfSafe(sg.text || sg.name).slice(0, 60), { x: M, y: s.y - 26, size: 26, font: script, color: INK });
      s.y -= 34;
    }
    s.page.drawLine({ start: { x: M, y: s.y }, end: { x: M + 260, y: s.y }, thickness: 0.6, color: MUTED });
    s.y -= 6;
    s.text(`${sg.name} · ${sg.email}`, { bold: true, size: 10, gap: 0 });
    s.text(`Signed ${new Date(sg.signedAt).toUTCString()}${sg.ip ? ` · IP ${sg.ip}` : ""} · ${sg.type === "drawn" ? "drawn" : "typed"} signature`, { size: 9, color: MUTED, gap: 16 });
  }

  // Certificate of completion.
  const c = new Writer(pdf, font, bold, footer);
  c.text("Certificate of completion", { size: 16, bold: true, gap: 6 });
  c.text(`This document was signed electronically through the LifeCharter Command Suite for ${input.business}.`, { gap: 10 });
  c.text(`Document: ${input.title}`, { size: 10 });
  c.text(`Document ID: ${input.id}`, { size: 10 });
  c.text(`Completed: ${new Date(input.completedAt).toUTCString()}`, { size: 10 });
  c.text(`SHA-256 of the document as sent for signature: ${input.originalHash}`, { size: 9, gap: 10 });
  c.text("Each signer opened a private link sent to their email address, confirmed a 6-digit code sent to that same address, agreed to do business electronically, and adopted their signature. The consent each signer agreed to:", { size: 9.5, gap: 4 });
  c.text(`"${input.consentText}"`, { size: 9, color: MUTED, gap: 12 });
  c.text("Signers", { size: 11.5, bold: true, gap: 2 });
  for (const sg of input.signers) c.text(`${sg.name} <${sg.email}> signed ${new Date(sg.signedAt).toUTCString()}${sg.ip ? ` from IP ${sg.ip}` : ""}`, { size: 9.5, gap: 2 });
  c.y -= 8;
  c.text("Audit trail (all times UTC)", { size: 11.5, bold: true, gap: 2 });
  for (const e of input.events) c.text(`${e.at.replace("T", " ").slice(0, 19)}  ${e.event}${e.who ? ` · ${e.who}` : ""}${e.ip ? ` · IP ${e.ip}` : ""}`, { size: 8.5, gap: 1 });
  c.y -= 8;
  c.text("The SHA-256 of this complete file is kept by the Command Suite; any later change to the file would no longer match it.", { size: 8.5, color: MUTED });

  return pdf.save();
}
