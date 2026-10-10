"use client";

import { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui/Input";

const cache: Record<string, string[] | undefined> = {};

/** A text box that suggests the categories this account already uses, so the same category is always spelled the same way. */
export function CategoryInput(props: {
  value: string;
  onChange: (v: string) => void;
  type?: "expense" | "income";
  placeholder?: string;
}) {
  const { value, onChange, type = "expense", placeholder } = props;
  const id = useId();
  const [list, setList] = useState<string[]>(cache[type] ?? []);
  useEffect(() => {
    if (cache[type]) return;
    let live = true;
    fetch(`/api/finance/categories?type=${type}`)
      .then((r) => r.json())
      .then((d) => {
        const cats: string[] = Array.isArray(d.categories) ? d.categories : [];
        cache[type] = cats;
        if (live) setList(cats);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [type]);
  return (
    <>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} list={id} autoComplete="off" />
      <datalist id={id}>
        {list.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </>
  );
}

/** Call after saving something with a new category so the suggestions include it next time. */
export function forgetCategories() {
  delete cache.expense;
  delete cache.income;
}
