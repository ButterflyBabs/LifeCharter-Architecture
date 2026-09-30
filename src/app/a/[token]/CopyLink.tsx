"use client";

import { useState } from "react";

export default function CopyLink({ link }: { link: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <code className="rounded-lg bg-[#FBF8F1] px-3 py-2 text-sm text-[#1F3A3D] break-all">{link}</code>
      <button
        onClick={() => navigator.clipboard.writeText(link).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); })}
        className="rounded-full bg-[#2E7C83] px-4 py-2 text-sm font-semibold text-white"
      >
        {done ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
