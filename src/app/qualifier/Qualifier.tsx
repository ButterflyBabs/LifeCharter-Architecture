"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { UserCheck, Plus, Trash2, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import QualResult, { PriorityBadge, type Qual } from "@/components/qualifier/QualResult";
import { DEFAULT_LEVELS, PRIORITIES, type Icp, type IcpLevel } from "@/lib/qualifier";
import { parseDelimited } from "@/lib/contactImport";

type Board = { id: string; name: string };
type Offer = { id: string; name: string; transformation: string; idealClient: string; notFor: string };
type Audience = { id: string; name: string; icp_id: string | null; total: number; created_at: string };
type ListRow = { name: string; url: string; code: string; email: string; facts: string };
const onNames = (q: Qual) => (q.on_boards ?? []).map((b) => b.name).join(", ");

const PLATFORMS = [
  { id: "LI", label: "LinkedIn" },
  { id: "IG", label: "Instagram" },
  { id: "FB", label: "Facebook" },
  { id: "Email", label: "Email" },
  { id: "TXT", label: "Text" },
];
const box = "w-full rounded-lg border border-[#1a2b4a]/20 bg-white dark:bg-[#1a2b4a]/20 px-3 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]";
const label = "block text-xs font-medium text-[#5a6472] dark:text-[#b8c2cf]";
const panel = "rounded-2xl border border-[#1a2b4a]/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#1a2b4a]/40";
const TABS = [
  { id: "one", label: "Qualify a prospect" },
  { id: "list", label: "Audience Qualifier" },
  { id: "icp", label: "Ideal Client Profiles" },
] as const;
type Tab = (typeof TABS)[number]["id"];

const blankIcp = (): Icp => ({ id: "", name: "", offerId: null, whoServe: "", helpDo: "", signatureOffer: "", coreProblem: "", alreadyHas: "", missing: "", redFlags: "", levels: DEFAULT_LEVELS.map((l) => ({ ...l })) });

export default function Qualifier() {
  const tz = typeof window !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "America/Denver";
  const [tab, setTab] = useState<Tab>("one");
  const [loaded, setLoaded] = useState(false);
  const [icps, setIcps] = useState<Icp[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [recent, setRecent] = useState<Qual[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const d = await fetch("/api/qualifier", { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    setIcps(d.icps ?? []);
    setOffers(d.offers ?? []);
    setBoards(d.boards ?? []);
    setRecent(d.recent ?? []);
    setAudiences(d.audiences ?? []);
    if (!loaded && !(d.icps ?? []).length) setTab("icp");
    setLoaded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { void load(); }, [load]);

  const post = useCallback(
    async (body: Record<string, unknown>): Promise<Record<string, unknown> | null> => {
      const r = await fetch("/api/qualifier", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, tz }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg(d.error || "Something went wrong."); return null; }
      return d;
    },
    [tz]
  );

  return (
    <div className="py-8 px-4 sm:px-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#c9a227] to-[#1a2b4a]"><UserCheck className="h-6 w-6 text-white" /></div>
        <div>
          <h1 className="text-3xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Prospect Qualifier</h1>
          <p className="text-[#7a8a99]">Score a profile, or a whole list, against your Ideal Client Profile. Then send the right people to an <Link href="/dm-pipeline" className="text-[#2E7C83] hover:underline">Outreach Pipeline</Link>.</p>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-[#1a2b4a]/10 pb-3" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${tab === t.id ? "bg-[#1a2b4a] text-white" : "bg-[#1a2b4a]/5 text-[#1a2b4a] hover:bg-[#1a2b4a]/10 dark:text-[#F8F5F0]"}`}>
            {t.label}{t.id === "icp" && loaded ? <span className="ml-1.5 opacity-70">{icps.length}</span> : null}
          </button>
        ))}
      </div>

      {msg && <button onClick={() => setMsg("")} className="mb-4 block w-full rounded-lg bg-[#2E7C83]/10 px-4 py-2 text-left text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">{msg}</button>}

      {!loaded ? (
        <p className="text-sm text-[#7a8a99]">Loading…</p>
      ) : tab === "icp" ? (
        <IcpTab icps={icps} offers={offers} post={post} setMsg={setMsg} onChanged={load} />
      ) : !icps.length ? (
        <div className={panel}>
          <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">Start by describing who you serve. Every score is measured against an Ideal Client Profile.</p>
          <Button className="mt-3" onClick={() => setTab("icp")}><Plus className="mr-1 h-4 w-4" /> Create your first Ideal Client Profile</Button>
        </div>
      ) : tab === "one" ? (
        <OneTab icps={icps} boards={boards} recent={recent} post={post} setMsg={setMsg} onChanged={load} />
      ) : (
        <ListTab icps={icps} boards={boards} audiences={audiences} post={post} setMsg={setMsg} onChanged={load} />
      )}
    </div>
  );
}

