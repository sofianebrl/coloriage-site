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
              <div
                className="relative overflow-hidden rounded-3xl p-5 shadow-xl"
                style={{
                  backgroundColor: "#0f172a",
                  backgroundImage: `linear-gradient(135deg, ${group.color} 0%, rgba(15,23,42,0.55) 78%)`,
                }}
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-white/80">
                  {group.sport}
                </p>
                <h2 className="mt-1 text-3xl font-extrabold text-white drop-shadow">
                  {group.name}
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Link
                    href="/membres"
                    className="rounded-2xl bg-black/25 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-black/35"
                  >
                    <p className="text-2xl font-bold text-white">
                      {stats.memberCount}
                    </p>
                    <p className="text-xs font-medium text-white/80">membres</p>
                  </Link>
                  <Link
                    href="/calendrier"
                    className="rounded-2xl bg-black/25 px-4 py-3 backdrop-blur-sm transition-colors hover:bg-black/35"
                  >
                    <p className="text-2xl font-bold text-white">
                      {stats.sessionCount}
                    </p>
                    <p className="text-xs font-medium text-white/80">séances</p>
                  </Link>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    Prochaines séances
                  </h2>
                  <Link
                    href="/calendrier"
                    className="text-sm text-emerald-400 hover:underline"
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
                    {stats.upcoming.slice(0, 4).map((s) => (
                      <div
                        key={s.id}
                        className={`flex items-center gap-3 overflow-hidden rounded-2xl border-l-4 bg-slate-800/50 p-4 ${
                          s.type === "match"
                            ? "border-amber-400"
                            : "border-emerald-400"
                        }`}
                      >
                        <span
                          className={`rounded-lg px-2 py-1 text-xs font-semibold ${
                            s.type === "match"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          }`}
                        >
                          {s.type === "match" ? "Match" : "Entraînement"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-white">
                            {s.title}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatDate(s.date)} · {formatTime(s.date)}
                          </p>
                        </div>
                      </div>
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
                    color === c ? "scale-110 ring-2 ring-white" : ""
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
