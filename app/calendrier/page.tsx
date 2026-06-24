"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  inputClass,
} from "@/components/ui";
import { GroupSelector } from "@/components/GroupSelector";
import type { Session, SessionType } from "@/lib/types";
import {
  formatDate,
  formatTime,
  fromInputValue,
  isUpcoming,
  toInputValue,
} from "@/lib/format";

type FormState = {
  type: SessionType;
  title: string;
  date: string;
  location: string;
  opponent: string;
  notes: string;
};

function defaultForm(): FormState {
  const d = new Date();
  d.setHours(18, 0, 0, 0);
  return {
    type: "entrainement",
    title: "",
    date: toInputValue(d.toISOString()),
    location: "",
    opponent: "",
    notes: "",
  };
}

export default function CalendrierPage() {
  const {
    data,
    ready,
    selectedGroupId,
    addSession,
    updateSession,
    deleteSession,
  } = useStore();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Session | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);

  const { upcoming, past } = useMemo(() => {
    const sessions = data.sessions
      .filter((s) => s.groupId === selectedGroupId)
      .sort((a, b) => +new Date(a.date) - +new Date(b.date));
    return {
      upcoming: sessions.filter((s) => isUpcoming(s.date)),
      past: sessions.filter((s) => !isUpcoming(s.date)).reverse(),
    };
  }, [data.sessions, selectedGroupId]);

  if (!ready) return <p className="text-slate-400">Chargement…</p>;

  if (data.groups.length === 0) {
    return (
      <div>
        <PageHeader title="Calendrier" />
        <EmptyState
          title="Aucun groupe"
          description="Créez d'abord un groupe depuis l'accueil."
        />
      </div>
    );
  }

  function openCreate() {
    setEditing(null);
    setForm(defaultForm());
    setOpen(true);
  }

  function openEdit(s: Session) {
    setEditing(s);
    setForm({
      type: s.type,
      title: s.title,
      date: toInputValue(s.date),
      location: s.location ?? "",
      opponent: s.opponent ?? "",
      notes: s.notes ?? "",
    });
    setOpen(true);
  }

  function handleSubmit() {
    if (!form.title.trim() || !form.date || !selectedGroupId) return;
    const payload = {
      groupId: selectedGroupId,
      type: form.type,
      title: form.title.trim(),
      date: fromInputValue(form.date),
      location: form.location.trim() || undefined,
      opponent: form.opponent.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    if (editing) updateSession(editing.id, payload);
    else addSession(payload);
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Calendrier"
        subtitle="Entraînements et matchs"
        action={
          <Button onClick={openCreate}>
            <span className="text-lg leading-none">+</span> Séance
          </Button>
        }
      />

      <GroupSelector />

      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          title="Aucune séance planifiée"
          description="Ajoutez un entraînement ou un match."
          action={<Button onClick={openCreate}>Planifier une séance</Button>}
        />
      ) : (
        <div className="space-y-6">
          <SessionGroup title="À venir" sessions={upcoming} onEdit={openEdit} onDelete={deleteSession} />
          {past.length > 0 && (
            <SessionGroup title="Passées" sessions={past} onEdit={openEdit} onDelete={deleteSession} muted />
          )}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier la séance" : "Nouvelle séance"}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {(["entrainement", "match"] as SessionType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, type: t })}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                  form.type === t
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-300"
                    : "border-slate-700 bg-slate-800 text-slate-300"
                }`}
              >
                {t === "match" ? "Match" : "Entraînement"}
              </button>
            ))}
          </div>
          <Field label="Titre">
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={
                form.type === "match" ? "Ex : Match championnat" : "Ex : Séance technique"
              }
              autoFocus
            />
          </Field>
          <Field label="Date et heure">
            <input
              type="datetime-local"
              className={inputClass}
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Field>
          <Field label="Lieu">
            <input
              className={inputClass}
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Ex : Stade municipal"
            />
          </Field>
          {form.type === "match" && (
            <Field label="Adversaire">
              <input
                className={inputClass}
                value={form.opponent}
                onChange={(e) => setForm({ ...form, opponent: e.target.value })}
              />
            </Field>
          )}
          <Field label="Notes">
            <textarea
              className={inputClass}
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={!form.title.trim()}>
              {editing ? "Enregistrer" : "Ajouter"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SessionGroup({
  title,
  sessions,
  onEdit,
  onDelete,
  muted,
}: {
  title: string;
  sessions: Session[];
  onEdit: (s: Session) => void;
  onDelete: (id: string) => void;
  muted?: boolean;
}) {
  if (sessions.length === 0) return null;
  return (
    <div className={muted ? "opacity-70" : ""}>
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <div className="space-y-2">
        {sessions.map((s) => (
          <Card key={s.id} className="flex items-start gap-3">
            <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-slate-700/60 py-1.5">
              <span className="text-lg font-bold leading-none text-white">
                {new Date(s.date).getDate()}
              </span>
              <span className="text-[10px] uppercase text-slate-400">
                {new Date(s.date).toLocaleDateString("fr-FR", {
                  month: "short",
                })}
              </span>
            </div>
            <button
              onClick={() => onEdit(s)}
              className="min-w-0 flex-1 text-left"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                    s.type === "match"
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-emerald-500/20 text-emerald-300"
                  }`}
                >
                  {s.type === "match" ? "MATCH" : "ENTR."}
                </span>
                <span className="truncate font-medium text-white">
                  {s.title}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {formatDate(s.date)} · {formatTime(s.date)}
              </p>
              {(s.location || s.opponent) && (
                <p className="text-xs text-slate-500">
                  {[s.opponent && `vs ${s.opponent}`, s.location]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </button>
            <button
              onClick={() => {
                if (confirm(`Supprimer « ${s.title} » ?`)) onDelete(s.id);
              }}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-700 hover:text-red-400"
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
          </Card>
        ))}
      </div>
    </div>
  );
}
