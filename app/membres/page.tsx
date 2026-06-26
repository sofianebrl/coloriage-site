"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import {
  Button,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  inputClass,
} from "@/components/ui";
import { GroupSelector } from "@/components/GroupSelector";

type FormState = {
  firstName: string;
  lastName: string;
  jerseyNumber: string;
  position: string;
  phone: string;
};

const empty: FormState = {
  firstName: "",
  lastName: "",
  jerseyNumber: "",
  position: "",
  phone: "",
};

export default function MembresPage() {
  const { data, ready, selectedGroupId, addMember, deleteMember } = useStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);

  const members = useMemo(
    () =>
      data.members
        .filter((m) => m.groupId === selectedGroupId)
        .sort((a, b) => a.lastName.localeCompare(b.lastName)),
    [data.members, selectedGroupId]
  );

  if (!ready) return <p className="text-slate-400">Chargement…</p>;

  if (data.groups.length === 0) {
    return (
      <div>
        <PageHeader title="Membres" />
        <EmptyState
          title="Aucun groupe"
          description="Créez d'abord un groupe depuis l'accueil pour y ajouter des membres."
        />
      </div>
    );
  }

  function openCreate() {
    setForm(empty);
    setOpen(true);
  }

  function handleSubmit() {
    if (!form.firstName.trim() || !form.lastName.trim() || !selectedGroupId)
      return;
    addMember({
      groupId: selectedGroupId,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      jerseyNumber: form.jerseyNumber.trim() || undefined,
      position: form.position.trim() || undefined,
      phone: form.phone.trim() || undefined,
    });
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Membres"
        subtitle={`${members.length} membre${members.length > 1 ? "s" : ""}`}
        action={
          <Button onClick={openCreate}>
            <span className="text-lg leading-none">+</span> Membre
          </Button>
        }
      />

      <GroupSelector />

      {members.length === 0 ? (
        <EmptyState
          title="Pas encore de membre"
          description="Ajoutez les joueurs/joueuses de ce groupe."
          action={<Button onClick={openCreate}>Ajouter un membre</Button>}
        />
      ) : (
        <div className="space-y-2">
          {members.map((m, i) => (
            <div
              key={m.id}
              className="animate-rise flex items-center gap-3 rounded-2xl border border-[#2a2040] bg-[#1a1230] p-4 shadow-lg transition-all duration-150 hover:border-[#3a2e55]"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#241a3a] text-sm font-bold text-slate-200">
                {m.jerseyNumber ? (
                  m.jerseyNumber
                ) : (
                  <span>
                    {m.firstName[0]}
                    {m.lastName[0]}
                  </span>
                )}
              </div>
              <Link
                href={`/membres/${m.id}`}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate font-medium text-white">
                  {m.firstName} {m.lastName}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {[m.position, m.phone].filter(Boolean).join(" · ") || "—"}
                </p>
              </Link>
              <button
                onClick={() => {
                  if (confirm(`Supprimer ${m.firstName} ${m.lastName} ?`))
                    deleteMember(m.id);
                }}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
                aria-label="Supprimer"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m2 0v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau membre">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom">
              <input
                className={inputClass}
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                autoFocus
              />
            </Field>
            <Field label="Nom">
              <input
                className={inputClass}
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="N° maillot">
              <input
                className={inputClass}
                value={form.jerseyNumber}
                onChange={(e) =>
                  setForm({ ...form, jerseyNumber: e.target.value })
                }
                inputMode="numeric"
              />
            </Field>
            <Field label="Poste">
              <input
                className={inputClass}
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="Ex : Gardien"
              />
            </Field>
          </div>
          <Field label="Téléphone (parent)">
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              inputMode="tel"
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.firstName.trim() || !form.lastName.trim()}
            >
              Ajouter
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
