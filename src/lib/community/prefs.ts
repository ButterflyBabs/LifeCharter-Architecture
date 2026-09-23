"use client";

// Per-device sidebar preferences for the Collective: which channel headings
// are folded, and (super admins only) whether to browse as a member. Kept in
// localStorage and synced across every mounted sidebar (desktop + phone
// drawer) with a window event. Purely a convenience — safe to lose.
import { useCallback, useEffect, useState } from "react";

const COLLAPSED_KEY = "cm-collapsed-channels";
const VIEW_KEY = "cm-view-as";
const EVENT = "cm-prefs-changed";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode — keep it for this page only */
  }
  window.dispatchEvent(new Event(EVENT));
}

function usePref<T>(key: string, fallback: T): [T, (v: T) => void, boolean] {
  const [value, setValue] = useState<T>(fallback);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const sync = () => setValue(read(key, fallback));
    sync();
    setLoaded(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback((v: T) => write(key, v), [key]);
  return [value, set, loaded];
}

// Folded channel headings. `null` = the member hasn't chosen yet, so the
// caller applies its defaults (Start Here folds once they've settled in).
export function useCollapsedChannels() {
  const [ids, setIds, loaded] = usePref<string[] | null>(COLLAPSED_KEY, null);
  const toggle = useCallback(
    (id: string, currentlyCollapsed: boolean, defaults: string[]) => {
      const base = ids ?? defaults;
      setIds(currentlyCollapsed ? base.filter((x) => x !== id) : Array.from(new Set([...base, id])));
    },
    [ids, setIds]
  );
  return { collapsed: ids, toggle, loaded };
}

export type ViewAs = "admin" | "member";

export function useViewAs(): [ViewAs, (v: ViewAs) => void] {
  const [v, set] = usePref<ViewAs>(VIEW_KEY, "member");
  return [v, set];
}
