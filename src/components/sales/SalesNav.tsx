"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// One Sales hub: the five sales pages, a tab apart from each other (they live in
// different sidebar sections, so this keeps them together).
const TABS = [
  { href: "/sales/pipeline", label: "Pipeline" },
  { href: "/daily-compass/sales-activities", label: "Sales Activities" },
  { href: "/daily-compass/scripts", label: "Scripts & Templates" },
  { href: "/sales/offers", label: "Offers & Packages" },
  { href: "/sales", label: "Sales Plan" },
];

export default function SalesNav({ className = "" }: { className?: string }) {
  const path = usePathname() || "";
  return (
    <nav aria-label="Sales" className={`flex flex-wrap gap-1.5 ${className}`}>
      <span className="mr-1 self-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c9a227]">Sales</span>
      {TABS.map((t) => {
        const on = path === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold ${on ? "border-[#1a2b4a] bg-[#1a2b4a] text-white" : "border-[#1a2b4a]/15 text-[#1a2b4a] hover:border-[#c9a227] dark:text-[#F8F5F0]"}`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
