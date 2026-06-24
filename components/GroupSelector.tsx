"use client";

import { useStore } from "@/lib/store";

// Sélecteur du groupe actif, partagé entre les pages.
export function GroupSelector() {
  const { data, selectedGroupId, setSelectedGroupId } = useStore();

  if (data.groups.length === 0) return null;

  return (
    <div className="mb-5">
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
        Groupe
      </label>
      <select
        value={selectedGroupId ?? ""}
        onChange={(e) => setSelectedGroupId(e.target.value || null)}
        className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-white focus:border-emerald-500 focus:outline-none"
      >
        {data.groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name} — {g.sport}
          </option>
        ))}
      </select>
    </div>
  );
}
