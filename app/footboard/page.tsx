"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Button, EmptyState, Modal, PageHeader } from "@/components/ui";
import { GroupSelector } from "@/components/GroupSelector";
import type { Member } from "@/lib/types";

type Slot = { id: string; label: string; x: number; y: number };

const FORMATIONS: Record<string, Slot[]> = {
  "4-3-3": [
    { id: "gk", label: "G", x: 50, y: 90 },
    { id: "d1", label: "DG", x: 16, y: 70 },
    { id: "d2", label: "DC", x: 38, y: 72 },
    { id: "d3", label: "DC", x: 62, y: 72 },
    { id: "d4", label: "DD", x: 84, y: 70 },
    { id: "m1", label: "MI", x: 27, y: 48 },
    { id: "m2", label: "MC", x: 50, y: 50 },
    { id: "m3", label: "MI", x: 73, y: 48 },
    { id: "a1", label: "AG", x: 22, y: 24 },
    { id: "a2", label: "BU", x: 50, y: 20 },
    { id: "a3", label: "AD", x: 78, y: 24 },
  ],
  "4-4-2": [
    { id: "gk", label: "G", x: 50, y: 90 },
    { id: "d1", label: "DG", x: 16, y: 70 },
    { id: "d2", label: "DC", x: 38, y: 72 },
    { id: "d3", label: "DC", x: 62, y: 72 },
    { id: "d4", label: "DD", x: 84, y: 70 },
    { id: "m1", label: "MG", x: 16, y: 47 },
    { id: "m2", label: "MC", x: 38, y: 49 },
    { id: "m3", label: "MC", x: 62, y: 49 },
    { id: "m4", label: "MD", x: 84, y: 47 },
    { id: "a1", label: "BU", x: 36, y: 22 },
    { id: "a2", label: "BU", x: 64, y: 22 },
  ],
  "3-5-2": [
    { id: "gk", label: "G", x: 50, y: 90 },
    { id: "d1", label: "DC", x: 26, y: 72 },
    { id: "d2", label: "DC", x: 50, y: 73 },
    { id: "d3", label: "DC", x: 74, y: 72 },
    { id: "m1", label: "MG", x: 12, y: 48 },
    { id: "m2", label: "MC", x: 32, y: 50 },
    { id: "m3", label: "MC", x: 50, y: 51 },
    { id: "m4", label: "MC", x: 68, y: 50 },
    { id: "m5", label: "MD", x: 88, y: 48 },
    { id: "a1", label: "BU", x: 36, y: 23 },
    { id: "a2", label: "BU", x: 64, y: 23 },
  ],
};

