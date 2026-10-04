"use client";

import { useEffect, type RefObject } from "react";

// Lets cards of different heights pack together with no dead space. The grid uses short fixed rows
// (see .masonry-grid in globals.css) and every card spans as many rows as its own height needs, so a
// short card slides up under a short card instead of waiting for the tall card beside it.
export function useMasonry(ref: RefObject<HTMLElement | null>, gapPx: number, unitPx = 8) {
  useEffect(() => {
    const grid = ref.current;
    if (!grid) return;
    const sync = () => {
      for (const el of Array.from(grid.children) as HTMLElement[]) {
        const h = el.getBoundingClientRect().height;
        el.style.gridRowEnd = `span ${Math.max(1, Math.ceil((h + gapPx) / unitPx))}`;
      }
    };
    const resize = new ResizeObserver(sync);
    const watch = () => {
      resize.disconnect();
      for (const el of Array.from(grid.children)) resize.observe(el);
      sync();
    };
    const mutate = new MutationObserver(watch);
    mutate.observe(grid, { childList: true });
    watch();
    window.addEventListener("resize", sync);
    return () => {
      resize.disconnect();
      mutate.disconnect();
      window.removeEventListener("resize", sync);
    };
  }, [ref, gapPx, unitPx]);
}
