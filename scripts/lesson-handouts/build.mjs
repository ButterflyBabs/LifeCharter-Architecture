// Builds the downloadable lesson handouts (one-page PDFs) into public/handouts/lessons.
//   node scripts/lesson-handouts/build.mjs [slug ...]
// Needs Google Chrome installed; it prints each handout page to PDF.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LESSONS } from "./lessons.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "public", "handouts", "lessons");
const CHROME = process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const LOGO = `data:image/png;base64,${readFileSync(join(dirname(fileURLToPath(import.meta.url)), "logo.png")).toString("base64")}`;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function page(l) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(l.title)} | Lesson handout</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  @page { size: Letter; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 8.5in; height: 11in; }
  body { font-family: "EB Garamond", Georgia, serif; color: #0F1A38; background: #FAF8F3; display: flex; flex-direction: column; padding: 0.5in 0.65in 0.4in; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid #D4AF63; }
  header img { height: 58px; }
  .eyebrow { font-family: Montserrat, Arial, sans-serif; font-size: 8.5pt; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #9A7B2E; }
  header .eyebrow { text-align: right; line-height: 1.7; }
  header .eyebrow span { display: block; color: #0F1A38; }
  h1 { font-family: "Cormorant Garamond", Georgia, serif; font-weight: 600; font-size: 27pt; line-height: 1.08; margin-top: 16px; }
  .idea { font-size: 12.5pt; line-height: 1.38; font-style: italic; margin-top: 8px; color: #1F2B59; }
  .remember { margin-top: 13px; background: #0F1A38; color: #FAF8F3; border-radius: 10px; padding: 11px 16px 12px; }
  .remember .eyebrow { color: #E9D7A9; }
  .remember ul { list-style: none; margin-top: 5px; }
  .remember li { font-size: 10.8pt; line-height: 1.32; padding-left: 15px; position: relative; margin-top: 3px; }
  .remember li::before { content: ""; position: absolute; left: 0; top: 0.5em; width: 6px; height: 6px; background: #D4AF63; transform: rotate(45deg); }
  .turn { flex: 1; display: flex; flex-direction: column; margin-top: 13px; }
  .prompts { flex: 1; display: flex; flex-direction: column; margin-top: 2px; }
  .prompt { display: flex; flex-direction: column; margin-top: 9px; }
  .prompt p { font-size: 10.8pt; font-weight: 500; line-height: 1.25; }
  .line { flex: 1; min-height: 19px; border-bottom: 1px solid #C9B8A7; }
  .week { margin-top: 18px; border: 1px solid #D4AF63; border-radius: 10px; background: #fff; padding: 10px 16px 11px; }
  .week p { font-size: 11.2pt; line-height: 1.32; margin-top: 3px; }
  .credit { margin-top: 8px; font-size: 8.5pt; font-style: italic; color: #7a7468; }
  footer { margin-top: 11px; display: flex; justify-content: space-between; font-family: Montserrat, Arial, sans-serif; font-size: 7pt; letter-spacing: 0.06em; color: #7a7468; }
</style></head><body>
<header><img src="${LOGO}" alt="LifeCharter Command Suite"><div class="eyebrow">Lesson handout<span>${esc(l.area)}</span></div></header>
<h1>${esc(l.title)}</h1>
<p class="idea">${esc(l.bigIdea)}</p>
<section class="remember"><p class="eyebrow">Remember</p><ul>${l.remember.map((r) => `<li>${esc(r)}</li>`).join("")}</ul></section>
<section class="turn"><p class="eyebrow">Your turn</p><div class="prompts">${l.prompts
    .map((p) => `<div class="prompt" style="flex:${p.lines}"><p>${esc(p.q)}</p>${'<div class="line"></div>'.repeat(p.lines)}</div>`)
    .join("")}</div></section>
<section class="week"><p class="eyebrow">This week</p><p>${esc(l.thisWeek)}</p></section>
${l.credit ? `<p class="credit">${esc(l.credit)}</p>` : ""}
<footer><span>LifeCharter Command Suite · Align your business. Lead your legacy.</span><span>© ${new Date().getFullYear()} Sacred Kaleidoscope Community LLC</span></footer>
</body></html>`;
}

mkdirSync(OUT, { recursive: true });
const tmp = mkdtempSync(join(tmpdir(), "lesson-handouts-"));
// Pass slugs to rebuild only those handouts; with none, every handout is rebuilt.
const only = process.argv.slice(2);
for (const l of LESSONS.filter((x) => !only.length || only.includes(x.slug))) {
  const html = join(tmp, `${l.slug}.html`);
  writeFileSync(html, page(l));
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=8000", `--print-to-pdf=${join(OUT, `${l.slug}.pdf`)}`, `file://${html}`], { stdio: "ignore" });
  console.log(`${l.slug}.pdf`);
}