export default function FootboardPage() {
  const { data, ready, selectedGroupId, setLineup } = useStore();
  const [pickSlot, setPickSlot] = useState<string | null>(null);

  const members = useMemo(
    () => data.members.filter((m) => m.groupId === selectedGroupId),
    [data.members, selectedGroupId]
  );

  const lineup =
    (selectedGroupId && data.lineups[selectedGroupId]) || {
      formation: "4-3-3",
      spots: {} as Record<string, string>,
    };
  const slots = FORMATIONS[lineup.formation] ?? FORMATIONS["4-3-3"];

  if (!ready) return <p className="text-slate-400">Chargement…</p>;

  if (data.groups.length === 0) {
    return (
      <div>
        <PageHeader title="Footboard" />
        <EmptyState
          title="Aucun groupe"
          description="Créez d'abord une équipe depuis l'accueil."
        />
      </div>
    );
  }

  const memberById = (id?: string) =>
    members.find((m) => m.id === id);

  function setFormation(f: string) {
    if (!selectedGroupId) return;
    // On garde les joueurs dont l'emplacement existe encore.
    const valid = new Set(FORMATIONS[f].map((s) => s.id));
    const spots: Record<string, string> = {};
    for (const [k, v] of Object.entries(lineup.spots)) {
      if (valid.has(k)) spots[k] = v;
    }
    setLineup(selectedGroupId, { formation: f, spots });
  }

  function assign(slotId: string, memberId: string | null) {
    if (!selectedGroupId) return;
    const spots = { ...lineup.spots };
    // Un joueur ne peut occuper qu'un seul poste.
    for (const k of Object.keys(spots)) {
      if (spots[k] === memberId) delete spots[k];
    }
    if (memberId) spots[slotId] = memberId;
    else delete spots[slotId];
    setLineup(selectedGroupId, { formation: lineup.formation, spots });
    setPickSlot(null);
  }

  const assignedCount = Object.keys(lineup.spots).length;
  const available = members.filter(
    (m) => !Object.values(lineup.spots).includes(m.id)
  );

  return (
    <div>
      <Link
        href="/"
        className="text-sm font-medium text-[#f5188c] hover:underline"
      >
        ← Tableau de bord
      </Link>

      <PageHeader
        title="Footboard"
        subtitle={`${assignedCount}/${slots.length} joueurs placés`}
      />

      <GroupSelector />

      <div className="mb-4 flex gap-2">
        {Object.keys(FORMATIONS).map((f) => (
          <button
            key={f}
            onClick={() => setFormation(f)}
            className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition-all duration-150 active:scale-95 ${
              lineup.formation === f
                ? "border-[#f5188c] bg-[#f5188c]/15 text-[#ff7ac0]"
                : "border-[#2e2444] bg-[#241a3a] text-slate-400 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Terrain */}
      <div
        className="relative mx-auto aspect-[2/3] w-full max-w-sm overflow-hidden rounded-2xl border border-[#2a2040]"
        style={{
          background:
            "linear-gradient(180deg, #123524 0%, #0d2a1c 100%)",
        }}
      >
        {/* Lignes du terrain */}
        <div className="pointer-events-none absolute inset-3 rounded-lg border border-white/20" />
        <div className="pointer-events-none absolute left-3 right-3 top-1/2 h-px bg-white/20" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
        <div className="pointer-events-none absolute bottom-3 left-1/2 h-12 w-28 -translate-x-1/2 border border-white/20" />
        <div className="pointer-events-none absolute left-1/2 top-3 h-12 w-28 -translate-x-1/2 border border-white/20" />

        {slots.map((slot) => {
          const member = memberById(lineup.spots[slot.id]);
          return (
            <button
              key={slot.id}
              onClick={() => setPickSlot(slot.id)}
              className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shadow-lg transition-transform active:scale-90 ${
                  member
                    ? "bg-[#f5188c] text-white shadow-[0_0_12px_rgba(245,24,140,0.6)]"
                    : "border-2 border-dashed border-white/40 bg-black/30 text-white/60"
                }`}
              >
                {member
                  ? member.jerseyNumber ||
                    `${member.firstName[0]}${member.lastName[0]}`
                  : slot.label}
              </span>
              {member && (
                <span className="max-w-[64px] truncate rounded bg-black/50 px-1 text-[10px] text-white">
                  {member.lastName}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-slate-500">
        Touchez un poste pour y placer un joueur.
      </p>

      {/* Sélecteur de joueur */}
      <Modal
        open={pickSlot !== null}
        onClose={() => setPickSlot(null)}
        title="Choisir un joueur"
      >
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {pickSlot && lineup.spots[pickSlot] && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => assign(pickSlot, null)}
            >
              Retirer du poste
            </Button>
          )}
          {available.length === 0 && !pickSlot ? null : null}
          {available.map((m: Member) => (
            <button
              key={m.id}
              onClick={() => pickSlot && assign(pickSlot, m.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-[#2e2444] bg-[#241a3a] p-3 text-left transition-colors hover:border-[#3a2e55]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1a1230] text-sm font-bold text-slate-200">
                {m.jerseyNumber || `${m.firstName[0]}${m.lastName[0]}`}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-white">
                  {m.firstName} {m.lastName}
                </span>
                {m.position && (
                  <span className="block text-xs text-slate-400">
                    {m.position}
                  </span>
                )}
              </span>
            </button>
          ))}
          {available.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-500">
              Tous les joueurs sont déjà placés.
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
