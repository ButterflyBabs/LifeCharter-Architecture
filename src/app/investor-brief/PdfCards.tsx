"use client";

import { useState } from "react";

export type PdfDoc = { file: string; title: string; note: string; pages: string };

// Each document opens inside the page (a viewer, loaded only when opened) and can be downloaded.
export default function PdfCards({ docs }: { docs: PdfDoc[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <ul className="grid gap-4">
      {docs.map((d) => {
        const src = `/investor-brief/${d.file}`;
        const isOpen = open === d.file;
        return (
          <li key={d.file} className="rounded-2xl border border-[#D4AF63]/30 bg-white/60 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 basis-64">
                <h3 className="font-serif text-lg font-bold text-[#0F1A38]">{d.title}</h3>
                <p className="mt-1 text-sm text-[#3d4660]">{d.note}</p>
                <p className="mt-1 text-xs text-[#6b7390]">{d.pages}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : d.file)}
                  aria-expanded={isOpen}
                  className="rounded-full bg-[#0F1A38] px-4 py-2 text-sm font-semibold text-[#FAF8F3] hover:bg-[#1B2A52]"
                >
                  {isOpen ? "Close" : "Read it here"}
                </button>
                <a href={src} download className="rounded-full border border-[#0F1A38]/25 px-4 py-2 text-sm font-semibold text-[#0F1A38] hover:bg-[#0F1A38]/5">
                  Download PDF
                </a>
              </div>
            </div>
            {isOpen && (
              <div className="mt-4 overflow-hidden rounded-xl border border-[#0F1A38]/15 bg-white">
                <iframe title={d.title} src={`${src}#view=FitH`} className="h-[75vh] min-h-[480px] w-full" />
                <p className="px-3 py-2 text-xs text-[#6b7390]">
                  If the document does not show on your device,{" "}
                  <a className="underline" href={src} target="_blank" rel="noopener noreferrer">
                    open it in a new tab
                  </a>
                  .
                </p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
