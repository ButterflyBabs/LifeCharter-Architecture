"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Compass, ArrowRight, X } from "lucide-react";

// First-run gate: sends brand-new clients to /setup, and shows a gentle banner
// to anyone who skipped it, until the required foundation (assessments + AI) is done.
export default function SetupGate() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let active = true;
    fetch("/api/setup/status")
      .then((r) => r.json())
      .then((d) => {
        if (!active || !d) return;
        if (d.bypass) return; // this account opted out of the setup gate
        if (d.requiredComplete) return; // fully set up — nothing to show
        let skipped = false;
        let entered = false;
        try {
          skipped = localStorage.getItem("lc_setup_skip") === "1";
          entered = localStorage.getItem("lc_setup_entered") === "1";
        } catch {
          /* ignore */
        }
        // Truly new (never skipped or entered): take them to setup first.
        if (!skipped && !entered) {
          router.push("/setup");
          return;
        }
        setShow(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [router]);

  if (!show || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-[#1a2b4a] to-[#7b6b8d] text-[#F8F5F0]">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <Compass className="w-5 h-5 text-[#c9a227] flex-shrink-0" />
        <p className="text-sm flex-1 min-w-0">
          Finish setting up your Command Suite — your assessments and AI are the foundation for everything.
        </p>
        <Link
          href="/setup"
          className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-[#c9a227] text-[#1a2b4a] hover:bg-[#d8b23f]"
        >
          Continue setup <ArrowRight className="w-4 h-4" />
        </Link>
        <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="flex-shrink-0 p-1 hover:bg-white/10 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
