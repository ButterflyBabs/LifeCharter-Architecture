"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CategoryInput } from "./CategoryInput";
import { MoneyInput } from "./MoneyInput";

type EditableEntry = { id: string; type: "income" | "expense"; amount: number; category: string; description: string; occurredOn: string; vendor?: string; source?: string };

/** Change a saved income or expense in place. Its receipt, tax and business stay as they are. */
export function EntryEditForm({ entry, onSaved, onCancel }: { entry: EditableEntry; onSaved: () => void; onCancel: () => void }) {
  const synced = entry.source === "stripe";
  const [amount, setAmount] = useState(String(entry.amount));
  const [category, setCategory] = useState(entry.category);
  const [occurredOn, setOccurredOn] = useState(entry.occurredOn);
  const [vendor, setVendor] = useState(entry.vendor ?? "");
  const [description, setDescription] = useState(entry.description);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const save = async () => {
    setSaving(true);
    setErr("");
    const body = { category, vendor, description, ...(synced ? {} : { amount, occurredOn }) };
    const r = await fetch(`/api/finance/entries/${entry.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const d = r ? await r.json().catch(() => ({})) : {};
    setSaving(false);
    if (!r || !r.ok) {
      setErr(d.error || "Couldn't save your changes.");
      return;
    }
    onSaved();
  };

  const label = "block text-xs font-medium text-[#5a6472] dark:text-[#b8c2cf]";
  return (
    <div className="my-2 rounded-lg border border-[#c9a227]/40 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>
          Amount
          <MoneyInput value={amount} onChange={setAmount} aria-label="Amount" disabled={synced} />
        </label>
        <div className={label}>
          Category
          <CategoryInput value={category} onChange={setCategory} type={entry.type} />
        </div>
        <label className={label}>
          Date
          <Input type="date" value={occurredOn} onChange={(e) => setOccurredOn(e.target.value)} disabled={synced} />
        </label>
        <label className={label}>
          {entry.type === "income" ? "From" : "Paid to"}
          <Input value={vendor} onChange={(e) => setVendor(e.target.value)} />
        </label>
        <label className={`${label} sm:col-span-2`}>
          Note
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
      </div>
      {synced && <p className="mt-2 text-xs text-[#5a6472] dark:text-[#b8c2cf]">This came from Stripe, so its amount and date stay as Stripe recorded them.</p>}
      {err && <p className="mt-2 text-sm text-[#A4523C]" role="alert">{err}</p>}
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => void save()} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        <Button size="sm" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
      </div>
    </div>
  );
}
