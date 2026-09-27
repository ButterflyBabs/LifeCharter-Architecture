"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Compass } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

type Status = { available: number; imported: boolean; answers: { key: string }[] };

// Fourth Alignment Profile card, shown only to clients who did The Command Shift (21-Day Challenge).
export function CommandShiftCard() {
  const [s, setS] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/command-shift", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setS)
      .catch(() => {});
  }, []);

  if (!s || (!s.available && !s.imported)) return null;

  return (
    <Card className="border-[#c9a227]/20 hover:border-[#c9a227]/50 transition-all duration-300 hover:shadow-lg flex flex-col">
      <CardHeader>
        <div className="w-12 h-12 rounded-lg bg-[#1a2b4a]/10 flex items-center justify-center mb-4">
          <Compass className="w-6 h-6 text-[#1a2b4a] dark:text-[#e8e4f0]" />
        </div>
        <CardTitle className="text-xl">Command Shift</CardTitle>
        <p className="text-sm text-[#1a2b4a] dark:text-[#e8e4f0]">Your 21-Day Challenge work</p>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <p className="text-[#1a2b4a]/70 dark:text-[#F8F5F0]/70 text-sm">
          The mission line, True North, offer, brand voice, positioning and more that you wrote during The Command Shift. Your assistant and your plan drafts build on them.
        </p>
        <p className="text-xs text-[#b8a898]">
          {s.imported ? `${s.answers.length} answers in your profile` : `${s.available} answers ready to bring in`}
        </p>
        {msg && <p className="text-sm text-[#2E7C83]">{msg}</p>}
        <div className="mt-auto pt-4">
          {s.imported ? (
            <Link href="/assessments/command-shift">
              <Button variant="primary" className="w-full">
                View and edit
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          ) : (
            <Button
              variant="primary"
              className="w-full"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setMsg("");
                const res = await fetch("/api/command-shift", { method: "POST" });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  setMsg(data.error || "That didn't work. Please try again.");
                  setBusy(false);
                  return;
                }
                window.location.href = "/assessments/command-shift?imported=1";
              }}
            >
              {busy ? "Bringing it in…" : "Bring in my Command Shift work"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
