import {
  AlignmentType, BorderStyle, Document, Footer, Packer, PageBreak, PageNumber, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType,
} from "docx";
import type { Block, PlanDoc } from "./model";

const INDIGO = "0F1A38";
const GOLD = "B8923F";
const INK = "262A3A";
const MUTED = "6E7282";
const LINE = "E2DBCC";
const FONT = "Garamond";
const PAGE_W = 12240;
const MARGIN = 1440;
const CONTENT_W = PAGE_W - MARGIN * 2;

const run = (text: string, o: { bold?: boolean; italics?: boolean; size?: number; color?: string; caps?: boolean; spacing?: number } = {}) =>
  new TextRun({ text, font: FONT, bold: o.bold, italics: o.italics, size: o.size ?? 23, color: o.color ?? INK, allCaps: o.caps, characterSpacing: o.spacing });

const para = (text: string, o: { after?: number; before?: number; align?: (typeof AlignmentType)[keyof typeof AlignmentType]; keepNext?: boolean } = {}) =>
  new Paragraph({ children: [run(text)], spacing: { after: o.after ?? 140, before: o.before ?? 0, line: 300 }, alignment: o.align, keepNext: o.keepNext });

function blockToDocx(b: Block): (Paragraph | Table)[] {
  if (b.t === "p") return [para(b.text)];
  if (b.t === "h2") return [new Paragraph({ children: [run(b.text, { bold: true, size: 28, color: INDIGO })], spacing: { before: 200, after: 120 }, keepNext: true })];
  if (b.t === "h3") return [new Paragraph({ children: [run(b.text, { bold: true, size: 24, color: INDIGO })], spacing: { before: 120, after: 80 }, keepNext: true })];
  if (b.t === "note") return [new Paragraph({ children: [run(b.text, { italics: true, size: 21, color: MUTED })], spacing: { after: 140 } })];
  if (b.t === "bullets") return b.items.map((i) => new Paragraph({ children: [run(i)], bullet: { level: 0 }, spacing: { after: 60, line: 290 } }));
  const total = (b.widths && b.widths.length === b.head.length ? b.widths : b.head.map(() => 1)).reduce((a, c) => a + c, 0);
  const widths = (b.widths && b.widths.length === b.head.length ? b.widths : b.head.map(() => 1)).map((w) => Math.floor((w / total) * CONTENT_W));
  const align = b.align || b.head.map((_, i) => (i === 0 ? "l" : "r"));
  const border = { style: BorderStyle.SINGLE, size: 4, color: LINE };
  const cell = (text: string, i: number, header: boolean) =>
    new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      margins: { top: 70, bottom: 70, left: 100, right: 100 },
      borders: { top: border, bottom: border, left: border, right: border },
      shading: header ? { type: ShadingType.CLEAR, fill: INDIGO, color: "auto" } : undefined,
      children: [new Paragraph({ children: [run(text, { bold: header, size: 21, color: header ? "FAF8F3" : INK })], alignment: align[i] === "r" ? AlignmentType.RIGHT : AlignmentType.LEFT })],
    });
  return [
    new Table({
      width: { size: CONTENT_W, type: WidthType.DXA },
      columnWidths: widths,
      rows: [new TableRow({ tableHeader: true, children: b.head.map((h, i) => cell(h, i, true)) }), ...b.rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, i, false)) }))],
    }),
    new Paragraph({ children: [], spacing: { after: 160 } }),
  ];
}

export async function renderDocx(d: PlanDoc): Promise<Buffer> {
  const kids: (Paragraph | Table)[] = [];

  // Cover
  kids.push(new Paragraph({ children: [run(d.tagline.toUpperCase(), { bold: true, size: 22, color: GOLD, spacing: 60 })], spacing: { before: 2600, after: 160 } }));
  kids.push(new Paragraph({ children: [run(d.business, { size: 80, color: INDIGO })], spacing: { after: 100 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 8 } } }));
  kids.push(new Paragraph({ children: [run(d.label, { italics: true, size: 40, color: GOLD })], spacing: { before: 200, after: 2400 } }));
  if (d.preparedFor) {
    kids.push(new Paragraph({ children: [run("PREPARED FOR", { bold: true, size: 18, color: GOLD, spacing: 40 })], spacing: { after: 40 } }));
    kids.push(new Paragraph({ children: [run(d.preparedFor, { size: 28, color: INDIGO })], spacing: { after: 300 } }));
  }
  kids.push(new Paragraph({ children: [run([d.preparedBy ? `Prepared by ${d.preparedBy}` : "", d.date].filter(Boolean).join("  ·  "), { size: 22, color: MUTED })], spacing: { after: 60 } }));
  kids.push(new Paragraph({ children: [run("Confidential. Prepared for the named recipient.", { italics: true, size: 18, color: MUTED })] }));

  // Cover letter
  if (d.letter && d.letter.length) {
    kids.push(new Paragraph({ children: [new PageBreak()] }));
    kids.push(new Paragraph({ children: [run(d.business.toUpperCase(), { bold: true, size: 20, color: GOLD, spacing: 40 })], spacing: { after: 400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 6 } } }));
    kids.push(para(d.date, { after: 360 }));
    d.letter.forEach((p) => kids.push(para(p, { after: 200 })));
    kids.push(para("Sincerely,", { before: 200, after: 600 }));
    kids.push(new Paragraph({ children: [run(d.letterSignoff || d.preparedBy || d.business, { bold: true, color: INDIGO })], spacing: { after: 40 } }));
    if (d.letterSignoff && d.letterSignoff !== d.business) kids.push(new Paragraph({ children: [run(d.business, { size: 21, color: MUTED })] }));
  }

  // Contents (a plain list; page numbers would need Word to refresh fields)
  kids.push(new Paragraph({ children: [new PageBreak()] }));
  kids.push(new Paragraph({ children: [run("Contents", { size: 52, color: INDIGO })], spacing: { after: 240 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 6 } } }));
  d.parts.forEach((p) =>
    kids.push(new Paragraph({ children: [run(p.title, { bold: p.level === 1, size: p.level === 1 ? 24 : 22, color: p.level === 1 ? INDIGO : INK })], indent: { left: p.level === 2 ? 360 : 0 }, spacing: { after: 100 } }))
  );

  // Body
  kids.push(new Paragraph({ children: [new PageBreak()] }));
  d.parts.forEach((p, i) => {
    if (p.pageBreakBefore && i > 0) kids.push(new Paragraph({ children: [new PageBreak()] }));
    kids.push(
      new Paragraph({
        children: [run(p.title, { size: p.level === 1 ? 48 : 32, bold: p.level === 2, color: INDIGO })],
        spacing: { before: p.level === 1 ? 360 : 240, after: 160 },
        keepNext: true,
        border: p.level === 1 ? { bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 4 } } : undefined,
      })
    );
    p.blocks.forEach((b) => kids.push(...blockToDocx(b)));
  });

  const doc = new Document({
    creator: d.preparedBy || d.business,
    title: `${d.business} - ${d.label}`,
    styles: { default: { document: { run: { font: FONT, size: 23, color: INK } } } },
    numbering: undefined,
    sections: [
      {
        properties: { page: { size: { width: PAGE_W, height: 15840 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [run(`${d.business}  ·  ${d.label}   `, { size: 18, color: MUTED }), new TextRun({ children: ["Page ", PageNumber.CURRENT], font: FONT, size: 18, color: MUTED })],
                alignment: AlignmentType.RIGHT,
                border: { top: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 6 } },
              }),
            ],
          }),
        },
        children: kids,
      },
    ],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}
