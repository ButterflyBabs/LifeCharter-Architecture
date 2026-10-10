"use client";

import { useCallback, useEffect, useState } from "react";
import type { FinanceOverview } from "@/lib/finance/overview";

const tz = () =>
  (typeof window !== "undefined" && (localStorage.getItem("userTimezone") || Intl.DateTimeFormat().resolvedOptions().timeZone)) || "UTC";

/** What the Finance cards know about each other (month totals, budget left after bills, bills due, tax set-aside, software spend). */
export function useFinanceOverview() {
  const [data, setData] = useState<FinanceOverview | null>(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/finance/overview?tz=${encodeURIComponent(tz())}`, { cache: "no-store" });
      const d = await r.json().catch(() => null);
      if (d && !d.error) setData(d as FinanceOverview);
    } catch {
      /* the page still works without the connected facts */
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return { overview: data, reload: load };
}