type Post = (b: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
const lastIcp = (icps: Icp[]) => {
  let id = "";
  try { id = localStorage.getItem("qualifier-icp") || ""; } catch { /* none */ }
  return icps.some((i) => i.id === id) ? id : icps[0]?.id ?? "";
};
const rememberIcp = (id: string) => { try { localStorage.setItem("qualifier-icp", id); } catch { /* not remembered */ } };

function IcpPick({ icps, value, onChange }: { icps: Icp[]; value: string; onChange: (id: string) => void }) {
  return (
    <label className={label}>Score against
      <select value={value} onChange={(e) => { onChange(e.target.value); rememberIcp(e.target.value); }} className={`${box} h-10`}>
        {icps.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
      </select>
    </label>
  );
}

function PlatformPick({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Platform">
      {PLATFORMS.map((p) => (
        <button key={p.id} type="button" aria-pressed={value === p.id} onClick={() => onChange(p.id)} className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${value === p.id ? "border-[#2E7C83] bg-[#2E7C83] text-white" : "border-[#1a2b4a]/20 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>
          {p.label}
        </button>
      ))}
    </div>
  );
}

function AddToPipeline({ boards, ids, platform, post, setMsg, onAdded, labelText }: { boards: Board[]; ids: string[]; platform?: string; post: Post; setMsg: (m: string) => void; onAdded: () => void; labelText?: string }) {
  const [boardId, setBoardId] = useState(boards[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  if (!boards.length) return null;
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className={label}>Pipeline
        <select value={boardId} onChange={(e) => setBoardId(e.target.value)} className={`${box} h-10 min-w-[220px]`}>
          {boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </label>
      <Button
        disabled={busy || !ids.length}
        onClick={async () => {
          setBusy(true);
          const r = (await post({ action: "add-to-pipeline", ids, boardId, platform })) as { added?: number; skipped?: number; already?: string[]; failed?: number; board?: string } | null;
          setBusy(false);
          if (r) {
            const dup = r.skipped ? ` ${r.skipped} not added because ${r.skipped === 1 ? "they are" : "they are"} already on ${r.board}: ${(r.already ?? []).join(", ")}${r.skipped > (r.already ?? []).length ? ", and more" : ""}.` : "";
            setMsg(`${r.added} added to ${r.board}.${dup}${r.failed ? ` ${r.failed} couldn't be added.` : ""}${r.added ? " High priority starts in To reach out; Medium and Low start in Nurture." : ""}`);
            onAdded();
          }
        }}
      >
        {busy ? "Adding…" : labelText ?? "Add to pipeline"}
      </Button>
    </div>
  );
}

// ── One prospect: paste their profile, get the full qualification ──
function OneTab({ icps, boards, recent, post, setMsg, onChanged }: { icps: Icp[]; boards: Board[]; recent: Qual[]; post: Post; setMsg: (m: string) => void; onChanged: () => void }) {
  const [icpId, setIcpId] = useState(() => lastIcp(icps));
  const [platform, setPlatform] = useState("LI");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [warm, setWarm] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState<Qual | null>(null);

  async function run() {
    setBusy(true);
    setMsg("");
    const r = (await post({ action: "qualify", icpId, platform, name, profileUrl: url, warm, profileText: text })) as { qualification?: Qual } | null;
    setBusy(false);
    if (r?.qualification) {
      setShown(r.qualification);
      setText("");
      setName("");
      setUrl("");
      setWarm("");
      onChanged();
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(360px,460px)_1fr]">
      <div className={`${panel} space-y-3 self-start`}>
        <IcpPick icps={icps} value={icpId} onChange={setIcpId} />
        <div>
          <p className={`${label} mb-1.5`}>Where their profile is</p>
          <PlatformPick value={platform} onChange={setPlatform} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className={label}>Their name<Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional: read from the profile" /></label>
          <label className={label}>Profile link<Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" /></label>
        </div>
        <label className={label}>Their profile text
          <textarea rows={12} value={text} onChange={(e) => setText(e.target.value)} className={box} placeholder="Open their profile, select everything on the page (Cmd+A), copy (Cmd+C) and paste here." />
        </label>
        <p className="text-xs text-[#7a8a99]">For the best read, paste their profile page <strong>and</strong> their recent posts (on LinkedIn: their profile, then Show all posts). The Suite can&rsquo;t open a profile link itself: the platforms block it, so the text has to be pasted.</p>
        <label className={label}>Have they engaged with you before? (optional)
          <Input value={warm} onChange={(e) => setWarm(e.target.value)} placeholder="e.g. commented on my post last week" />
        </label>
        <Button disabled={busy || text.trim().length < 80 || !icpId} onClick={() => void run()}>
          <Sparkles className="mr-1 h-4 w-4" /> {busy ? "Scoring…" : "Score this prospect"}
        </Button>
      </div>

      <div className="space-y-4">
        {shown ? (
          <div className={panel}>
            <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{shown.name}</h2>
                {shown.profile_url && <a href={shown.profile_url} target="_blank" rel="noreferrer" className="text-sm text-[#2E7C83] hover:underline">Open their profile</a>}
              </div>
              {shown.priority !== "SKIP" ? (
                <AddToPipeline boards={boards} ids={[shown.id]} platform={shown.platform ?? undefined} post={post} setMsg={setMsg} onAdded={() => onChanged()} />
              ) : null}
            </div>
            {onNames(shown) && <p className="mb-3 rounded-lg bg-[#c9a227]/10 px-3 py-2 text-sm text-[#6b5410] dark:text-[#e6d28a]">Already on: <strong>{onNames(shown)}</strong>. They can&rsquo;t be added to the same pipeline twice.</p>}
            <QualResult q={shown} />
          </div>
        ) : (
          <div className={`${panel} text-sm text-[#7a8a99]`}>The qualification shows here: fit, level, the gap, a warm DM angle and the priority.</div>
        )}

        {recent.length > 0 && (
          <div className={panel}>
            <h3 className="mb-2 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Recently scored</h3>
            <ul className="divide-y divide-[#1a2b4a]/10">
              {recent.map((q) => (
                <li key={q.id} className="flex flex-wrap items-center gap-2 py-2">
                  <button onClick={() => { setShown(q); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="min-w-0 flex-1 truncate text-left text-sm font-medium text-[#1a2b4a] hover:underline dark:text-[#F8F5F0]">{q.name}</button>
                  <PriorityBadge priority={q.priority} small />
                  <span className="text-xs text-[#7a8a99]">{q.level}</span>
                  {onNames(q) && <span className="text-xs text-[#2E7C83]">on {onNames(q)}</span>}
                  <span className="text-xs text-[#7a8a99]">{new Date(q.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  <button aria-label={`Delete the score for ${q.name}`} onClick={async () => { if (confirm(`Delete the score for ${q.name}?`) && (await post({ action: "delete", id: q.id }))) { if (shown?.id === q.id) setShown(null); onChanged(); } }} className="rounded p-1 text-[#7a8a99] hover:text-[#D83A34]"><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ── A whole list: first pass on every row, ranked ──
const NAME_COL = /^(full[ _]?name|name)$/i;
const FIRST_COL = /^first[ _]?name$/i;
const LAST_COL = /^last[ _]?name$/i;
const URL_COL = /^(url|profile[ _]?url|linkedin([ _]?url)?|profile([ _]?link)?|link)$/i;
const CODE_COL = /^personal[ _]?code$/i;
const EMAIL_COL = /^(e-?mail([ _]?address)?|enriched[ _]?email|work[ _]?email)$/i;
const SKIP_COL = /email|phone|catchall|^group$|^id$/i;

function rowsFromTable(table: string[][]): ListRow[] {
  if (table.length < 2) return [];
  const head = table[0].map((h) => h.trim());
  const idx = (re: RegExp) => head.findIndex((h) => re.test(h));
  const [iName, iFirst, iLast, iUrl, iCode, iEmail] = [idx(NAME_COL), idx(FIRST_COL), idx(LAST_COL), idx(URL_COL), idx(CODE_COL), idx(EMAIL_COL)];
  const used = new Set([iName, iFirst, iLast, iUrl, iCode]);
  return table.slice(1).map((r) => {
    const cell = (i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
    const name = cell(iName) || `${cell(iFirst)} ${cell(iLast)}`.trim();
    const facts = head
      .map((h, i) => (used.has(i) || SKIP_COL.test(h) || !(r[i] ?? "").trim() ? "" : `${h.replace(/_/g, " ")}: ${(r[i] ?? "").trim().slice(0, 300)}`))
      .filter(Boolean)
      .join("\n");
    return { name, url: cell(iUrl), code: cell(iCode), email: cell(iEmail), facts };
  }).filter((r) => r.name && r.facts);
}

function ListTab({ icps, boards, audiences, post, setMsg, onChanged }: { icps: Icp[]; boards: Board[]; audiences: Audience[]; post: Post; setMsg: (m: string) => void; onChanged: () => void }) {
  const [icpId, setIcpId] = useState(() => lastIcp(icps));
  const [platform, setPlatform] = useState("LI");
  const [listName, setListName] = useState("");
  const [pending, setPending] = useState<ListRow[]>([]);
  const [limit, setLimit] = useState("");
  const [pasting, setPasting] = useState(false);
  const [pasted, setPasted] = useState("");
  // For each person waiting to be scored: the pipelines they are already on.
  const [onNow, setOnNow] = useState<string[][]>([]);
  const [skipOn, setSkipOn] = useState(true);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const stop = useRef(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [rows, setRows] = useState<Qual[]>([]);
  const [show, setShow] = useState<string>("ALL");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const openAudience = useCallback(async (id: string) => {
    setOpenId(id);
    const d = await fetch(`/api/qualifier?audience=${id}`, { cache: "no-store" }).then((r) => r.json()).catch(() => ({}));
    const list = (d.rows ?? []) as Qual[];
    setRows(list);
    setPicked(new Set(list.filter((r) => r.priority === "HIGH" && !(r.on_boards ?? []).length).map((r) => r.id)));
    setShow("ALL");
  }, []);

  const NEEDS = "It needs a header row with a name column (or first name and last name) and at least one more column such as headline, title or company.";
  function take(table: string[][], name?: string) {
    const list = rowsFromTable(table);
    if (!list.length) { setMsg(`Couldn't find people in that. ${NEEDS}`); return; }
    setPending(list);
    setLimit("");
    setOnNow([]);
    setSkipOn(true);
    void post({ action: "list-check", people: list.slice(0, 2000).map((r) => ({ name: r.name, url: r.url, email: r.email })) }).then((r) => setOnNow(((r as { on?: string[][] } | null)?.on) ?? []));
    if (name && !listName) setListName(name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
    setMsg("");
  }
  async function readFile(f: File) {
    try {
      if (/\.xlsx$/i.test(f.name)) {
        // Excel workbook: the first sheet, every cell as text.
        const { default: readXlsx } = await import("read-excel-file");
        const sheet = await readXlsx(f);
        take(sheet.map((r) => r.map((c) => (c == null ? "" : c instanceof Date ? c.toISOString().slice(0, 10) : String(c)))).filter((r) => r.some((c) => c.trim())), f.name);
      } else if (/\.(xls|numbers|ods)$/i.test(f.name)) {
        setMsg("That file type can't be read directly. Save it as Excel (.xlsx) or CSV and upload that, or copy the cells and paste them below.");
      } else take(parseDelimited(await f.text()), f.name);
    } catch {
      setMsg("Couldn't read that file. Try saving it as CSV, or copy the cells and paste them below.");
    }
  }

  async function run() {
    const fresh = skipOn ? pending.filter((_, i) => !(onNow[i]?.length)) : pending;
    if (!fresh.length) { setMsg("Everyone on this list is already on a pipeline."); return; }
    const total = Math.min(fresh.length, Math.max(1, Number(limit) || fresh.length), 1000);
    const todo = fresh.slice(0, total);
    const made = (await post({ action: "audience-create", name: listName || "Untitled list", icpId, total })) as { audience?: Audience } | null;
    if (!made?.audience) return;
    stop.current = false;
    setProgress({ done: 0, total });
    let done = 0;
    for (let i = 0; i < todo.length && !stop.current; i += 10) {
      const r = await post({ action: "audience-score", audienceId: made.audience.id, platform, rows: todo.slice(i, i + 10) });
      if (!r) break;
      done = Math.min(total, i + 10);
      setProgress({ done, total });
    }
    setProgress(null);
    setPending([]);
    setMsg(`${done} of ${total} scored. Sorted best first below.`);
    onChanged();
    void openAudience(made.audience.id);
  }

  const counts = useMemo(() => Object.fromEntries(PRIORITIES.map((p) => [p, rows.filter((r) => r.priority === p).length])), [rows]);
  const visible = rows.filter((r) => show === "ALL" || r.priority === show);
  const open = audiences.find((a) => a.id === openId);

  return (
    <div className="space-y-5">
      <div className={`${panel} space-y-3`}>
        <h2 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Score a whole list</h2>
        <p className="text-sm text-[#5a6472] dark:text-[#b8c2cf]">Upload a spreadsheet of contacts or prospects: Excel (.xlsx) or CSV, or paste the cells straight from Excel, Numbers or Google Sheets. The first row must be the column headings. Each person gets a first-pass fit and priority from what the list holds: title, headline, company, industry, location. It can&rsquo;t see their posts, so it tells you who to look at first. Do the full qualification on a person&rsquo;s pipeline card when you work it.</p>
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <IcpPick icps={icps} value={icpId} onChange={setIcpId} />
          <label className={label}>List name<Input value={listName} onChange={(e) => setListName(e.target.value)} placeholder="e.g. Prospect Bank, Wave 2" /></label>
          <div>
            <p className={`${label} mb-1.5`}>Where you&rsquo;ll reach them</p>
            <PlatformPick value={platform} onChange={setPlatform} />
          </div>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-dashed border-[#2E7C83]/50 px-4 py-2 text-sm font-medium text-[#2E7C83] hover:bg-[#2E7C83]/5">
          <Upload className="h-4 w-4" /> Upload a spreadsheet (.xlsx or .csv)
          <input type="file" accept=".xlsx,.csv,.tsv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void readFile(f); e.target.value = ""; }} />
        </label>
        <button onClick={() => setPasting(!pasting)} className="ml-3 text-sm font-medium text-[#2E7C83] hover:underline">{pasting ? "Hide paste box" : "or paste cells"}</button>
        {pasting && (
          <div className="space-y-2">
            <textarea rows={6} value={pasted} onChange={(e) => setPasted(e.target.value)} className={box} placeholder="Select the cells in your spreadsheet (headings included), copy, and paste here." aria-label="Pasted spreadsheet cells" />
            <Button variant="outline" disabled={!pasted.trim()} onClick={() => { take(parseDelimited(pasted)); setPasted(""); setPasting(false); }}>Use these rows</Button>
          </div>
        )}
        {pending.length > 0 && !progress && (
          <div className="rounded-xl bg-[#1a2b4a]/[0.04] p-3 dark:bg-white/5">
            <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]"><strong>{pending.length}</strong> people found. First one: {pending[0].name}. {pending.length > 1000 ? "Up to 1,000 are scored per list." : ""}</p>
            {onNow.some((x) => x.length) && (
              <label className="mt-2 flex items-start gap-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
                <input type="checkbox" className="mt-1" checked={skipOn} onChange={(e) => setSkipOn(e.target.checked)} />
                <span><strong>{onNow.filter((x) => x.length).length}</strong> of them are already on a pipeline ({Array.from(new Set(onNow.flat())).join(", ")}). Leave them out, so no score is spent on them.</span>
              </label>
            )}
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <label className={label}>How many to score (blank for all)
                <Input inputMode="numeric" value={limit} onChange={(e) => setLimit(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder={String(Math.min(pending.length, 1000))} className="w-40" />
              </label>
              <Button onClick={() => void run()}><Sparkles className="mr-1 h-4 w-4" /> Score the list</Button>
              <Button variant="ghost" onClick={() => setPending([])}>Cancel</Button>
            </div>
            <p className="mt-2 text-xs text-[#7a8a99]">This uses your AI key: about one small request per 10 people (roughly a penny per 100 people).</p>
          </div>
        )}
        {progress && (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-[#1a2b4a]/10"><div className="h-full rounded-full bg-[#2E7C83] transition-all" style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }} /></div>
            <p className="mt-1 text-sm text-[#5a6472] dark:text-[#b8c2cf]">Scoring {progress.done} of {progress.total}… keep this page open. <button onClick={() => { stop.current = true; }} className="font-medium text-[#C76F56] hover:underline">Stop</button></p>
          </div>
        )}
      </div>

      {audiences.length > 0 && (
        <div className={panel}>
          <h3 className="mb-2 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Your scored lists</h3>
          <div className="flex flex-wrap gap-2">
            {audiences.map((a) => (
              <button key={a.id} onClick={() => void openAudience(a.id)} aria-pressed={openId === a.id} className={`rounded-full px-4 py-1.5 text-sm font-medium ${openId === a.id ? "bg-[#1a2b4a] text-white" : "bg-[#1a2b4a]/5 text-[#1a2b4a] hover:bg-[#1a2b4a]/10 dark:text-[#F8F5F0]"}`}>
                {a.name} <span className="opacity-70">{a.total}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {open && (
        <div className={panel}>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{open.name}</h3>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {[{ id: "ALL", n: rows.length, t: "All" }, ...PRIORITIES.map((p) => ({ id: p as string, n: counts[p] ?? 0, t: p[0] + p.slice(1).toLowerCase() }))].map((f) => (
                  <button key={f.id} aria-pressed={show === f.id} onClick={() => setShow(f.id)} className={`rounded-full border px-3 py-1 text-xs font-medium ${show === f.id ? "border-[#1a2b4a] bg-[#1a2b4a] text-white" : "border-[#1a2b4a]/15 text-[#1a2b4a] dark:text-[#F8F5F0]"}`}>{f.t} <span className="tabular-nums opacity-70">{f.n}</span></button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <AddToPipeline boards={boards} ids={Array.from(picked)} platform={platform} post={post} setMsg={setMsg} onAdded={() => void openAudience(open.id)} labelText={`Add ${picked.size} selected to pipeline`} />
              <button onClick={async () => { if (confirm(`Delete the list “${open.name}” and its scores? Anyone already added to a pipeline stays there.`) && (await post({ action: "audience-delete", id: open.id }))) { setOpenId(null); setRows([]); onChanged(); } }} className="inline-flex items-center gap-1 pb-2.5 text-sm text-[#C76F56] hover:underline"><Trash2 className="h-4 w-4" /> Delete list</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#1a2b4a]/10 text-[11px] font-semibold uppercase tracking-wide text-[#7a8a99]">
                  <th className="w-8 py-2">
                    <input type="checkbox" aria-label="Select everyone shown" checked={visible.length > 0 && visible.every((r) => picked.has(r.id))} onChange={(e) => { const n = new Set(picked); visible.forEach((r) => (e.target.checked ? n.add(r.id) : n.delete(r.id))); setPicked(n); }} />
                  </th>
                  <th className="py-2 pr-3">Person</th><th className="py-2 pr-3">Priority</th><th className="py-2 pr-3">Fit</th><th className="py-2 pr-3">Why</th><th className="py-2">Likely level</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((r) => {
                  const res = r.result as { reason?: string; facts?: string };
                  const headline = (res.facts ?? "").split("\n").find((l) => /^(headline|position title|title)/i.test(l))?.replace(/^[^:]+:\s*/, "") ?? "";
                  return (
                    <tr key={r.id} className="border-b border-[#1a2b4a]/5 align-top">
                      <td className="py-2">{<input type="checkbox" aria-label={`Select ${r.name}`} checked={picked.has(r.id)} onChange={(e) => { const n = new Set(picked); if (e.target.checked) n.add(r.id); else n.delete(r.id); setPicked(n); }} />}</td>
                      <td className="py-2 pr-3">
                        {r.profile_url ? <a href={r.profile_url} target="_blank" rel="noreferrer" className="font-medium text-[#1a2b4a] hover:underline dark:text-[#F8F5F0]">{r.name}</a> : <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{r.name}</span>}
                        {headline && <p className="max-w-md truncate text-xs text-[#7a8a99]" title={headline}>{headline}</p>}
                        {onNames(r) && <p className="text-xs font-medium text-[#8a6a15] dark:text-[#e6d28a]">Also on: {onNames(r)}</p>}
                      </td>
                      <td className="py-2 pr-3"><PriorityBadge priority={r.priority} small /></td>
                      <td className="py-2 pr-3 text-xs font-semibold text-[#5a6472] dark:text-[#b8c2cf]">{r.fit === "BORDERLINE" ? "Borderline" : r.fit === "YES" ? "Yes" : "No"}</td>
                      <td className="py-2 pr-3 text-[#1a2b4a] dark:text-[#F8F5F0]">{res.reason}</td>
                      <td className="py-2 text-xs text-[#7a8a99]">{r.level}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!visible.length && <p className="py-4 text-sm text-[#7a8a99]">No one here.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Ideal Client Profiles: one per offer, each with its own wording for the four levels ──
function IcpTab({ icps, offers, post, setMsg, onChanged }: { icps: Icp[]; offers: Offer[]; post: Post; setMsg: (m: string) => void; onChanged: () => void }) {
  const [d, setD] = useState<Icp>(() => (icps[0] ? { ...icps[0] } : blankIcp()));
  const [busy, setBusy] = useState("");
  const set = (patch: Partial<Icp>) => setD((cur) => ({ ...cur, ...patch }));
  const setLevel = (i: number, patch: Partial<IcpLevel>) => set({ levels: d.levels.map((l, k) => (k === i ? { ...l, ...patch } : patch.ideal ? { ...l, ideal: false } : l)) });

  function pickOffer(id: string) {
    const o = offers.find((x) => x.id === id);
    if (!o) { set({ offerId: null }); return; }
    // Empty answers are started from what the offer already says.
    set({ offerId: o.id, name: d.name || o.name, signatureOffer: d.signatureOffer || o.name, whoServe: d.whoServe || o.idealClient, helpDo: d.helpDo || o.transformation, redFlags: d.redFlags || o.notFor });
  }

  const field = (key: "whoServe" | "helpDo" | "signatureOffer" | "coreProblem", title: string, ph: string) => (
    <label className={label}>{title}
      <textarea rows={2} value={d[key]} onChange={(e) => set({ [key]: e.target.value } as Partial<Icp>)} className={box} placeholder={ph} />
    </label>
  );
  const listField = (key: "alreadyHas" | "missing" | "redFlags", title: string, ph: string) => (
    <label className={label}>{title} <span className="font-normal">(one per line)</span>
      <textarea rows={5} value={d[key]} onChange={(e) => set({ [key]: e.target.value } as Partial<Icp>)} className={box} placeholder={ph} />
    </label>
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[260px_1fr]">
      <div className={`${panel} self-start`}>
        <h2 className="mb-2 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Your profiles</h2>
        <p className="mb-3 text-xs text-[#7a8a99]">Keep one for each offer: each has a different ideal client.</p>
        <div className="space-y-1.5">
          {icps.map((i) => (
            <button key={i.id} onClick={() => setD({ ...i })} aria-pressed={d.id === i.id} className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium ${d.id === i.id ? "bg-[#1a2b4a] text-white" : "bg-[#1a2b4a]/5 text-[#1a2b4a] hover:bg-[#1a2b4a]/10 dark:text-[#F8F5F0]"}`}>{i.name}</button>
          ))}
          <button onClick={() => setD(blankIcp())} className="inline-flex w-full items-center gap-1 rounded-lg border border-dashed border-[#2E7C83]/50 px-3 py-2 text-sm text-[#2E7C83] hover:bg-[#2E7C83]/5"><Plus className="h-4 w-4" /> New profile</button>
        </div>
      </div>

      <div className={`${panel} space-y-4`}>
        <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <label className={label}>Profile name<Input value={d.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. MasterClass, Incubator, Suite + Executive Coaching" /></label>
          <label className={label}>For which offer (optional)
            <select value={d.offerId ?? ""} onChange={(e) => pickOffer(e.target.value)} className={`${box} h-10`}>
              <option value="">Not tied to one offer</option>
              {offers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
          <Button
            variant="outline"
            disabled={busy !== ""}
            title="Drafts the answers from your plans and offers. Nothing is saved until you press Save."
            onClick={async () => {
              const filled = [d.whoServe, d.helpDo, d.coreProblem, d.alreadyHas, d.missing, d.redFlags].some((x) => x.trim());
              if (filled && !confirm("Replace what's written here with a new draft?")) return;
              setBusy("draft");
              const r = (await post({ action: "icp-draft", offerId: d.offerId })) as { draft?: Partial<Icp> } | null;
              setBusy("");
              if (r?.draft) { set(r.draft); setMsg("Drafted from your plans and offers. Read it over, make it yours, then Save."); }
            }}
          >
            <Sparkles className="mr-1 h-4 w-4" /> {busy === "draft" ? "Drafting… this takes about 20 seconds" : "Draft it for me"}
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {field("whoServe", "Who I serve", "e.g. Purpose-driven women coaches and consultants")}
          {field("helpDo", "What I help them do", "e.g. Build brand visibility and turn engagement into paying clients")}
          {field("signatureOffer", "My signature offer", "e.g. Framework → workshop → 1:1 coaching")}
          {field("coreProblem", "Core problem I solve", "e.g. Visible and skilled, but their content stops at “feel seen” without moving to “ready to work with you”")}
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {listField("alreadyHas", "What my ideal client already has", "Established expertise or credentials\nPosts consistently\nHas an audience\nRuns a service-based business")}
          {listField("missing", "What my ideal client is missing", "Clear messaging that converts\nA visible offer or lead magnet\nA conversion mechanism in their calls to action")}
          {listField("redFlags", "Red flags (not my ideal client)", "Works for a corporate firm, not their own business\nOutside my service area or language\nDormant: hasn't posted in 6+ months")}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">The levels</h3>
          <p className="mb-2 text-xs text-[#7a8a99]">Every prospect is placed in one of these. Reword each level so it describes people in <em>your</em> market, and mark the one that is your ideal client. (Wrong fit and Dormant are always flagged too.)</p>
          <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
            {d.levels.map((l, i) => (
              <div key={i} className={`rounded-xl border p-3 ${l.ideal ? "border-[#2E7C83] bg-[#2E7C83]/5" : "border-[#1a2b4a]/10 dark:border-white/10"}`}>
                <Input value={l.name} onChange={(e) => setLevel(i, { name: e.target.value })} aria-label={`Level ${i + 1} name`} />
                <textarea rows={5} value={l.signs} onChange={(e) => setLevel(i, { signs: e.target.value })} className={`${box} mt-2`} aria-label={`Level ${i + 1} signs`} placeholder="The signs you'd see, one per line" />
                <label className="mt-2 flex items-center gap-2 text-xs font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">
                  <input type="radio" name="ideal-level" checked={l.ideal} onChange={() => setLevel(i, { ideal: true })} /> This is my ideal client
                </label>
              </div>
            ))}
          </div>
          <button onClick={() => set({ levels: DEFAULT_LEVELS.map((l) => ({ ...l })) })} className="mt-2 text-xs text-[#2E7C83] hover:underline">Put the starting levels back</button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={busy !== "" || !d.name.trim() || !d.whoServe.trim()}
            onClick={async () => {
              setBusy("save");
              const r = (await post({ action: "icp-save", ...d })) as { icp?: Icp } | null;
              setBusy("");
              if (r?.icp) { setD({ ...r.icp }); rememberIcp(r.icp.id); setMsg(`${r.icp.name} saved. You can score against it now.`); onChanged(); }
            }}
          >
            {busy === "save" ? "Saving…" : "Save profile"}
          </Button>
          {d.id && (
            <button onClick={async () => { if (confirm(`Delete “${d.name}”? Scores already made against it are kept.`) && (await post({ action: "icp-delete", id: d.id }))) { setD(blankIcp()); onChanged(); } }} className="ml-auto inline-flex items-center gap-1 text-sm text-[#C76F56] hover:underline"><Trash2 className="h-4 w-4" /> Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}
