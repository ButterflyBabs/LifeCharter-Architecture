"use client";

import { useEffect, useState } from "react";

interface Domain {
  id: string;
  code: string;
  name: string;
  description: string | null;
  display_order: number;
}
interface Finding {
  id: string;
  severity: string;
  finding: string;
  domain: string | null;
  created_at: string;
}
interface Role {
  id: string;
  name: string;
  description: string | null;
  is_system: boolean;
}
interface Permission {
  id: string;
  code: string;
  resource: string;
  action: string;
  description: string | null;
}
interface CommandData {
  configured: boolean;
  domains?: Domain[];
  findings?: Finding[];
  roles?: Role[];
  permissions?: Permission[];
  error?: string;
}

const SEVERITY_COLOR: Record<string, string> = {
  healthy: "#2E7C83",
  ok: "#2E7C83",
  on_track: "#2E7C83",
  needs_attention: "#c9a227",
  attention: "#c9a227",
  at_risk: "#D83A34",
  critical: "#D83A34",
};

function sevColor(s: string) {
  return SEVERITY_COLOR[s] ?? "#7b6b8d";
}

export default function CommandCenterPage() {
  const [data, setData] = useState<CommandData | null>(null);

  useEffect(() => {
    fetch("/api/command-center")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d ?? { configured: false }))
      .catch(() => setData({ configured: false }));
  }, []);

  const findingByDomain = new Map<string, Finding>();
  (data?.findings ?? []).forEach((f) => {
    if (f.domain && !findingByDomain.has(f.domain)) findingByDomain.set(f.domain, f);
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-4xl lg:text-5xl font-serif font-bold text-[#1a2b4a] dark:text-[#F8F5F0] mb-1">
          Command Center
        </h1>
        <p className="text-[#7b6b8d] dark:text-[#e8e4f0]">
          Live from the LifeCharter Command Dashboard backend — the 12 business command domains,
          audit findings, and role-based access model.
        </p>
      </div>

      {data === null ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : !data.configured ? (
        <div className="bg-white dark:bg-[#1A1A2E] rounded-2xl border border-[#c9a227]/30 shadow-sm p-6">
          <h2 className="font-serif text-lg text-[#1a2b4a] dark:text-[#F8F5F0] mb-2">
            Connect the Command Dashboard backend
          </h2>
          <p className="text-sm text-[#3F4654] dark:text-[#e8e4f0] mb-3">
            Add these environment variables in Vercel (Production + Preview), then redeploy:
          </p>
          <pre className="text-xs bg-[#F8F5F0] dark:bg-black/30 rounded-lg p-3 overflow-x-auto text-[#1a2b4a] dark:text-[#e8e4f0]">
{`COMMAND_SUPABASE_URL=https://itxfgxmdyqpcytmgdysa.supabase.co
COMMAND_SUPABASE_SERVICE_ROLE_KEY=<service_role key from that project's Settings → API>`}
          </pre>
        </div>
      ) : (
        <div className="space-y-10">
          {/* 12 Business Command Domains */}
          <section>
            <h2 className="text-2xl font-serif font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-4">
              12 Business Command Domains
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data.domains ?? []).map((d) => {
                const finding = findingByDomain.get(d.name);
                return (
                  <div
                    key={d.id}
                    className="bg-white dark:bg-[#1A1A2E] rounded-2xl border border-gray-200/60 dark:border-[#c9a227]/20 shadow-sm p-5"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{d.name}</h3>
                      {finding && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white flex-shrink-0"
                          style={{ backgroundColor: sevColor(finding.severity) }}
                        >
                          {finding.severity.replace(/_/g, " ")}
                        </span>
                      )}
                    </div>
                    {d.description && (
                      <p className="text-xs text-[#7C7C82] leading-relaxed">{d.description}</p>
                    )}
                    {finding && (
                      <p className="text-xs text-[#3F4654] dark:text-[#e8e4f0] mt-2 border-t border-gray-100 dark:border-white/10 pt-2">
                        {finding.finding}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* RBAC */}
          <section>
            <h2 className="text-2xl font-serif font-semibold text-[#1a2b4a] dark:text-[#F8F5F0] mb-4">
              Roles &amp; Access ({(data.roles ?? []).length} roles · {(data.permissions ?? []).length} permissions)
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#1A1A2E] rounded-2xl border border-gray-200/60 dark:border-[#c9a227]/20 shadow-sm p-5">
                <h3 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-3">Roles</h3>
                <ul className="space-y-2">
                  {(data.roles ?? []).map((r) => (
                    <li key={r.id} className="text-sm">
                      <span className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0]">{r.name}</span>
                      {r.description && <span className="text-[#7C7C82]"> — {r.description}</span>}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-white dark:bg-[#1A1A2E] rounded-2xl border border-gray-200/60 dark:border-[#c9a227]/20 shadow-sm p-5">
                <h3 className="font-medium text-[#1a2b4a] dark:text-[#F8F5F0] mb-3">Permissions</h3>
                <ul className="space-y-1.5">
                  {(data.permissions ?? []).map((p) => (
                    <li key={p.id} className="text-xs">
                      <code className="text-[#2E7C83]">{p.code}</code>
                      {p.description && <span className="text-[#7C7C82]"> — {p.description}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
