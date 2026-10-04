import { jsPDF } from "jspdf";
import type { Block, PlanDoc } from "./model";

// Brand: indigo, gold, ivory. Times is the serif that ships inside every PDF reader, so the file looks the same everywhere.
const INDIGO: [number, number, number] = [15, 26, 56];
const GOLD: [number, number, number] = [184, 146, 63];
const IVORY: [number, number, number] = [250, 248, 243];
const INK: [number, number, number] = [38, 42, 58];
const MUTED: [number, number, number] = [110, 114, 130];
const LINE: [number, number, number] = [226, 219, 204];

const W = 612;
const H = 792;
const M = 72;
const CW = W - M * 2;
const BOTTOM = H - 64;

// The built-in PDF fonts only cover Western characters; swap anything else for a close plain one.
const safe = (s: string) =>
  s
    .replace(/[→⇒]/g, "->")
    .replace(/[✓✔]/g, "v")
    .replace(/[≤]/g, "<=")
    .replace(/[≥]/g, ">=")
    .replace(/ /g, " ")
    .replace(/[^\u0009\u000A -~¡-ÿ–—‘’“”•…€]/g, "");

export function renderPdf(d: PlanDoc): Buffer {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  doc.setProperties({ title: `${d.business} - ${d.label}`, author: d.preparedBy || d.business, subject: d.tagline });
  let y = M;

  const font = (style: "normal" | "bold" | "italic", size: number, color = INK) => {
    doc.setFont("times", style);
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
  };
  const lines = (text: string, width: number) => doc.splitTextToSize(safe(text), width) as string[];
  const newPage = () => {
    doc.addPage();
    y = M;
  };
  const ensure = (h: number) => {
    if (y + h > BOTTOM) newPage();
  };

  // ---- Cover ----
  doc.setFillColor(...INDIGO);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...GOLD);
  doc.rect(M, 250, 64, 3, "F");
  font("bold", 11, GOLD);
  doc.setCharSpace(3);
  doc.text(safe(d.tagline.toUpperCase()), M, 232);
  doc.setCharSpace(0);
  font("normal", 38, IVORY);
  const titleLines = lines(d.business, CW);
  titleLines.forEach((l, i) => doc.text(l, M, 305 + i * 44));
  const afterTitle = 305 + (titleLines.length - 1) * 44;
  font("italic", 20, [212, 175, 99]);
  doc.text(safe(d.label), M, afterTitle + 40);
  font("normal", 12, IVORY);
  let cy = 640;
  if (d.preparedFor) {
    font("bold", 9, GOLD);
    doc.setCharSpace(2);
    doc.text("PREPARED FOR", M, cy);
    doc.setCharSpace(0);
    font("normal", 13, IVORY);
    lines(d.preparedFor, CW).forEach((l, i) => doc.text(l, M, cy + 18 + i * 16));
    cy += 54;
  }
  font("normal", 11, [190, 196, 214]);
  doc.text(safe([d.preparedBy ? `Prepared by ${d.preparedBy}` : "", d.date].filter(Boolean).join("  ·  ")), M, 716);
  font("italic", 9, [150, 158, 184]);
  doc.text("Confidential. Prepared for the named recipient.", M, 736);

  // ---- Cover letter ----
  if (d.letter && d.letter.length) {
    newPage();
    font("bold", 10, GOLD);
    doc.setCharSpace(2);
    doc.text(safe(d.business.toUpperCase()), M, y);
    doc.setCharSpace(0);
    y += 14;
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(1);
    doc.line(M, y, M + 48, y);
    y += 34;
    font("normal", 11, MUTED);
    doc.text(safe(d.date), M, y);
    y += 30;
    font("normal", 12, INK);
    for (const p of d.letter) {
      const ls = lines(p, CW);
      ensure(ls.length * 17 + 10);
      ls.forEach((l, i) => doc.text(l, M, y + i * 17));
      y += ls.length * 17 + 12;
    }
    y += 6;
    ensure(80);
    font("normal", 12, INK);
    doc.text("Sincerely,", M, y);
    y += 44;
    font("bold", 12, INDIGO);
    doc.text(safe(d.letterSignoff || d.preparedBy || d.business), M, y);
    y += 16;
    font("normal", 11, MUTED);
    if (d.letterSignoff && d.letterSignoff !== d.business) doc.text(safe(d.business), M, y);
  }

  // ---- Contents (page numbers filled in after the body is laid out) ----
  newPage();
  const tocPage = doc.getNumberOfPages();
  // The contents page is drawn later; start the body on the next page.
  newPage();

  const pageOf: number[] = [];
  const renderBlock = (b: Block) => {
    if (b.t === "p") {
      font("normal", 11.5);
      const ls = lines(b.text, CW);
      for (let i = 0; i < ls.length; i++) {
        ensure(16);
        doc.text(ls[i], M, y);
        y += 16;
      }
      y += 6;
    } else if (b.t === "h3") {
      ensure(40);
      y += 4;
      font("bold", 12, INDIGO);
      doc.text(safe(b.text), M, y);
      y += 18;
    } else if (b.t === "h2") {
      ensure(48);
      y += 6;
      font("bold", 14, INDIGO);
      doc.text(safe(b.text), M, y);
      y += 22;
    } else if (b.t === "bullets") {
      font("normal", 11.5);
      for (const item of b.items) {
        const ls = lines(item, CW - 20);
        ensure(16);
        doc.setFillColor(...GOLD);
        doc.circle(M + 5, y - 4, 1.8, "F");
        for (let i = 0; i < ls.length; i++) {
          ensure(16);
          doc.text(ls[i], M + 20, y);
          y += 16;
        }
        y += 2;
      }
      y += 6;
    } else if (b.t === "note") {
      font("italic", 10.5, MUTED);
      const ls = lines(b.text, CW);
      ls.forEach((l) => {
        ensure(14);
        doc.text(l, M, y);
        y += 14;
      });
      y += 6;
    } else if (b.t === "table") {
      const widths = (b.widths && b.widths.length === b.head.length ? b.widths : b.head.map(() => 1)).map((w) => w / (b.widths || b.head.map(() => 1)).reduce((a, c) => a + c, 0) * CW);
      const align = b.align || b.head.map((_, i) => (i === 0 ? "l" : "r"));
      const drawRow = (cells: string[], header: boolean) => {
        font(header ? "bold" : "normal", 10.5, header ? IVORY : INK);
        const cellLines = cells.map((c, i) => lines(c, widths[i] - 14));
        const rows = Math.max(...cellLines.map((c) => c.length), 1);
        const rh = rows * 13 + 10;
        ensure(rh);
        if (header) {
          doc.setFillColor(...INDIGO);
          doc.rect(M, y, CW, rh, "F");
        } else {
          doc.setDrawColor(...LINE);
          doc.setLineWidth(0.6);
          doc.line(M, y + rh, M + CW, y + rh);
        }
        let x = M;
        cellLines.forEach((cl, i) => {
          font(header ? "bold" : "normal", 10.5, header ? IVORY : INK);
          cl.forEach((l, k) => {
            const ty = y + 14 + k * 13;
            if (align[i] === "r") doc.text(l, x + widths[i] - 7, ty, { align: "right" });
            else doc.text(l, x + 7, ty);
          });
          x += widths[i];
        });
        y += rh;
      };
      // Keep a short table on one page.
      font("normal", 10.5);
      const heights = [b.head, ...b.rows].map((cells) => Math.max(...cells.map((c, i) => lines(c, widths[i] - 14).length), 1) * 13 + 10);
      const total = heights.reduce((a, c) => a + c, 0);
      if (y + total > BOTTOM && total < BOTTOM - M) newPage();
      drawRow(b.head, true);
      b.rows.forEach((r) => drawRow(r, false));
      y += 12;
    }
  };

  d.parts.forEach((p, idx) => {
    if (p.pageBreakBefore && y > M + 4) newPage();
    ensure(p.level === 1 ? 90 : 70);
    pageOf[idx] = doc.getNumberOfPages();
    y += p.level === 1 ? 10 : 4;
    if (p.level === 1) {
      font("normal", 24, INDIGO);
      const ls = lines(p.title, CW);
      ls.forEach((l) => {
        doc.text(l, M, y);
        y += 28;
      });
      doc.setFillColor(...GOLD);
      doc.rect(M, y - 14, 40, 2, "F");
      y += 10;
    } else {
      font("bold", 16, INDIGO);
      lines(p.title, CW).forEach((l) => {
        doc.text(l, M, y);
        y += 20;
      });
      y += 4;
    }
    p.blocks.forEach(renderBlock);
    y += p.level === 1 ? 14 : 8;
  });

  // ---- Fill in the contents page ----
  doc.setPage(tocPage);
  let ty = M;
  font("normal", 26, INDIGO);
  doc.text("Contents", M, ty);
  ty += 14;
  doc.setFillColor(...GOLD);
  doc.rect(M, ty, 40, 2, "F");
  ty += 36;
  d.parts.forEach((p, i) => {
    if (ty > BOTTOM) return;
    const indent = p.level === 2 ? 22 : 0;
    font(p.level === 1 ? "bold" : "normal", p.level === 1 ? 12 : 11, p.level === 1 ? INDIGO : INK);
    const label = lines(p.title, CW - 60 - indent)[0];
    doc.text(label, M + indent, ty);
    const num = String(pageOf[i] - 1); // the cover is not numbered
    doc.text(num, M + CW, ty, { align: "right" });
    const tw = doc.getTextWidth(label);
    const nw = doc.getTextWidth(num);
    doc.setDrawColor(...LINE);
    doc.setLineDashPattern([1, 3], 0);
    doc.line(M + indent + tw + 8, ty - 2, M + CW - nw - 8, ty - 2);
    doc.setLineDashPattern([], 0);
    ty += p.level === 1 ? 24 : 19;
  });

  // ---- Footers (not on the cover) ----
  const total = doc.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    doc.setPage(i);
    font("normal", 9, MUTED);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.6);
    doc.line(M, H - 48, W - M, H - 48);
    doc.text(safe(`${d.business}  ·  ${d.label}`), M, H - 32);
    doc.text(`Page ${i - 1} of ${total - 1}`, W - M, H - 32, { align: "right" });
  }

  return Buffer.from(doc.output("arraybuffer"));
}
