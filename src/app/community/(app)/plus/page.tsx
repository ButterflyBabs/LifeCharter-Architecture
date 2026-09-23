"use client";

// Collective Plus — what it includes, pricing (with founding-member spots),
// checkout, and for members who have it: their plan, Mariposa allowance and
// billing management.
import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart3, BookOpen, CalendarCheck, Crown, FileDown, Sparkles, Sunrise, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCommunity } from "@/lib/community/context";
import { Badge, Button, Card, ErrorNote, Heading, PageLoading } from "@/components/community/ui";
import { resetJournalAiStatus } from "@/components/community/JournalAssist";

interface Status {
  foundingLeft: number;
  subscription: { status: string; plan: string; founding: boolean; currentPeriodEnd: string | null; cancelAtPeriodEnd: boolean; canManage: boolean } | null;
  plus: boolean;
  aiSource: "own" | "plus" | null;
  usage: { used: number; cap: number };
}

const FEATURES = [
  { icon: Sparkles, title: "Mariposa, your AI coach", body: "Sharpen your weekly intention, unpack your wins and draft your Friday reflection — right inside your journal." },
  { icon: Sunrise, title: "Sunday week-in-review", body: "Every Sunday, Mariposa reads your week and sends a short, personal review with a focus for the week ahead." },
  { icon: BarChart3, title: "Monthly alignment report", body: "Your balance across the areas of life, your alignment trend, and your wins — with Mariposa's take on the patterns." },
  { icon: BookOpen, title: "Ask the Library", body: "Ask Mariposa anything about LifeCharter's frameworks and resources, and get answers drawn from the Library." },
  { icon: Target, title: "Your 90-day focus", body: "Name one bigger goal. Your weekly intentions roll up into it, and Mariposa keeps you honest about progress." },
  { icon: FileDown, title: "Export your journal", body: "Download your whole journal as a clean, printable PDF — it's yours to keep." },
  { icon: Crown, title: "Plus badge", body: "A small gold mark on your profile and in the member directory." },
];

const money = (cents: number) => `$${(cents / 100).toFixed(cents % 100 ? 2 : 0)}`;

export default function PlusPage() {
  return (
    <Suspense>
      <Plus />
    </Suspense>
  );
}

