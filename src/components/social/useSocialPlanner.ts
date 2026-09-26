"use client";

import { useCallback, useEffect, useState } from "react";
import type { AudienceSnapshot, ContentRules, Goals, Offer, PlannedPost, SocialEvent, WeekDoc } from "@/lib/social/planner";

export interface PlannerSettings {
  setupDone: boolean;
  platforms: string[];
  goals: Goals;
  rules: ContentRules;
  offers: Offer[];
  events: SocialEvent[];
}

async function json<T>(res: Response): Promise<T> {
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((d as { error?: string }).error || `Request failed (${res.status})`);
  return d as T;
}

const send = (url: string, method: string, body?: unknown) =>
  fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });

// Everything the Social Planner and the Content Calendar read, in one place.
// `enabled` is null while checking, false when the planner isn't turned on
// for this account (the calendar then shows PostStream posts only).
export function useSocialPlanner() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<PlannerSettings | null>(null);
  const [posts, setPosts] = useState<PlannedPost[]>([]);
  const [weeks, setWeeks] = useState<Record<string, WeekDoc>>({});
  const [snapshots, setSnapshots] = useState<AudienceSnapshot[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  const reloadSettings = useCallback(async () => {
    setSettings(await json<PlannerSettings>(await fetch("/api/social/settings")));
  }, []);
  const reloadAudience = useCallback(async () => {
    const d = await json<{ snapshots: AudienceSnapshot[] }>(await fetch("/api/social/audience"));
    setSnapshots(d.snapshots);
  }, []);

  const load = useCallback(async () => {
    try {
      const a = await json<{ enabled: boolean }>(await fetch("/api/social/access"));
      setEnabled(a.enabled);
      if (!a.enabled) return;
      const [s, p, w, au] = await Promise.all([
        json<PlannerSettings>(await fetch("/api/social/settings")),
        json<{ posts: PlannedPost[] }>(await fetch("/api/social/posts")),
        json<{ weeks: WeekDoc[] }>(await fetch("/api/social/weeks")),
        json<{ snapshots: AudienceSnapshot[] }>(await fetch("/api/social/audience")),
      ]);
      setSettings(s);
      setPosts(p.posts);
      setWeeks(Object.fromEntries(w.weeks.map((x) => [x.weekStart, x])));
      setSnapshots(au.snapshots);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load the planner.");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const fail = (e: unknown) => setError(e instanceof Error ? e.message : "Couldn't save.");

  /* ---- posts ---- */
  const savePost = useCallback(async (id: string, patch: Partial<PlannedPost>) => {
    setPosts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    try {
      const d = await json<{ post: PlannedPost }>(await send("/api/social/posts", "PATCH", { id, ...patch }));
      setPosts((prev) => prev.map((p) => (p.id === id ? d.post : p)));
    } catch (e) {
      fail(e);
    }
  }, []);

  const addPost = useCallback(async (post: Partial<PlannedPost>) => {
    try {
      const d = await json<{ post: PlannedPost }>(await send("/api/social/posts", "POST", post));
      setPosts((prev) => [...prev, d.post]);
      return d.post;
    } catch (e) {
      fail(e);
      return null;
    }
  }, []);

  const deletePost = useCallback(async (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    try {
      await json(await send(`/api/social/posts?id=${encodeURIComponent(id)}`, "DELETE"));
    } catch (e) {
      fail(e);
    }
  }, []);

  /* ---- weeks ---- */
  const patchWeek = useCallback(async (body: unknown) => {
    try {
      const d = await json<{ week: WeekDoc }>(await send("/api/social/weeks", "PATCH", body));
      setWeeks((prev) => ({ ...prev, [d.week.weekStart]: d.week }));
    } catch (e) {
      fail(e);
    }
  }, []);

  const toggleHabit = useCallback(
    (weekStart: string, platform: string, metric: string, date: string, on: boolean) => {
      const k = `${platform}.${metric}`;
      setWeeks((prev) => {
        const w = prev[weekStart] || { weekStart, actuals: {}, habits: {}, notes: "" };
        const days = { ...(w.habits[k] || {}) };
        if (on) days[date] = true;
        else delete days[date];
        return { ...prev, [weekStart]: { ...w, habits: { ...w.habits, [k]: days } } };
      });
      return patchWeek({ habit: { platform, metric, date, on } });
    },
    [patchWeek]
  );

  const setActual = useCallback(
    (weekStart: string, platform: string, metric: string, value: number | null) => {
      setWeeks((prev) => {
        const w = prev[weekStart] || { weekStart, actuals: {}, habits: {}, notes: "" };
        return { ...prev, [weekStart]: { ...w, actuals: { ...w.actuals, [platform]: { ...(w.actuals[platform] || {}), [metric]: value } } } };
      });
      return patchWeek({ actual: { weekStart, platform, metric, value } });
    },
    [patchWeek]
  );

  const setWeekNotes = useCallback((weekStart: string, text: string) => patchWeek({ notes: { weekStart, text } }), [patchWeek]);

  /* ---- settings ---- */
  const saveSettings = useCallback(
    async (patch: { platforms?: string[]; goals?: Goals; rules?: ContentRules; completeSetup?: boolean }) => {
      setSettings((s) => (s ? { ...s, ...(patch.goals ? { goals: patch.goals } : {}), ...(patch.rules ? { rules: patch.rules } : {}), ...(patch.platforms ? { platforms: patch.platforms } : {}) } : s));
      try {
        await json(await send("/api/social/settings", "PUT", patch));
        await reloadSettings();
      } catch (e) {
        fail(e);
      }
    },
    [reloadSettings]
  );

  const offersApi = useCallback(
    async (method: "POST" | "PATCH" | "DELETE", body: Record<string, unknown>) => {
      try {
        if (method === "DELETE") await json(await send(`/api/social/offers?type=${body.type}&id=${encodeURIComponent(String(body.id))}`, "DELETE"));
        else await json(await send("/api/social/offers", method, body));
        await reloadSettings();
      } catch (e) {
        fail(e);
      }
    },
    [reloadSettings]
  );

  /* ---- audience ---- */
  const saveSnapshot = useCallback(
    async (snap: AudienceSnapshot) => {
      try {
        await json(await send("/api/social/audience", "PUT", snap));
        await reloadAudience();
      } catch (e) {
        fail(e);
      }
    },
    [reloadAudience]
  );
  const setBaseline = useCallback(
    async (date: string) => {
      try {
        await json(await send("/api/social/audience", "PATCH", { date }));
        await reloadAudience();
      } catch (e) {
        fail(e);
      }
    },
    [reloadAudience]
  );
  const deleteSnapshot = useCallback(
    async (date: string) => {
      try {
        await json(await send(`/api/social/audience?date=${date}`, "DELETE"));
        await reloadAudience();
      } catch (e) {
        fail(e);
      }
    },
    [reloadAudience]
  );

  return {
    enabled, loaded, error, setError, settings, posts, weeks, snapshots,
    savePost, addPost, deletePost, toggleHabit, setActual, setWeekNotes,
    saveSettings, offersApi, saveSnapshot, setBaseline, deleteSnapshot,
  };
}

export type SocialPlannerApi = ReturnType<typeof useSocialPlanner>;
