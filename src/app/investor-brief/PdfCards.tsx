"use client";

import { useState } from "react";

export type PdfDoc = { file: string; title: string; note: string; pages: number; featured?: boolean; thumb?: string };

// Each attachment is a card: a preview of its first page, what it is, and Read here / Download.
// The viewer loads only when a card is opened, so the page stays light.
export default function PdfCards({ docs }: { docs: PdfDoc[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ul className="grid gap-5 sm:grid-cols-2">
      {docs.map((d) => {
        const src = `/investor-brief/${d.file}`;
        const thumb = d.thumb;
        const isOpen = open === d.file;
        return (
          <li
            key={d.file}
            className={`ib-card ${d.featured ? "sm:col-span-2 ib-card-feature" : ""}`}
          >
            <div className="flex gap-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumb}
                alt={`First page of ${d.title}`}
                loading="lazy"
                className="h-36 w-28 shrink-0 rounded-md border border-[#C9B8A7] object-cover object-top shadow-sm sm:h-44 sm:w-36"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <h3 className="ib-card-title">{d.title}</h3>
                <p className="ib-card-note">{d.note}</p>
                <p className="ib-card-meta">PDF &middot; {d.pages} {d.pages === 1 ? "page" : "pages"}</p>
                <div className="mt-auto flex flex-wrap gap-2 pt-3">
                  <button type="button" onClick={() => setOpen(isOpen ? null : d.file)} aria-expanded={isOpen} className="ib-btn ib-btn-solid">
                    {isOpen ? "Close" : "Read here"}
                  </button>
                  <a href={src} download className="ib-btn ib-btn-line">Download PDF</a>
                </div>
              </div>
            </div>
            {isOpen && (
              <div className="mt-5 overflow-hidden rounded-xl border border-[#0F1A38]/15 bg-white">
                <iframe title={d.title} src={`${src}#view=FitH`} className="h-[78vh] min-h-[480px] w-full" />
                <p className="px-3 py-2 text-xs text-[#5b6580]">
                  Not showing on your device?{" "}
                  <a className="underline" href={src} target="_blank" rel="noopener noreferrer">Open it in a new tab</a>.
                </p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
