"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ClipboardPaste, Upload, X } from "lucide-react";
import { PROJECT_IMPORT_LIMITS, HOW_TO, SOURCE_LABEL, STATUS_LABEL, TARGET_LABELS, buildTasks, guessDateOrder, guessMapping, readProjectTable, suggestSectionUse, mapStatus, type DateOrder, type PTable, type SectionUse, type Target, type TaskStatus } from "@/lib/projectImport";
import { fmtDay, tzParam } from "./types";

// Projects > Import a project. The file is read and understood right here in the browser; only the mapped tasks
// go to /api/projects/import, which creates one new project.

const FIELD = "w-full rounded-lg border border-[#1a2b4a]/15 bg-white px-3 py-2 text-sm text-[#1a2b4a] dark:bg-[#1a2b4a]/30 dark:text-[#F8F5F0]";
const LABEL = "mb-1 block text-xs font-medium text-[#1a2b4a] dark:text-[#F8F5F0]";
const ACCEPT = ".csv,.tsv,.txt,.md,.markdown,.json,.zip,text/csv,text/plain,text/markdown,application/json,application/zip";
const TARGETS = Object.keys(TARGET_LABELS) as Target[];
const STATUSES = Object.keys(STATUS_LABEL) as TaskStatus[];

async function readFileText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}

// A zip (Notion's export is one): the CSV files inside, biggest first, else the Markdown pages.
async function readZip(file: File): Promise<{ name: string; text: string }[]> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const entries = Object.values(zip.files).filter((f) => !f.dir && !/(^|\/)__MACOSX\//.test(f.name) && !/(^|\/)\./.test(f.name));
  const pick = async (re: RegExp) => {
    const out: { name: string; text: string }[] = [];
    for (const e of entries.filter((x) => re.test(x.name)).slice(0, 40)) out.push({ name: e.name.split("/").pop() || e.name, text: new TextDecoder("utf-8").decode(await e.async("uint8array")) });
    return out.sort((a, b) => b.text.length - a.text.length);
  };
  const csv = await pick(/\.(csv|tsv)$/i);
  if (csv.length) return csv;
  const md = await pick(/\.(md|markdown)$/i);
  if (md.length) return md;
  return pick(/\.json$/i);
}

