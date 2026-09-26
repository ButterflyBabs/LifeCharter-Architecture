// Import a Social Planner export (the prototype's data) into ONE account.
//
//   node scripts/import-social-planner.mts --dir <export folder> --email <owner email>
//   node scripts/import-social-planner.mts --dir <export folder> --master-plan-id <uuid>
//
// Dry run by default: prints what it would do and writes nothing. To write,
// add BOTH:  --apply --confirm-project <project ref>
// (the ref must match NEXT_PUBLIC_SUPABASE_URL, so a run against a live
// project is always deliberate).
//
// --check validates the export and prints the summary without connecting to
// any database.
//
// Idempotent and re-runnable. By default it only adds what's missing, so
// edits made in the app are kept. --overwrite refreshes posts, goals, rules,
// offers, events and snapshots from the files.
//
// Reads from the export folder:
//   items/*.json            planned posts
//   settings/goals.json     weekly goals
//   settings/account.json   offers, events, content rules (optional)
//   audience/*.json         audience snapshots
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (from the
// environment or .env.local).

import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { inviteLevelOf, normalizeGoals, normalizeRules, PLATFORM_MAP, STATUSES } from "../src/lib/social/planner.ts";

/* ---------- args + env ---------- */
const argv = process.argv.slice(2);
const arg = (name: string) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const flag = (name: string) => argv.includes(`--${name}`);

const dir = arg("dir");
const email = arg("email");
const planIdArg = arg("master-plan-id");
const apply = flag("apply");
const overwrite = flag("overwrite");
const confirmProject = arg("confirm-project");
const checkOnly = flag("check");

function die(msg: string): never {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

if (!dir) die("Pass --dir <export folder>.");
if (!checkOnly && !email && !planIdArg) die("Pass --email <account owner email> or --master-plan-id <uuid>.");

function loadEnvFile(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

function connect() {
  loadEnvFile(path.resolve(".env.local"));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) die("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  const projectRef = new URL(url).hostname.split(".")[0];
  if (apply && confirmProject !== projectRef) {
    die(`--apply writes to Supabase project "${projectRef}". Add --confirm-project ${projectRef} to go ahead.`);
  }
  return { projectRef, db: createClient(url, key, { auth: { persistSession: false } }) };
}

/* ---------- read the export ---------- */
const readJson = (f: string) => JSON.parse(fs.readFileSync(f, "utf8"));
const itemsDir = path.join(dir, "items");
const items = fs.existsSync(itemsDir)
  ? fs.readdirSync(itemsDir).filter((f) => f.endsWith(".json")).map((f) => readJson(path.join(itemsDir, f)))
  : [];
const goalsFile = path.join(dir, "settings", "goals.json");
const goals = fs.existsSync(goalsFile) ? normalizeGoals(readJson(goalsFile).platforms) : {};
const accountFile = path.join(dir, "settings", "account.json");
const account = fs.existsSync(accountFile) ? readJson(accountFile) : {};
const audienceDir = path.join(dir, "audience");
const snapshots = fs.existsSync(audienceDir)
  ? fs.readdirSync(audienceDir).filter((f) => f.endsWith(".json")).map((f) => readJson(path.join(audienceDir, f)))
  : [];

/* ---------- validate ---------- */
const problems: string[] = [];
const ids = new Set<string>();
for (const it of items) {
  if (!it.id) problems.push(`item without id (${it.title})`);
  if (ids.has(it.id)) problems.push(`duplicate id ${it.id}`);
  ids.add(it.id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(it.date || "")) problems.push(`${it.id}: bad date ${it.date}`);
  if (!PLATFORM_MAP[it.platform]) problems.push(`${it.id}: unknown platform ${it.platform}`);
  if (!(STATUSES as string[]).includes(it.status)) problems.push(`${it.id}: unknown status ${it.status}`);
}
if (problems.length) die(`The export has problems:\n  ${problems.slice(0, 20).join("\n  ")}`);

/* ---------- find the account ---------- */
type Db = ReturnType<typeof createClient>;
async function resolvePlan(db: Db): Promise<{ id: string; name: string }> {
  if (planIdArg) {
    const { data, error } = await db.from("client_master_plans").select("id, client_name").eq("id", planIdArg).maybeSingle();
    if (error || !data) die(`No master plan ${planIdArg}${error ? `: ${error.message}` : ""}`);
    return { id: data.id, name: data.client_name };
  }
  const { data: prof, error: pErr } = await db.from("profiles").select("id").ilike("email", email!).maybeSingle();
  if (pErr || !prof) die(`No profile for ${email}${pErr ? `: ${pErr.message}` : ""}`);
  const { data: plans, error } = await db
    .from("client_master_plans")
    .select("id, client_name")
    .eq("user_id", prof.id)
    .order("created_at", { ascending: true });
  if (error || !plans?.length) die(`No master plan for ${email}${error ? `: ${error.message}` : ""}`);
  if (plans.length > 1) console.warn(`! ${email} has ${plans.length} master plans; using the oldest (${plans[0].id}).`);
  return { id: plans[0].id, name: plans[0].client_name };
}

async function chunked<T>(rows: T[], size: number, fn: (chunk: T[]) => Promise<void>) {
  for (let i = 0; i < rows.length; i += size) await fn(rows.slice(i, i + size));
}

function summary() {
  const byPlatform: Record<string, number> = {};
  items.forEach((i) => (byPlatform[i.platform] = (byPlatform[i.platform] || 0) + 1));
  const dates = items.map((i) => i.date).sort();
  console.log(`  Posts            : ${items.length} (${dates[0]} → ${dates[dates.length - 1]}) ${JSON.stringify(byPlatform)}`);
  console.log(`  Goals            : ${Object.keys(goals).length} platforms, ${Object.values(goals).flat().length} metrics`);
  console.log(`  Offers / events  : ${(account.offers || []).length} / ${(account.events || []).length}`);
  console.log(`  Rules            : ${account.rules ? "yes" : "no"}`);
  console.log(`  Audience         : ${snapshots.map((s) => s.date + (s.baseline ? " (benchmark)" : "")).join(", ") || "none"}`);
}

async function main() {
  if (checkOnly) {
    console.log("\nSocial Planner import — CHECK (export only, no database)");
    summary();
    console.log("\n✔ The export is valid.\n");
    return;
  }
  const { projectRef, db } = connect();
  const plan = await resolvePlan(db);
  const mpid = plan.id;
  const now = new Date().toISOString();

  console.log(`\nSocial Planner import — ${apply ? (overwrite ? "APPLY (overwrite)" : "APPLY (add missing only)") : "DRY RUN (nothing is written)"}`);
  console.log(`  Supabase project : ${projectRef}`);
  console.log(`  Account          : ${plan.name} (${mpid})`);
  summary();

  // What's already there?
  const { count: existingPosts } = await db.from("social_posts").select("id", { count: "exact", head: true }).eq("master_plan_id", mpid);
  const { data: existingSettings } = await db.from("social_settings").select("master_plan_id").eq("master_plan_id", mpid).maybeSingle();
  console.log(`  Already in account: ${existingPosts ?? 0} posts, settings ${existingSettings ? "present" : "absent"}`);

  if (!apply) {
    console.log(`\nDry run only. To write, add: --apply --confirm-project ${projectRef}${overwrite ? " --overwrite" : ""}\n`);
    return;
  }

  // 1. Settings (platforms, goals, rules).
  if (!existingSettings || overwrite) {
    const { error } = await db.from("social_settings").upsert(
      {
        master_plan_id: mpid,
        platforms: Object.keys(goals),
        goals,
        rules: normalizeRules(account.rules),
        setup_completed_at: now,
        updated_at: now,
      },
      { onConflict: "master_plan_id" }
    );
    if (error) die(`settings: ${error.message}`);
    console.log("✔ settings");
  } else console.log("• settings already present (kept; --overwrite to refresh)");

  // 2. Offers.
  const offers = (account.offers || []).map((o: Record<string, unknown>, i: number) => ({
    master_plan_id: mpid, key: o.key, name: o.name ?? "", link: o.link ?? "", kind: o.kind ?? "always-open", rules: o.rules ?? "", sort_order: i, updated_at: now,
  }));
  if (offers.length) {
    const { error } = await db.from("social_offers").upsert(offers, { onConflict: "master_plan_id,key", ignoreDuplicates: !overwrite });
    if (error) die(`offers: ${error.message}`);
    console.log(`✔ offers (${offers.length})`);
  }

  // 3. Events.
  const events = (account.events || []).map((e: Record<string, unknown>) => ({
    master_plan_id: mpid, offer_key: e.offerKey ?? null, title: e.title ?? "", event_date: e.date, start_time: e.startTime ?? null,
    timezone: e.timezone ?? "UTC", first_mention_on: e.firstMentionOn ?? null, notes: e.notes ?? "", updated_at: now,
  }));
  if (events.length) {
    const { error } = await db.from("social_events").upsert(events, { onConflict: "master_plan_id,offer_key,event_date", ignoreDuplicates: !overwrite });
    if (error) die(`events: ${error.message}`);
    console.log(`✔ events (${events.length})`);
  }

  // 4. Audience snapshots.
  const snaps = snapshots.map((s) => ({
    master_plan_id: mpid, snap_date: s.date, is_baseline: Boolean(s.baseline), metrics: s.values || {}, logged_at: s.logged || now, updated_at: now,
  }));
  if (snaps.length) {
    const { error } = await db.from("social_audience_snapshots").upsert(snaps, { onConflict: "master_plan_id,snap_date", ignoreDuplicates: !overwrite });
    if (error) die(`audience: ${error.message}`);
    console.log(`✔ audience snapshots (${snaps.length})`);
  }

  // 5. Posts.
  const rows = items.map((it) => ({
    master_plan_id: mpid,
    external_id: it.id,
    planned_date: it.date,
    platform: it.platform,
    format: it.format || "post",
    status: it.status,
    title: it.title || "",
    notes: it.notes || "",
    image_prompt: it.imagePrompt || "",
    link: it.link || "",
    series: it.series || "",
    invite_level: inviteLevelOf(it.notes || ""),
    updated_at: now,
  }));
  let done = 0;
  await chunked(rows, 200, async (chunk) => {
    const { error } = await db.from("social_posts").upsert(chunk, { onConflict: "master_plan_id,external_id", ignoreDuplicates: !overwrite });
    if (error) die(`posts: ${error.message}`);
    done += chunk.length;
  });
  const { count: after } = await db.from("social_posts").select("id", { count: "exact", head: true }).eq("master_plan_id", mpid).not("external_id", "is", null);
  console.log(`✔ posts (${done} sent; ${after} imported posts now in the account)`);
  console.log("\nDone.\n");
}

main().catch((e) => die(e instanceof Error ? e.message : String(e)));
