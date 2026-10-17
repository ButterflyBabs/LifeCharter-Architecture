import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { Cormorant_Garamond, EB_Garamond, Montserrat } from "next/font/google";
import PdfCards, { type PdfDoc } from "./PdfCards";
import pages from "@/content/investorPages.json";
import meta from "@/content/investorBrief.meta.json";
import thumbs from "@/content/investorThumbs.json";

// Investor-facing page. The brief is LIVE on the page (rendered from src/content/investorBrief.html, the one source),
// and the same source produces the printable PDF and the master document. Unlisted: not linked from anywhere, and
// search engines are told to skip it. To update: edit the source, run build/rebuild_all.py, commit, push.
export const metadata: Metadata = {
  title: "Investor Brief | LifeCharter Command Suite",
  description: "The LifeCharter Command Suite investor brief, with the supporting documents.",
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-static";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], style: ["normal", "italic"], variable: "--ib-display" });
const serif = EB_Garamond({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--ib-serif" });
const sans = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--ib-sans" });

const P = pages as Record<string, number>;
const T = thumbs as Record<string, string>;
// The download options, in the order Babs set: each is a card with Read here and Download.
const MASTER: PdfDoc = {
  file: "LCCS-Investor-Package.pdf",
  title: "LCCS Investor Package",
  note: "The master document: investor summary, the full brief, product screens, financial model outputs, security and privacy summary and replacement-cost assumptions, all in one file.",
  pages: P["LCCS-Investor-Package.pdf"],
  featured: true,
};
const ATTACHMENTS: PdfDoc[] = [
  { file: "LCCS-Investor-Brief.pdf", title: "Investor Brief", note: "The full brief from this page, as a branded document you can print or save.", pages: P["LCCS-Investor-Brief.pdf"] },
  { file: "LCCS-Investor-Summary.pdf", title: "Investor Summary", note: "The ask, where things stand, the plan, pricing, risks and next steps, in two pages.", pages: P["LCCS-Investor-Summary.pdf"] },
  { file: "LCCS-Financial-Model-Key-Outputs.pdf", title: "Financial Model (view only)", note: "The twelve-month plan, scenarios, funnel and price sets from the financial model, printed so it cannot be changed.", pages: P["LCCS-Financial-Model-Key-Outputs.pdf"] },
  { file: "LCCS-Product-Screens.pdf", title: "Product Screens", note: "Twenty-eight screens of the live product, captured in demo mode on sample data.", pages: P["LCCS-Product-Screens.pdf"] },
  { file: "LCCS-Client-Journeys.pdf", title: "Client Journeys", note: "Four one-page maps of the client experience: the Executive Consultation route, the self-serve Starter route, the first 30 days inside the Suite, and life after day 30.", pages: P["LCCS-Client-Journeys.pdf"] },
  { file: "LCCS-Security-and-Privacy-Summary.pdf", title: "Security and Privacy Summary", note: "What is in place to protect client data, and what is not yet.", pages: P["LCCS-Security-and-Privacy-Summary.pdf"] },
  { file: "LCCS-Replacement-Cost-Assumptions.pdf", title: "Replacement-Cost Assumptions", note: "The hours, rates and exclusions behind the estimated cost to build the platform.", pages: P["LCCS-Replacement-Cost-Assumptions.pdf"] },
  { file: "LCCS-Data-Room-Index.pdf", title: "Index and Links: Data Room", note: "What is in the data room and the online links: the demo, legal pages, the founder-pricing terms and the SOP library.", pages: P["LCCS-Data-Room-Index.pdf"] },
];

const CSS = `
.ib{--indigo:#0F1A38;--indigo-deep:#0B1630;--gold:#D4AF63;--gold-soft:#E9D7A9;--ivory:#FAF8F3;--sand:#E8E0D4;--taupe:#C9B8A7;--ink:#1B2433;--plum:#5E3B6C;--teal:#2E7C83;
  font-family:var(--ib-serif),Georgia,serif;color:var(--ink);background:var(--ivory)}
.ib *{box-sizing:border-box}
.ib-display{font-family:var(--ib-display),Georgia,serif}
.ib-sans{font-family:var(--ib-sans),Arial,sans-serif}
.ib-hero{background:linear-gradient(160deg,var(--indigo-deep) 0%,#121F44 60%,#1F2B59 100%);border-bottom:3px solid var(--gold)}
.ib-nav{position:sticky;top:0;z-index:20;background:rgba(250,248,243,.94);backdrop-filter:blur(8px);border-bottom:1px solid var(--taupe)}
.ib-nav a{font-family:var(--ib-sans),Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--indigo);text-decoration:none;padding:.55rem .9rem;border-radius:999px}
.ib-nav a:hover{background:var(--sand)}
.ib-nav a.solid{background:var(--indigo);color:var(--ivory)}
.ib-nav a.solid:hover{background:#1B2A52}
.ib a:focus-visible,.ib button:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
.ib-toc{display:flex;flex-wrap:wrap;gap:.5rem;margin:0 0 2.5rem;padding:0;list-style:none}
.ib-toc a{font-family:var(--ib-sans),Arial,sans-serif;font-size:12.5px;font-weight:500;color:var(--indigo);text-decoration:none;border:1px solid var(--taupe);border-radius:999px;padding:.35rem .8rem;background:#fff}
.ib-toc a:hover{border-color:var(--gold)}
.brief{font-size:19px;line-height:1.75}
.brief h2{font-family:var(--ib-display),Georgia,serif;font-weight:600;font-size:38px;line-height:1.12;color:var(--indigo);margin:2.6em 0 .7em;padding-bottom:.35em;border-bottom:1px solid var(--gold);scroll-margin-top:72px}
.brief h2:first-child{margin-top:0}
.brief h3{font-family:var(--ib-display),Georgia,serif;font-weight:600;font-size:27px;line-height:1.2;color:var(--plum);margin:1.7em 0 .4em}
.brief p{margin:0 0 1.05em}
.brief ul,.brief ol{margin:0 0 1.2em;padding-left:1.5em}
.brief li{margin:.4em 0;padding-left:.2em}
.brief ul li::marker{color:var(--gold)}
.brief ol li::marker{color:var(--indigo);font-weight:600}
.brief strong{color:var(--indigo);font-weight:500}
.brief a{color:var(--teal);text-decoration:underline;text-underline-offset:3px}
.brief .tw{overflow-x:auto;margin:1.4em 0 1.8em;border:1px solid var(--taupe);border-radius:10px;background:#fff}
.brief table{border-collapse:collapse;width:100%;font-family:var(--ib-sans),Arial,sans-serif;font-size:14px;line-height:1.5;min-width:520px}
.brief th{background:var(--sand);color:var(--indigo);font-weight:600;font-size:12.5px;letter-spacing:.03em;text-align:left;padding:.7em .9em;border-bottom:2px solid var(--gold)}
.brief td{padding:.65em .9em;border-top:1px solid #E5DDD0;vertical-align:top}
.brief tbody tr:first-child td{border-top:0}
.brief td:first-child{color:var(--indigo);font-weight:500}
.ib-h2{font-family:var(--ib-display),Georgia,serif;font-weight:600;font-size:38px;line-height:1.12;color:var(--indigo)}
.ib-card{background:#fff;border:1px solid var(--taupe);border-radius:16px;padding:1.25rem}
.ib-card-feature{background:linear-gradient(160deg,var(--indigo-deep),#121F44);border-color:var(--gold);color:var(--ivory)}
.ib-card-title{font-family:var(--ib-display),Georgia,serif;font-weight:600;font-size:26px;line-height:1.15;color:var(--indigo);margin:0}
.ib-card-feature .ib-card-title{color:var(--gold-soft)}
.ib-card-note{font-size:16px;line-height:1.5;margin:.45rem 0 0;color:#3a4358}
.ib-card-feature .ib-card-note{color:#CBD5E1}
.ib-card-meta{font-family:var(--ib-sans),Arial,sans-serif;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;margin:.6rem 0 0;color:#6b7390}
.ib-card-feature .ib-card-meta{color:var(--gold)}
.ib-btn{font-family:var(--ib-sans),Arial,sans-serif;font-size:13px;font-weight:600;border-radius:999px;padding:.6rem 1.1rem;text-decoration:none;cursor:pointer;display:inline-block}
.ib-btn-solid{background:var(--gold);color:var(--indigo);border:1px solid var(--gold)}
.ib-btn-solid:hover{background:var(--gold-soft)}
.ib-btn-line{background:transparent;color:var(--indigo);border:1px solid var(--indigo)}
.ib-btn-line:hover{background:rgba(15,26,56,.06)}
.ib-card-feature .ib-btn-line{color:var(--ivory);border-color:var(--gold-soft)}
.ib-card-feature .ib-btn-line:hover{background:rgba(255,255,255,.08)}
@media (max-width:640px){.brief{font-size:17.5px}.brief h2{font-size:31px}.ib-h2{font-size:31px}}
@media print{.ib-nav,.ib-docs{display:none!important}.ib{background:#fff}}
`;

function dateLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export default function InvestorBriefPage() {
  let html = fs.readFileSync(path.join(process.cwd(), "src/content/investorBrief.html"), "utf8");
  // Wide tables scroll inside their own box on a phone.
  html = html.replace(/<table>/g, '<div class="tw"><table>').replace(/<\/table>/g, "</table></div>");
  const toc: { id: string; text: string }[] = [];
  const h2 = /<h2 id="([^"]+)">(.*?)<\/h2>/g;
  for (let m = h2.exec(html); m; m = h2.exec(html)) toc.push({ id: m[1], text: m[2].replace(/<[^>]+>/g, "") });
  const date = dateLabel(meta.date);

  return (
    <main className={`ib ${display.variable} ${serif.variable} ${sans.variable} min-h-screen`}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="ib-hero px-5 pb-14 pt-12 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/investor-brief/logo-reversed.png" alt="LifeCharter Command Suite" className="mx-auto h-20 w-auto sm:h-24" />
        <p className="ib-sans mt-10 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#D4AF63]">Investor brief</p>
        <h1 className="ib-display mx-auto mt-3 max-w-3xl text-[40px] font-semibold leading-[1.08] text-[#FAF8F3] sm:text-[58px]">
          Align your business.<br />Lead your legacy.
        </h1>
        <div className="mx-auto mt-6 h-px w-24 bg-[#D4AF63]" />
        <p className="ib-sans mt-5 text-[13px] tracking-wide text-[#CBD5E1]">
          LifeCharter Command Suite &middot; Prepared {date} &middot; AmiLynne Carroll
        </p>
      </header>

      <nav className="ib-nav" aria-label="On this page">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-5 py-2">
          <div className="flex flex-wrap gap-1">
            <a href="#brief">The brief</a>
            <a href="#documents">Documents</a>
          </div>
          <a className="solid" href="/investor-brief/LCCS-Investor-Brief.pdf" download>Download this brief (PDF)</a>
        </div>
      </nav>

      <div className="mx-auto max-w-3xl px-5 py-14">
        <section id="brief" className="scroll-mt-16">
          <ul className="ib-toc" aria-label="In this brief">
            {toc.map((t) => (
              <li key={t.id}><a href={`#${t.id}`}>{t.text}</a></li>
            ))}
          </ul>
          <article className="brief" dangerouslySetInnerHTML={{ __html: html }} />
        </section>
      </div>

      <section id="documents" className="ib-docs border-t border-[#C9B8A7] bg-[#F3EEE4] px-5 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="ib-sans text-[11px] font-semibold uppercase tracking-[0.24em] text-[#8a6d2c]">Read here or download</p>
          <h2 className="ib-h2 mt-2">The investor documents</h2>
          <p className="mb-8 mt-3 max-w-2xl text-[18px] leading-relaxed text-[#3a4358]">
            Open any document on this page, or download the PDF. The master document holds everything in one file. The editable financial model (Excel) is provided separately.
          </p>
          <PdfCards docs={[MASTER, ...ATTACHMENTS].map((d) => ({ ...d, thumb: T[d.file] }))} />
        </div>
      </section>

      <footer className="bg-[#0B1630] px-5 py-12 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/investor-brief/logo-reversed.png" alt="LifeCharter Command Suite" className="mx-auto h-12 w-auto opacity-90" />
        <p className="ib-display mt-5 text-[22px] italic text-[#E9D7A9]">The command cockpit for founders</p>
        <p className="ib-sans mt-4 text-[11px] tracking-wide text-[#94A3B8]">
          &copy; {new Date().getFullYear()} Sacred Kaleidoscope Community LLC. All rights reserved. LifeCharter Command Suite&trade;
        </p>
      </footer>
    </main>
  );
}
