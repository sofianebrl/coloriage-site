"use client";

import { useMemo, useState } from "react";
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
import { MonthCalendar } from "@/components/MonthCalendar";
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
  const [view, setView] = useState<"liste" | "mois">("liste");

  const groupSessions = useMemo(
    () => data.sessions.filter((s) => s.groupId === selectedGroupId),
    [data.sessions, selectedGroupId]
  );

  const { upcoming, past } = useMemo(() => {
    const sessions = [...groupSessions].sort(
      (a, b) => +new Date(a.date) - +new Date(b.date)
    );
    return {
      upcoming: sessions.filter((s) => isUpcoming(s.date)),
      past: sessions.filter((s) => !isUpcoming(s.date)).reverse(),
    };
  }, [groupSessions]);

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

      <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {(["liste", "mois"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition-all duration-150 active:scale-95 ${
              view === v
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            {v === "liste" ? "Liste" : "Mois"}
          </button>
        ))}
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <EmptyState
          title="Aucune séance planifiée"
          description="Ajoutez un entraînement ou un match."
          action={<Button onClick={openCreate}>Planifier une séance</Button>}
        />
      ) : view === "mois" ? (
        <MonthCalendar sessions={groupSessions} onEdit={openEdit} />
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
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-150 active:scale-[0.98] ${
                  form.type === t
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
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
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h2>
      <div className="space-y-2">
        {sessions.map((s, i) => (
          <div
            key={s.id}
            className="animate-rise flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-150 hover:border-slate-300 hover:shadow"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <div
              className={`flex w-14 shrink-0 flex-col items-center rounded-lg py-1.5 ${
                s.type === "match"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              <span className="text-lg font-bold leading-none">
                {new Date(s.date).getDate()}
              </span>
              <span className="text-[10px] uppercase opacity-80">
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
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {s.type === "match" ? "MATCH" : "ENTR."}
                </span>
                <span className="truncate font-medium text-slate-900">
                  {s.title}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {formatDate(s.date)} · {formatTime(s.date)}
              </p>
              {(s.location || s.opponent) && (
                <p className="text-xs text-slate-400">
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
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
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
    </div>
  );
}