function Plus() {
  const { refresh, isAdmin } = useCommunity();
  const params = useSearchParams();
  const [status, setStatus] = useState<Status | null>(null);
  const [plan, setPlan] = useState<"monthly" | "annual">("monthly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [welcome, setWelcome] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/community/plus/status").catch(() => null);
    if (r?.ok) setStatus(await r.json());
    else setLoadFailed(true);
  }, []);

  useEffect(() => {
    const sessionId = params.get("session_id");
    void (async () => {
      if (sessionId) {
        window.history.replaceState(null, "", "/community/plus");
        const r = await fetch("/api/community/plus/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (r.ok) {
          setWelcome(true);
          resetJournalAiStatus();
          await refresh();
        } else {
          setError((await r.json().catch(() => ({}))).error ?? "We couldn't confirm your payment yet — refresh in a minute.");
        }
      }
      await load();
    })();
  }, [params, load, refresh]);

  async function go(path: string, body?: unknown) {
    setBusy(true);
    setError(null);
    const r = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
    const j = await r.json().catch(() => ({}));
    if (j.url) {
      window.location.href = j.url;
      return;
    }
    setError(j.error ?? "Something went wrong — please try again.");
    setBusy(false);
  }

  if (!status) return loadFailed ? <ErrorNote>Collective Plus couldn&rsquo;t load — please refresh the page.</ErrorNote> : <PageLoading />;
  const founding = status.foundingLeft > 0;
  const monthly = founding ? 700 : 999;
  const annual = founding ? 7000 : 9900;
  const sub = status.subscription;
  const active = status.plus;

  return (
    <div className="space-y-6">
      {welcome && (
        <Card className="border-[#D4AF63] bg-[var(--cm-gold-soft)] p-5">
          <p className="font-display text-[22px] font-semibold text-[var(--cm-ink)]">Welcome to Collective Plus ✨</p>
          <p className="mt-1 text-[14.5px] text-[var(--cm-body)]">
            Mariposa is ready in your journal. Start by <Link href="/community/journal?new=intention" className="font-semibold underline">setting this week&rsquo;s intention</Link> and asking her to sharpen it.
          </p>
        </Card>
      )}

      <Heading sub="Mariposa, your LifeCharter AI coach — and the tools that turn your journal into momentum.">
        <span className="inline-flex items-center gap-2">
          Collective Plus {active && <Badge>Your plan</Badge>}
        </span>
      </Heading>

      {/* Current plan */}
      {active ? (
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--cm-gold-text)]">Your plan</p>
              <p className="mt-1 font-display text-[21px] font-semibold text-[var(--cm-ink)]">
                {sub?.plan === "comp" ? "Gifted by LifeCharter" : `${sub?.plan === "annual" ? "Annual" : "Monthly"}${sub?.founding ? " · Founding Member" : ""}`}
              </p>
              {sub?.currentPeriodEnd && sub.plan !== "comp" && (
                <p className="text-[13.5px] text-[var(--cm-muted-2)]">
                  {sub.cancelAtPeriodEnd ? "Ends" : "Renews"} {new Date(sub.currentPeriodEnd).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                  {sub.status === "past_due" && " · payment needs attention"}
                </p>
              )}
            </div>
            {sub?.canManage && (
              <Button variant="ghost" onClick={() => go("/api/community/plus/portal")} disabled={busy}>
                Manage billing
              </Button>
            )}
          </div>
          {status.aiSource === "plus" && (
            <div className="mt-4">
              <div className="flex justify-between text-[12.5px] text-[var(--cm-muted-2)]">
                <span>Mariposa this month</span>
                <span>
                  {status.usage.used} of {status.usage.cap}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--cm-fill)]">
                <div className="h-full rounded-full bg-[#D4AF63]" style={{ width: `${Math.min(100, (status.usage.used / status.usage.cap) * 100)}%` }} />
              </div>
            </div>
          )}
        </Card>
      ) : status.aiSource === "own" ? (
        <Card className="p-5">
          <p className="font-semibold text-[var(--cm-ink)]">Included with your Command Suite</p>
          <p className="mt-1 text-[14px] text-[var(--cm-muted-2)]">You already have every Plus feature, running on your own AI connection. Nothing to buy.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          {founding && (
            <div className="bg-[var(--cm-navy)] px-5 py-2.5 text-[13.5px] text-white">
              <span className="font-semibold text-[#E6C988]">Founding Member pricing</span> — {status.foundingLeft} of 100 spots left. Keep this price for as long as you stay.
            </div>
          )}
          <div className="p-5">
            <div className="inline-flex rounded-full bg-[var(--cm-fill)] p-1" role="radiogroup" aria-label="Billing">
              {(["monthly", "annual"] as const).map((p) => (
                <button
                  key={p}
                  role="radio"
                  aria-checked={plan === p}
                  onClick={() => setPlan(p)}
                  className={cn("rounded-full px-4 py-1.5 text-[13.5px] font-semibold transition", plan === p ? "bg-[var(--cm-surface)] text-[var(--cm-ink)] shadow" : "text-[var(--cm-muted-2)]")}
                >
                  {p === "monthly" ? "Monthly" : "Annual · 2 months free"}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-1">
              <p className="font-display text-[40px] font-semibold leading-none text-[var(--cm-ink)]">
                {money(plan === "monthly" ? monthly : annual)}
                <span className="text-[16px] font-normal text-[var(--cm-muted-2)]">/{plan === "monthly" ? "month" : "year"}</span>
              </p>
              {founding && <p className="pb-1 text-[14px] text-[var(--cm-muted)] line-through">{money(plan === "monthly" ? 999 : 9900)}</p>}
            </div>
            <Button variant="gold" className="mt-4 w-full sm:w-auto" onClick={() => go("/api/community/plus/checkout", { plan })} disabled={busy}>
              <Sparkles className="h-4 w-4" /> {busy ? "Opening checkout…" : "Join Collective Plus"}
            </Button>
            <p className="mt-2 text-[12.5px] text-[var(--cm-muted)]">Cancel anytime. Secure checkout by Stripe.</p>
          </div>
        </Card>
      )}
      <ErrorNote>{error}</ErrorNote>

      {/* What's included */}
      <section className="grid gap-3 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <Card key={f.title} className="flex gap-3 p-4">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--cm-gold-soft)] text-[var(--cm-gold-text)]">
              <f.icon className="h-[18px] w-[18px]" />
            </span>
            <div>
              <p className="font-semibold text-[var(--cm-ink)]">{f.title}</p>
              <p className="text-[13.5px] text-[var(--cm-muted-2)]">{f.body}</p>
            </div>
          </Card>
        ))}
      </section>

      <Card className="space-y-2 p-5 text-[13px] text-[var(--cm-muted-2)]">
        <p className="flex items-center gap-2 font-semibold text-[var(--cm-ink)]">
          <CalendarCheck className="h-4 w-4 text-[var(--cm-gold-text)]" /> Good to know
        </p>
        <p>
          <strong>Your privacy.</strong> Your journal stays private to you. When you ask Mariposa for help, the text involved is sent to OpenAI to write the answer. OpenAI does
          not use it to train its models, and nothing is shared with other members.
        </p>
        <p>
          <strong>Fair use.</strong> Plus includes up to 200 Mariposa requests a month — far more than a full week of journaling uses. The count resets on the 1st.
        </p>
        <p>
          <strong>Moving up to Command Suite?</strong> Your last month of Plus is credited toward it.
        </p>
        <p>
          <strong>Free membership stays free.</strong> Posting, conversations, messages, events and your journal are always included.
        </p>
      </Card>

      {isAdmin && (
        <p className="text-[12.5px] text-[var(--cm-muted)]">
          Admin: gift Plus to a member from <Link href="/community/admin" className="underline">Admin → Members</Link>.
        </p>
      )}
    </div>
  );
}
