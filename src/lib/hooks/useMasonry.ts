"use client";

import { useEffect, type RefObject } from "react";

// Lets cards of different heights pack together with no dead space. The grid uses short fixed rows
// (see .masonry-grid in globals.css) and every card spans as many rows as its own height needs, so a
// short card slides up under a short card instead of waiting for the tall card beside it.
// Heights change as data loads and as cards open and close, so the spans are re-measured on resize,
// when cards are added or removed, and on a short timer as a safety net.
export function useMasonry(ref: RefObject<HTMLElement | null>, gapPx: number, unitPx = 8) {
  useEffect(() => {
    let grid: HTMLElement | null = null;
    let resize: ResizeObserver | null = null;
    let mutate: MutationObserver | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;

    const sync = () => {
      if (!grid) return;
      for (const el of Array.from(grid.children) as HTMLElement[]) {
        const span = `span ${Math.max(1, Math.ceil((el.getBoundingClientRect().height + gapPx) / unitPx))}`;
        if (el.style.gridRowEnd !== span) el.style.gridRowEnd = span;
      }
    };
    const watch = () => {
      if (!grid) return;
      resize?.disconnect();
      for (const el of Array.from(grid.children)) resize?.observe(el);
      sync();
    };
    // The grid may not exist yet on the first render (the page can show a loading state first).
    const start = () => {
      if (grid || !ref.current) return;
      grid = ref.current;
      resize = new ResizeObserver(sync);
      mutate = new MutationObserver(watch);
      mutate.observe(grid, { childList: true });
      watch();
    };
    start();
    timer = setInterval(() => {
      start();
      sync();
    }, 400);
    window.addEventListener("resize", sync);
    return () => {
      if (timer) clearInterval(timer);
      resize?.disconnect();
      mutate?.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [ref, gapPx, unitPx]);
}
