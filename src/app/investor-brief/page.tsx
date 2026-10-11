import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import PdfCards, { type PdfDoc } from "./PdfCards";

// Investor-facing page: the full brief written out, with the supporting PDFs embedded. Unlisted: it is not
// linked from anywhere and search engines are told to skip it. The brief text is a snapshot exported from the
// Investor Brief document (src/content/investorBrief.html); re-export it there when the brief changes.
export const metadata: Metadata = {
  title: "Investor Brief | LifeCharter Command Suite",
  description: "The LifeCharter Command Suite investor brief and supporting documents.",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-static";

const DOCS: PdfDoc[] = [
  { file: "LCCS-Investor-Summary.pdf", title: "Investor Summary", note: "The ask, where things stand, the plan, pricing, risks and next steps. Start here.", pages: "2 pages" },
  { file: "LCCS-Investor-Brief.pdf", title: "Investor Brief (printable)", note: "The full brief on this page, as a branded document you can print or save.", pages: "24 pages" },
  { file: "LCCS-Product-Screens.pdf", title: "Product Screens", note: "Twenty-eight screens of the live product in demo mode, on sample data.", pages: "14 pages" },
  { file: "LCCS-Financial-Model-Key-Outputs.pdf", title: "Financial Model: Key Outputs", note: "The 12-month plan, scenarios, funnel and price sets from the financial model.", pages: "2 pages" },
  { file: "LCCS-Security-and-Privacy-Summary.pdf", title: "Security and Privacy Summary", note: "What is in place and what is not.", pages: "1 page" },
  { file: "LCCS-Replacement-Cost-Assumptions.pdf", title: "Replacement-Cost Assumptions", note: "Hours, rates and exclusions behind the estimated cost to build.", pages: "1 page" },
  { file: "LCCS-Investor-Package.pdf", title: "Everything in one file", note: "Summary, brief, product screens, model outputs, security and replacement-cost pages together.", pages: "45 pages" },
];

const BRIEF_CSS = `
.brief{font-family:Georgia,'Times New Roman',serif;color:#1B2433;font-size:17px;line-height:1.7}
.brief h2{font-size:26px;line-height:1.25;color:#0F1A38;margin:2.4em 0 .6em;padding-bottom:.3em;border-bottom:1px solid #D4AF63}
.brief h2:first-child{margin-top:0}
.brief h3{font-size:20px;color:#0F1A38;margin:1.6em 0 .4em}
.brief p{margin:0 0 1em}
.brief ul,.brief ol{margin:0 0 1.1em;padding-left:1.4em}
.brief li{margin:.35em 0}
.brief a{color:#2E7C83;text-decoration:underline}
.brief strong{color:#0F1A38}
.brief .tw{overflow-x:auto;margin:1.2em 0 1.5em}
.brief table{border-collapse:collapse;width:100%;font-size:15px;line-height:1.45}
.brief th,.brief td{border:1px solid #C9B8A7;padding:.5em .7em;text-align:left;vertical-align:top}
.brief th{background:#E8E0D4;color:#0F1A38;font-family:Arial,Helvetica,sans-serif;font-size:13px}
@media print{.noprint{display:none!important}}
`;

export default function InvestorBriefPage() {
  let html = fs.readFileSync(path.join(process.cwd(), "src/content/investorBrief.html"), "utf8");
  // Wide tables scroll inside their own box on a phone.
  html = html.replace(/<table>/g, '<div class="tw"><table>').replace(/<\/table>/g, "</table></div>");
  return (
    <main className="min-h-screen bg-[#FAF8F3] text-[#1B2433]">
      <style dangerouslySetInnerHTML={{ __html: BRIEF_CSS }} />
      <header className="bg-[#0F1A38] px-5 py-10 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/investor-brief/logo-reversed.png" alt="LifeCharter Command Suite" className="mx-auto h-16 w-auto" />
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#D4AF63]">Investor Brief</p>
        <h1 className="mx-auto mt-2 max-w-3xl font-serif text-3xl font-bold leading-tight text-[#FAF8F3] sm:text-4xl">
          LifeCharter Command Suite
        </h1>
        <p className="mt-3 text-sm text-[#C9CFDC]">Prepared October 11, 2026 &middot; AmiLynne Carroll</p>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-10">
        <nav aria-label="On this page" className="noprint mb-10 flex flex-wrap gap-2 text-sm font-semibold">
          <a href="#documents" className="rounded-full bg-[#0F1A38] px-4 py-2 text-[#FAF8F3]">Documents</a>
          <a href="#brief" className="rounded-full border border-[#0F1A38]/25 px-4 py-2 text-[#0F1A38]">The brief</a>
        </nav>

        <section id="documents" className="noprint scroll-mt-6">
          <h2 className="font-serif text-2xl font-bold text-[#0F1A38]">Documents</h2>
          <p className="mb-5 mt-2 text-[15px] text-[#3d4660]">
            Read any of these here, or download the PDF. The editable financial model (Excel) is provided separately.
          </p>
          <PdfCards docs={DOCS} />
        </section>

        <section id="brief" className="mt-14 scroll-mt-6">
          <article className="brief" dangerouslySetInnerHTML={{ __html: html }} />
        </section>

        <footer className="mt-16 border-t border-[#D4AF63]/60 pt-6 text-center text-sm text-[#6b7390]">
          <p>LifeCharter Command Suite &middot; Head up - Wings out</p>
        </footer>
      </div>
    </main>
  );
}
