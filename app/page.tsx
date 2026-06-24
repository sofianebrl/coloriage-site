"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { formatDate, formatTime, isUpcoming } from "@/lib/format";

const COLORS = [
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function HomePage() {
  const { data, ready, selectedGroupId, addGroup, deleteGroup } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sport, setSport] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const group = data.groups.find((g) => g.id === selectedGroupId) ?? null;

  const stats = useMemo(() => {
    if (!group) return null;
    const members = data.members.filter((m) => m.groupId === group.id);
    const sessions = data.sessions.filter((s) => s.groupId === group.id);
    const upcoming = sessions
      .filter((s) => isUpcoming(s.date))
      .sort((a, b) => +new Date(a.date) - +new Date(b.date));
    return { memberCount: members.length, sessionCount: sessions.length, upcoming };
  }, [group, data]);

  if (!ready) {
    return <p className="text-slate-400">Chargement…</p>;
  }

  function handleCreate() {
    if (!name.trim() || !sport.trim()) return;
    addGroup({ name: name.trim(), sport: sport.trim(), color });
    setName("");
    setSport("");
    setColor(COLORS[0]);
    setOpen(false);
  }

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        subtitle="Vos groupes en un coup d'œil"
        action={
          <Button onClick={() => setOpen(true)}>
            <span className="text-lg leading-none">+</span> Groupe
          </Button>
        }
      />

      {data.groups.length === 0 ? (
        <EmptyState
          title="Bienvenue sur CoachManager 👋"
          description="Créez votre premier groupe (équipe) pour commencer à gérer vos membres, votre calendrier et les présences."
          action={
            <Button onClick={() => setOpen(true)}>Créer un groupe</Button>
          }
        />
      ) : (
        <>
          <GroupSelector />

          {group && stats && (
            <div className="space-y-6">
              <div className="animate-rise rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {group.sport}
                  </p>
                </div>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                  {group.name}
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link
                    href="/membres"
                    className="rounded-xl border border-slate-200 px-4 py-3 transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                  >
                    <p className="text-2xl font-bold text-slate-900">
                      {stats.memberCount}
                    </p>
                    <p className="text-xs font-medium text-slate-500">membres</p>
                  </Link>
                  <Link
                    href="/calendrier"
                    className="rounded-xl border border-slate-200 px-4 py-3 transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]"
                  >
                    <p className="text-2xl font-bold text-slate-900">
                      {stats.sessionCount}
                    </p>
                    <p className="text-xs font-medium text-slate-500">séances</p>
                  </Link>
                </div>
              </div>

              <div
                className="animate-rise"
                style={{ animationDelay: "60ms" }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-900">
                    Prochaines séances
                  </h2>
                  <Link
                    href="/calendrier"
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    Tout voir
                  </Link>
                </div>
                {stats.upcoming.length === 0 ? (
                  <EmptyState
                    title="Aucune séance à venir"
                    description="Planifiez un entraînement ou un match depuis le calendrier."
                    action={
                      <Link href="/calendrier">
                        <Button variant="ghost">Aller au calendrier</Button>
                      </Link>
                    }
                  />
                ) : (
                  <div className="space-y-2">
                    {stats.upcoming.slice(0, 4).map((s, i) => (
                      <Link
                        key={s.id}
                        href="/calendrier"
                        className="animate-rise flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-150 hover:border-slate-300 hover:shadow active:scale-[0.99]"
                        style={{ animationDelay: `${100 + i * 50}ms` }}
                      >
                        <span
                          className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${
                            s.type === "match"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {s.type === "match" ? "Match" : "Entraînement"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-900">
                            {s.title}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(s.date)} · {formatTime(s.date)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button
                  variant="danger"
                  onClick={() => {
                    if (
                      confirm(
                        `Supprimer le groupe « ${group.name} » et toutes ses données ?`
                      )
                    ) {
                      deleteGroup(group.id);
                    }
                  }}
                >
                  Supprimer ce groupe
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nouveau groupe">
        <div className="space-y-4">
          <Field label="Nom du groupe">
            <input
              className={inputClass}
              placeholder="Ex : U15 Garçons"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </Field>
          <Field label="Sport / activité">
            <input
              className={inputClass}
              placeholder="Ex : Football"
              value={sport}
              onChange={(e) => setSport(e.target.value)}
            />
          </Field>
          <Field label="Couleur">
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full transition-transform ${
                    color === c
                      ? "scale-110 ring-2 ring-slate-900 ring-offset-2"
                      : ""
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Couleur ${c}`}
                />
              ))}
            </div>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={!name.trim() || !sport.trim()}>
              Créer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
