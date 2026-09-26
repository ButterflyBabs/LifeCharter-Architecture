"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { fmtDate, todayYmd, type Offer, type SocialEvent } from "@/lib/social/planner";
import type { SocialPlannerApi } from "./useSocialPlanner";
import { cx } from "./ui";

const KINDS: { id: Offer["kind"]; label: string; hint: string }[] = [
  { id: "always-open", label: "Open any day", hint: "People can join or buy whenever they like." },
  { id: "event", label: "Dated event", hint: "Happens on set dates; add them below." },
  { id: "invite-only", label: "Invite-only", hint: "People request an invitation or code." },
  { id: "private", label: "No public link", hint: "Only reached through another offer." },
];

const COMMON_TIMEZONES = ["America/Los_Angeles", "America/Denver", "America/Phoenix", "America/Chicago", "America/New_York", "Europe/London", "Australia/Sydney", "UTC"];
const localTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

// The account's offers (doorways) and dated events. The Phase 3 writer reads
// these to decide what a week can invite people to, and when.
export function OffersEditor({ offers, events, api, compact }: { offers: Offer[]; events: SocialEvent[]; api: SocialPlannerApi; compact?: boolean }) {
  const [newOffer, setNewOffer] = useState<Omit<Offer, "key"> | null>(null);
  const [newEvent, setNewEvent] = useState<SocialEvent | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);
  const today = todayYmd();
  const upcoming = events.filter((e) => e.date >= today);
  const past = events.filter((e) => e.date < today);
  const offerName = (k: string | null) => offers.find((o) => o.key === k)?.name || "";

  const blankEvent = (): SocialEvent => ({
    offerKey: offers.find((o) => o.kind === "event")?.key || null, title: "", date: today, startTime: null, timezone: localTimezone(), firstMentionOn: null, notes: "",
  });

  return (
    <div className="space-y-6">
      {!compact && (
        <div className="max-w-3xl">
          <p className={cx.eyebrow}>What your posts point to</p>
          <h2 className={cx.h2}>Offers &amp; events</h2>
          <p className={cx.body}>
            List each doorway into your work and how people reach it. Dated events carry a &ldquo;first mention&rdquo; date so nothing gets promoted too early.
          </p>
        </div>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={cx.h3}>Offers</h3>
          {!newOffer && (
            <button className={`${cx.btn} ${cx.secondary}`} onClick={() => setNewOffer({ name: "", link: "", kind: "always-open", rules: "" })}>
              <Plus className="h-3.5 w-3.5" /> Add offer
            </button>
          )}
        </div>
        {offers.length === 0 && !newOffer && <p className={cx.muted}>No offers yet. Add the programs, events, products or free resources your posts invite people to.</p>}
        {offers.map((o) => (
          <div key={o.id} className={`${cx.card} !p-4 space-y-2`}>
            <div className="grid gap-2 sm:grid-cols-[1.4fr_1fr_auto]">
              <input className={cx.input} defaultValue={o.name} aria-label="Offer name" onBlur={(e) => e.target.value !== o.name && api.offersApi("PATCH", { type: "offer", id: o.id, name: e.target.value })} />
              <select className={cx.input} value={o.kind} aria-label="How people join" onChange={(e) => api.offersApi("PATCH", { type: "offer", id: o.id, kind: e.target.value })}>
                {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
              {confirm === o.id ? (
                <button className={`${cx.btn} ${cx.danger}`} onClick={() => { setConfirm(null); api.offersApi("DELETE", { type: "offer", id: o.id }); }}>Remove?</button>
              ) : (
                <button className="rounded-lg p-2 hover:bg-[#0F1A38]/5" aria-label={`Remove ${o.name}`} onClick={() => setConfirm(o.id!)}><X className="h-4 w-4 text-[#64748B]" /></button>
              )}
            </div>
            <input className={cx.input} defaultValue={o.link} placeholder="Link (leave blank if there's no public link)" aria-label="Link" onBlur={(e) => e.target.value !== o.link && api.offersApi("PATCH", { type: "offer", id: o.id, link: e.target.value })} />
            <textarea rows={2} className={cx.input} defaultValue={o.rules} placeholder="How to talk about it, e.g. 'Free, 90 minutes on Zoom' or 'Invitations come from the Incubator'" aria-label="Notes and rules" onBlur={(e) => e.target.value !== o.rules && api.offersApi("PATCH", { type: "offer", id: o.id, rules: e.target.value })} />
          </div>
        ))}
        {newOffer && (
          <form
            className={`${cx.card} !p-4 space-y-2 border-[#D4AF63]`}
            onSubmit={async (e) => {
              e.preventDefault();
              await api.offersApi("POST", { type: "offer", ...newOffer, sortOrder: offers.length });
              setNewOffer(null);
            }}
          >
            <div className="grid gap-2 sm:grid-cols-[1.4fr_1fr]">
              <input className={cx.input} required autoFocus value={newOffer.name} placeholder="Offer name" aria-label="Offer name" onChange={(e) => setNewOffer({ ...newOffer, name: e.target.value })} />
              <select className={cx.input} value={newOffer.kind} aria-label="How people join" onChange={(e) => setNewOffer({ ...newOffer, kind: e.target.value as Offer["kind"] })}>
                {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
              </select>
            </div>
            <p className={cx.muted}>{KINDS.find((k) => k.id === newOffer.kind)?.hint}</p>
            <input className={cx.input} value={newOffer.link} placeholder="Link" aria-label="Link" onChange={(e) => setNewOffer({ ...newOffer, link: e.target.value })} />
            <textarea rows={2} className={cx.input} value={newOffer.rules} placeholder="How to talk about it" aria-label="Notes and rules" onChange={(e) => setNewOffer({ ...newOffer, rules: e.target.value })} />
            <div className="flex justify-end gap-2">
              <button type="button" className={`${cx.btn} ${cx.ghost}`} onClick={() => setNewOffer(null)}>Cancel</button>
              <button type="submit" className={`${cx.btn} ${cx.primary}`}>Add offer</button>
            </div>
          </form>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className={cx.h3}>Dated events</h3>
          {!newEvent && (
            <button className={`${cx.btn} ${cx.secondary}`} onClick={() => setNewEvent(blankEvent())}>
              <Plus className="h-3.5 w-3.5" /> Add event
            </button>
          )}
        </div>
        {newEvent && (
          <form
            className={`${cx.card} !p-4 space-y-2 border-[#D4AF63]`}
            onSubmit={async (e) => {
              e.preventDefault();
              await api.offersApi("POST", { type: "event", ...newEvent });
              setNewEvent(null);
            }}
          >
            <EventFields ev={newEvent} offers={offers} onChange={setNewEvent} />
            <div className="flex justify-end gap-2">
              <button type="button" className={`${cx.btn} ${cx.ghost}`} onClick={() => setNewEvent(null)}>Cancel</button>
              <button type="submit" className={`${cx.btn} ${cx.primary}`}>Add event</button>
            </div>
          </form>
        )}
        {upcoming.length === 0 && !newEvent && <p className={cx.muted}>No upcoming events.</p>}
        {upcoming.map((ev) => (
          <div key={ev.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#0F1A38]/10 bg-white px-4 py-3 dark:border-[#334060] dark:bg-[#1E2A48]">
            <div>
              <p className="text-sm font-medium text-[#0F1A38] dark:text-[#FAF8F3]">
                {ev.title || offerName(ev.offerKey) || "Event"} · {fmtDate(ev.date, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                {ev.startTime && <> · {ev.startTime} {ev.timezone.split("/").pop()?.replace("_", " ")}</>}
              </p>
              <p className={cx.muted}>
                {offerName(ev.offerKey) && ev.title && <>{offerName(ev.offerKey)} · </>}
                {ev.firstMentionOn ? <>First mention on {fmtDate(ev.firstMentionOn, { month: "short", day: "numeric" })}</> : "Can be mentioned any time"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date" className={`${cx.input} !w-auto !py-1 text-xs`} aria-label="First mention allowed on"
                title="First mention allowed on" defaultValue={ev.firstMentionOn || ""}
                onBlur={(e) => (e.target.value || null) !== ev.firstMentionOn && api.offersApi("PATCH", { type: "event", id: ev.id, firstMentionOn: e.target.value || null })}
              />
              {confirm === ev.id ? (
                <button className={`${cx.btn} ${cx.danger} !py-1`} onClick={() => { setConfirm(null); api.offersApi("DELETE", { type: "event", id: ev.id }); }}>Remove?</button>
              ) : (
                <button className="rounded-lg p-1.5 hover:bg-[#0F1A38]/5" aria-label="Remove event" onClick={() => setConfirm(ev.id!)}><X className="h-4 w-4 text-[#64748B]" /></button>
              )}
            </div>
          </div>
        ))}
        {past.length > 0 && (
          <button className="text-xs text-[#64748B] underline" onClick={() => setShowPast(!showPast)}>
            {showPast ? "Hide" : "Show"} {past.length} past {past.length === 1 ? "event" : "events"}
          </button>
        )}
        {showPast && past.map((ev) => (
          <p key={ev.id} className={cx.muted}>{ev.title || offerName(ev.offerKey)} · {fmtDate(ev.date, { month: "short", day: "numeric", year: "numeric" })}</p>
        ))}
      </section>
    </div>
  );
}

function EventFields({ ev, offers, onChange }: { ev: SocialEvent; offers: Offer[]; onChange: (e: SocialEvent) => void }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="block">
        <span className={cx.label}>Offer</span>
        <select className={cx.input} value={ev.offerKey || ""} onChange={(e) => onChange({ ...ev, offerKey: e.target.value || null })}>
          <option value="">(none)</option>
          {offers.map((o) => <option key={o.key} value={o.key}>{o.name}</option>)}
        </select>
      </label>
      <label className="block">
        <span className={cx.label}>Title (optional)</span>
        <input className={cx.input} value={ev.title} onChange={(e) => onChange({ ...ev, title: e.target.value })} placeholder="e.g. December session" />
      </label>
      <label className="block">
        <span className={cx.label}>Date</span>
        <input type="date" required className={cx.input} value={ev.date} onChange={(e) => onChange({ ...ev, date: e.target.value })} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className={cx.label}>Start time</span>
          <input type="time" className={cx.input} value={ev.startTime || ""} onChange={(e) => onChange({ ...ev, startTime: e.target.value || null })} />
        </label>
        <label className="block">
          <span className={cx.label}>Time zone</span>
          <select className={cx.input} value={ev.timezone} onChange={(e) => onChange({ ...ev, timezone: e.target.value })}>
            {Array.from(new Set([ev.timezone, localTimezone(), ...COMMON_TIMEZONES])).map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
      </div>
      <label className="block">
        <span className={cx.label}>First mention allowed on</span>
        <input type="date" className={cx.input} value={ev.firstMentionOn || ""} onChange={(e) => onChange({ ...ev, firstMentionOn: e.target.value || null })} />
      </label>
      <label className="block">
        <span className={cx.label}>Notes</span>
        <input className={cx.input} value={ev.notes} onChange={(e) => onChange({ ...ev, notes: e.target.value })} />
      </label>
    </div>
  );
}
