"use client";

import { useEffect, useState } from "react";
import { guideCard } from "@/app/user-guide/guideStyles";

type Person = { key: string; name: string; email: string | null; team: boolean; required: boolean; track: string; passed: number; total: number; level: string; current: string | null; average: number | null; lastAt: string | null };
type Hard = { id: string; q: string; lesson: string; misses: number; tries: number };

const th = "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-[#5a6472] dark:text-[#b8c2cf]";
const td = "px-3 py-2 align-top text-sm text-[#1a2b4a] dark:text-[#F8F5F0]";

export default function AcademyPeople() {
  const [data, setData] = useState<{ rows: Person[]; hardest: Hard[]; allAccounts: boolean } | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetch("/api/academy?people=1", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true));
  }, []);
  if (failed) return <p className="mt-6 text-[#5a6472] dark:text-[#b8c2cf]">This list did not load. Refresh the page to try again.</p>;
  if (!data) return <p className="mt-6 text-[#5a6472] dark:text-[#b8c2cf]">Loading…</p>;
  return (
    <>
      <section className={`${guideCard} mt-6 overflow-x-auto`} aria-label="Who is where">
        {data.rows.length ? (
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-[#E6DDCB] dark:border-[#2F3B4A]">
                <th scope="col" className={th}>Person</th>
                <th scope="col" className={th}>Path</th>
                <th scope="col" className={th}>Now on</th>
                <th scope="col" className={th}>Passed</th>
                <th scope="col" className={th}>Average</th>
                <th scope="col" className={th}>Last active</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((p) => (
                <tr key={p.key} className="border-b border-[#E6DDCB] last:border-0 dark:border-[#2F3B4A]">
                  <td className={td}>
                    <span className="font-semibold">{p.name}</span>
                    {p.required && <span className="ml-2 rounded-full bg-[#c9a227]/15 px-2 py-0.5 text-xs">Required</span>}
                    {p.email && <span className="block text-xs text-[#5a6472] dark:text-[#b8c2cf]">{p.email}</span>}
                  </td>
                  <td className={td}>{p.track}</td>
                  <td className={td}>{p.level}{p.current ? <span className="block text-xs text-[#5a6472] dark:text-[#b8c2cf]">{p.current}</span> : null}</td>
                  <td className={td}>{p.passed} of {p.total}</td>
                  <td className={td}>{p.average === null ? "Not started" : `${p.average}%`}</td>
                  <td className={td}>{p.lastAt ? new Date(p.lastAt).toLocaleDateString() : "Not started"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="p-5 text-[#5a6472] dark:text-[#b8c2cf]">Nobody has started yet.</p>
        )}
      </section>

      <section className="mt-8" aria-labelledby="academy-hard">
        <h2 id="academy-hard" className="font-serif text-2xl font-bold text-[#1a2b4a] dark:text-[#F8F5F0]">Questions people miss most</h2>
        {data.hardest.length ? (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {data.hardest.map((h) => (
              <li key={h.id} className={`${guideCard} p-4`}>
                <span className="block font-semibold text-[#1a2b4a] dark:text-[#F8F5F0]">{h.q}</span>
                <span className="mt-1 block text-sm text-[#5a6472] dark:text-[#b8c2cf]">{h.lesson} · missed {h.misses} {h.misses === 1 ? "time" : "times"} in {h.tries} {h.tries === 1 ? "try" : "tries"}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[#5a6472] dark:text-[#b8c2cf]">Nothing yet. Missed questions show here once people take the quizzes.</p>
        )}
      </section>
    </>
  );
}