export default function ImportProject({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"choose" | "map" | "importing" | "done">("choose");
  const [paste, setPaste] = useState("");
  const [err, setErr] = useState("");
  const [table, setTable] = useState<PTable | null>(null);
  const [candidates, setCandidates] = useState<{ name: string; text: string }[]>([]);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<Target[]>([]);
  const [name, setName] = useState("");
  const [orderPick, setOrderPick] = useState<DateOrder | null>(null);
  const [sectionPick, setSectionPick] = useState<SectionUse | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, TaskStatus>>({});
  const [result, setResult] = useState<{ id: string; tasks: number; milestones: number; assigned: number; unmatched: string[] } | null>(null);

  const load = (text: string, nameHint: string) => {
    setErr("");
    if (new Blob([text]).size > PROJECT_IMPORT_LIMITS.maxFileBytes) return setErr("That file is over 5 MB. Export one project at a time, or a smaller view.");
    const t = readProjectTable(text, nameHint);
    if (!t || !t.rows.length) return setErr("I couldn't find any tasks in that. Check it is the exported file (CSV, Trello JSON or a checklist) and try again.");
    const m = guessMapping(t.headers, t.source);
    setTable(t);
    setMapping(m);
    setName(t.projectName ? t.projectName.replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, PROJECT_IMPORT_LIMITS.name) : "");
    setOrderPick(null);
    setSectionPick(null);
    setStatusMap({});
    setStep("map");
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setErr("");
    setFileName(file.name);
    try {
      if (/\.zip$/i.test(file.name)) {
        const found = await readZip(file);
        if (!found.length) return setErr("That zip has no CSV, Markdown or JSON file in it. In Notion choose Export > CSV (or Markdown) and upload that zip.");
        setCandidates(found);
        return load(found[0].text, found[0].name);
      }
      setCandidates([]);
      load(await readFileText(file), file.name);
    } catch {
      setErr("I couldn't read that file. Try exporting it again.");
    }
  };

  const colValues = (target: Target) => {
    const idx = mapping.indexOf(target);
    return idx >= 0 && table ? table.rows.map((r) => r[idx] || "") : [];
  };
  const order: DateOrder = orderPick ?? guessDateOrder([...colValues("due"), ...colValues("start")]);
  const sectionUse: SectionUse = sectionPick ?? suggestSectionUse(colValues("section"));
  const built = useMemo(
    () => (table ? buildTasks(table, mapping, { source: table.source, order, sectionUse, statusMap }) : null),
    [table, mapping, order, sectionUse, statusMap]
  );
  const hasTitle = mapping.includes("title");
  const hasSection = mapping.includes("section");
  const doneCount = built?.tasks.filter((t) => t.status === "done").length ?? 0;
  const previewDates = (d: string | null) => (d ? fmtDay(d) : "");

  const setCol = (i: number, t: Target) => {
    setMapping((cur) => {
      const next = cur.slice();
      const single: Target[] = ["title", "status", "priority", "start", "due", "assignee", "done", "parent", "section"];
      if (single.includes(t)) for (let k = 0; k < next.length; k++) if (next[k] === t) next[k] = "ignore";
      next[i] = t;
      return next;
    });
  };

  const doImport = async () => {
    if (!built || !table) return;
    setErr("");
    setStep("importing");
    const res = await fetch("/api/projects/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        source: table.source,
        milestones: sectionUse === "milestone",
        tz: tzParam(),
        tasks: built.tasks.map((t) => ({ title: t.title, description: t.description, status: t.status, priority: t.priority, startDay: t.startDay, dueDay: t.dueDay, section: t.section, assignee: t.assignee, completedDay: t.completedDay })),
      }),
    }).catch(() => null);
    const d = await res?.json().catch(() => ({}));
    if (!res || !res.ok) {
      setErr((d && d.error) || "Couldn't import. Nothing was changed; try again.");
      return setStep("map");
    }
    setResult(d);
    setStep("done");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div role="dialog" aria-label="Import a project" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-[#F8F5F0] p-5 shadow-2xl dark:bg-[#14213a]" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Import a project</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1 text-[#7a8a99] hover:bg-[#1a2b4a]/10"><X className="h-5 w-5" /></button>
        </div>

        {step === "choose" && (
          <div>
            <p className="mb-3 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">Bring a project in from Notion, ClickUp, Asana, Trello, Monday, Todoist, Jira or a spreadsheet. It arrives as a new project with its tasks, dates and sections. Nothing you already have is changed.</p>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border-2 border-dashed border-[#1a2b4a]/20 p-4 text-center">
                <Upload className="mx-auto mb-2 h-6 w-6 text-[#2E7C83]" />
                <p className="mb-2 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">1. Upload the export</p>
                <input ref={fileRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                <button onClick={() => fileRef.current?.click()} className="rounded-lg bg-[#1a2b4a] px-4 py-2 text-sm font-semibold text-white">Choose a file</button>
                <p className="mt-2 text-[11px] text-[#7a8a99]">CSV, Trello JSON, Markdown or a zip (Notion). Up to 5 MB and {PROJECT_IMPORT_LIMITS.maxTasks} tasks.</p>
              </div>
              <div className="rounded-xl border border-[#1a2b4a]/15 p-4">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]"><ClipboardPaste className="h-4 w-4 text-[#2E7C83]" /> Or paste it</p>
                <textarea rows={4} className={FIELD} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"Paste copied spreadsheet cells, or a list:\n- [ ] First task\n- [x] Finished task"} />
                <button onClick={() => load(paste, "")} disabled={!paste.trim()} className="mt-2 rounded-lg border border-[#1a2b4a]/25 px-3 py-1.5 text-sm font-medium text-[#1a2b4a] disabled:opacity-50 dark:text-[#F8F5F0]">Read what I pasted</button>
              </div>
            </div>
            <h3 className="mb-1 mt-5 text-sm font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">How to get the export (menu names can vary a little)</h3>
            <div className="space-y-1">
              {HOW_TO.map(([tool, steps]) => (
                <details key={tool} className="rounded-lg border border-[#1a2b4a]/10 bg-white px-3 py-2 text-sm dark:bg-[#1a2b4a]/20">
                  <summary className="cursor-pointer font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{tool}</summary>
                  <p className="mt-1 text-[#4a5a69] dark:text-[#cfd6dd]">{steps}</p>
                </details>
              ))}
            </div>
          </div>
        )}

        {step === "map" && table && built && (
          <div className="space-y-4">
            <p className="text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">
              This looks like {table.source === "sheet" || table.source === "list" ? SOURCE_LABEL[table.source] : `a ${SOURCE_LABEL[table.source]} export`}
              {fileName ? ` (${fileName})` : ""}. I found <b>{built.tasks.length}</b> task{built.tasks.length === 1 ? "" : "s"}
              {doneCount ? `, ${doneCount} already done` : ""}. Check the matches, then import.
            </p>
            {candidates.length > 1 && (
              <div>
                <label className={LABEL} htmlFor="ip-file">This zip has several files. Which one is the project?</label>
                <select id="ip-file" className={FIELD} onChange={(e) => { const c = candidates[Number(e.target.value)]; load(c.text, c.name); }}>
                  {candidates.map((c, i) => <option key={c.name + i} value={i}>{c.name}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className={LABEL} htmlFor="ip-name">Project name</label>
              <input id="ip-name" className={FIELD} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fall retreat" />
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#1a2b4a]/10 bg-white dark:bg-[#1a2b4a]/20">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1a2b4a]/10 text-[#7a8a99]">
                    <th className="px-3 py-2 font-medium">Column in your file</th>
                    <th className="px-3 py-2 font-medium">Looks like</th>
                    <th className="px-3 py-2 font-medium">Goes to</th>
                  </tr>
                </thead>
                <tbody>
                  {table.headers.map((h, i) => (
                    <tr key={i} className="border-b border-[#1a2b4a]/5 last:border-0">
                      <td className="px-3 py-2 font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{h}</td>
                      <td className="max-w-[260px] truncate px-3 py-2 text-[#7a8a99]">{table.rows.slice(0, 3).map((r) => r[i]).filter(Boolean).join(" · ") || "(empty)"}</td>
                      <td className="px-3 py-2">
                        <select aria-label={`Where ${h} goes`} className={FIELD} value={mapping[i] ?? "ignore"} onChange={(e) => setCol(i, e.target.value as Target)}>
                          {TARGETS.map((t) => <option key={t} value={t}>{TARGET_LABELS[t]}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {hasSection && (
                <div>
                  <label className={LABEL} htmlFor="ip-sec">What are the sections?</label>
                  <select id="ip-sec" className={FIELD} value={sectionUse} onChange={(e) => setSectionPick(e.target.value as SectionUse)}>
                    <option value="milestone">Milestones on the timeline</option>
                    <option value="status">The task&apos;s status (to do, doing, done)</option>
                    <option value="notes">Just a note on each task</option>
                  </select>
                </div>
              )}
              {(mapping.includes("due") || mapping.includes("start")) && (
                <div>
                  <label className={LABEL} htmlFor="ip-ord">Dates like 03/04/2026 mean</label>
                  <select id="ip-ord" className={FIELD} value={order} onChange={(e) => setOrderPick(e.target.value as DateOrder)}>
                    <option value="mdy">March 4 (month first)</option>
                    <option value="dmy">April 3 (day first)</option>
                  </select>
                </div>
              )}
            </div>

            {built.statusValues.length > 0 && (
              <div>
                <p className={LABEL}>Statuses in your file</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {built.statusValues.map((v) => {
                    const cur = statusMap[v] ?? mapStatus(v) ?? "backlog";
                    return (
                      <label key={v} className="flex items-center justify-between gap-2 rounded-lg border border-[#1a2b4a]/10 bg-white px-3 py-1.5 text-xs dark:bg-[#1a2b4a]/20">
                        <span className="truncate font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{v}</span>
                        <select aria-label={`Status for ${v}`} className="rounded-md border border-[#1a2b4a]/15 bg-white px-2 py-1 text-xs dark:bg-[#1a2b4a]/30" value={cur} onChange={(e) => setStatusMap((s) => ({ ...s, [v]: e.target.value as TaskStatus }))}>
                          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <p className={LABEL}>First tasks as they will arrive</p>
              <ul className="space-y-1">
                {built.tasks.slice(0, 6).map((t) => (
                  <li key={t.row} className="rounded-lg border border-[#1a2b4a]/10 bg-white px-3 py-2 text-xs dark:bg-[#1a2b4a]/20">
                    <span className="font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{t.title}</span>
                    <span className="ml-2 rounded-full bg-[#1a2b4a]/8 px-2 py-0.5 text-[10px]">{STATUS_LABEL[t.status]}</span>
                    {t.dueDay && <span className="ml-2 text-[#7a8a99]">due {previewDates(t.dueDay)}</span>}
                    {t.section && <span className="ml-2 text-[#7a8a99]">· {t.section}</span>}
                  </li>
                ))}
              </ul>
            </div>

            {(built.skipped.length > 0 || built.unreadableDates > 0 || built.assignees.length > 0 || !hasTitle) && (
              <div role="status" className="space-y-1 rounded-lg bg-[#c9a227]/15 p-3 text-xs text-[#1a2b4a] dark:text-[#F8F5F0]">
                {!hasTitle && <p className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Choose which column is the task name.</p>}
                {built.skipped.length > 0 && <p>{built.skipped.length} row{built.skipped.length === 1 ? " has" : "s have"} no task name and will be left out.</p>}
                {built.unreadableDates > 0 && <p>{built.unreadableDates} date{built.unreadableDates === 1 ? " is" : "s are"} in a format I can&apos;t read. Those tasks arrive without that date (try the day/month setting above).</p>}
                {built.assignees.length > 0 && <p>{built.assignees.length} person{built.assignees.length === 1 ? " is" : " people are"} named on tasks. Anyone on your team is matched by name or email; the rest is kept as a note on the task.</p>}
              </div>
            )}
            {err && <p role="alert" className="text-sm text-[#8a2f2f]">{err}</p>}
            <div className="flex flex-wrap gap-2">
              <button onClick={doImport} disabled={!hasTitle || !built.tasks.length || !name.trim()} className="rounded-lg bg-[#1a2b4a] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">Import {built.tasks.length} task{built.tasks.length === 1 ? "" : "s"}</button>
              <button onClick={() => { setStep("choose"); setTable(null); }} className="rounded-lg border border-[#1a2b4a]/20 px-4 py-2 text-sm text-[#1a2b4a] dark:text-[#F8F5F0]">Back</button>
            </div>
          </div>
        )}

        {step === "importing" && <p className="py-10 text-center text-sm text-[#7a8a99]">Importing your project…</p>}

        {step === "done" && result && (
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-10 w-10 text-[#2E7C83]" />
            <p className="text-lg font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">Your project is in</p>
            <p className="mt-1 text-sm text-[#7a8a99]">
              {result.tasks} task{result.tasks === 1 ? "" : "s"} imported{result.milestones ? `, ${result.milestones} milestone${result.milestones === 1 ? "" : "s"}` : ""}
              {result.assigned ? `, ${result.assigned} assigned to your team` : ""}.
            </p>
            {result.unmatched.length > 0 && <p className="mx-auto mt-2 max-w-md text-xs text-[#7a8a99]">Not on your team, so kept as a note on the task: {result.unmatched.slice(0, 8).join(", ")}{result.unmatched.length > 8 ? "…" : ""}</p>}
            <button onClick={() => router.push(`/projects/${result.id}`)} className="mt-4 rounded-lg bg-[#1a2b4a] px-5 py-2 text-sm font-semibold text-white">Open the project</button>
          </div>
        )}
        {step === "choose" && err && <p role="alert" className="mt-3 text-sm text-[#8a2f2f]">{err}</p>}
      </div>
    </div>
  );
}
