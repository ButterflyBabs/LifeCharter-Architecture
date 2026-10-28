"use client";

import { useEffect, useState } from "react";
import type { Currency } from "@/lib/currency";

type State = { currency: Currency; canChoose: boolean };
let cached: State | null = null;
let pending: Promise<State> | null = null;
const listeners = new Set<(s: State) => void>();

function fetchState(): Promise<State> {
  if (!pending) {
    pending = fetch("/api/account/currency", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => ({ currency: d?.currency === "cad" ? "cad" : "usd", canChoose: Boolean(d?.canChoose) }) as State)
      .catch(() => ({ currency: "usd", canChoose: false }) as State)
      .then((s) => {
        cached = s;
        listeners.forEach((l) => l(s));
        return s;
      });
  }
  return pending;
}

/** Settings saved a new home currency: every page using the hook updates. */
export function setHomeCurrencyCache(currency: Currency) {
  cached = { currency, canChoose: cached?.canChoose ?? true };
  listeners.forEach((l) => l(cached as State));
}

/**
 * The account's home currency (USD until loaded) and whether the USD/CAD choices are shown. When canChoose is false
 * the account is USD-only, so pages hide every currency picker and look exactly as before.
 */
export function useHomeCurrency(): State {
  const [s, setS] = useState<State>(cached ?? { currency: "usd", canChoose: false });
  useEffect(() => {
    listeners.add(setS);
    if (cached) setS(cached);
    else void fetchState();
    return () => {
      listeners.delete(setS);
    };
  }, []);
  return s;
}
