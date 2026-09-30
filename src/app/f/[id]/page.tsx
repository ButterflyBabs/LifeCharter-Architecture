"use client";

import { useEffect, useState } from "react";

// Public hosted page for any Suite form: lccommandsuite.com/f/<form id>.
interface Field {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
}
interface Form {
  submit_label?: string | null;
  id: string;
  name: string;
  description: string | null;
  fields: Field[];
}

const box = "mt-1.5 w-full rounded-xl border border-[#EADFCF] bg-white px-4 py-3 text-[15px] text-[#1F2B3A] outline-none focus:border-[#2E7C83] focus:ring-2 focus:ring-[#2E7C83]/20";

export default function HostedForm({ params }: { params: { id: string } }) {
  const [form, setForm] = useState<Form | null | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/forms/${params.id}`)
      .then((r) => r.json())
      .then((d) => setForm(d.form ?? null))
      .catch(() => setForm(null));
  }, [params.id]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setErr("");
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    const r = await fetch(`/api/forms/${params.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, _tz: Intl.DateTimeFormat().resolvedOptions().timeZone, _page: window.location.href, _ref: new URLSearchParams(window.location.search).get("ref") || undefined }),
    });
    const d = await r.json().catch(() => ({}));
    setSending(false);
    if (r.ok) setDone(d.message || "Thank you!");
    else setErr(d.error || "Something went wrong. Please try again.");
  }

  return (
    <main className="min-h-screen bg-[#FBF8F1] px-4 py-10">
      <div className="mx-auto max-w-xl rounded-2xl border border-[#EADFCF] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-8">
        {form === undefined && <p className="text-[#56616E]">Loading…</p>}
        {form === null && <p className="text-[#56616E]">This form isn&rsquo;t available.</p>}
        {form && done && (
          <>
            <h1 className="text-2xl font-semibold text-[#1F3A3D]">Thank you!</h1>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-[#56616E]">{done}</p>
          </>
        )}
        {form && !done && (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold text-[#1F3A3D]">{form.name}</h1>
              {form.description && <p className="mt-1 text-[#56616E]">{form.description}</p>}
            </div>
            {form.fields.map((f) => (
              <label key={f.name} className="block text-sm font-medium text-[#1F2B3A]">
                {f.label}
                {f.required && <span className="text-[#C76F56]"> *</span>}
                {f.type === "textarea" ? (
                  <textarea name={f.name} required={f.required} rows={5} className={box} />
                ) : f.options?.length ? (
                  <select name={f.name} required={f.required} defaultValue="" className={box}>
                    <option value="" disabled>
                      Choose one
                    </option>
                    {f.options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input name={f.name} type={f.type || "text"} required={f.required} className={box} />
                )}
              </label>
            ))}
            <input name="_hp" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            {err && <p className="text-sm text-[#8a2f2f]">{err}</p>}
            <button disabled={sending} className="w-full rounded-full bg-[#2E7C83] px-6 py-3 font-semibold text-white hover:bg-[#256b71] disabled:opacity-60">
              {sending ? "Sending…" : form.submit_label || "Send"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
