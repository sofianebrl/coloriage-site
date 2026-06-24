"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { GroupSelector } from "@/components/GroupSelector";
import type { AttendanceStatus } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/format";

const STATUS: {
  key: AttendanceStatus;
  label: string;
  active: string;
}[] = [
  { key: "present", label: "Présent", active: "bg-emerald-500 text-slate-950" },
  { key: "absent", label: "Absent", active: "bg-red-500 text-white" },
  { key: "excuse", label: "Excusé", active: "bg-amber-500 text-slate-950" },
];

export default function PresencesPage() {
  const { data, ready, selectedGroupId, setAttendance } = useStore();
  const [sessionId, setSessionId] = useState<string>("");

  const sessions = useMemo(
    () =>
      data.sessions
        .filter((s) => s.groupId === selectedGroupId)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [data.sessions, selectedGroupId]
  );

  const members = useMemo(
    () =>
      data.members
        .filter((m) => m.groupId === selectedGroupId)
        .sort((a, b) => a.lastName.localeCompare(b.lastName)),
    [data.members, selectedGroupId]
  );

  // Sélectionne automatiquement la séance la plus pertinente.
  useEffect(() => {
    if (sessions.length === 0) {
      setSessionId("");
      return;
    }
    if (!sessions.some((s) => s.id === sessionId)) {
      const next =
        sessions.find((s) => +new Date(s.date) >= Date.now()) ?? sessions[0];
      setSessionId(next.id);
    }
  }, [sessions, sessionId]);

  if (!ready) return <p className="text-slate-400">Chargement…</p>;

  if (data.groups.length === 0) {
    return (
      <div>
        <PageHeader title="Présences" />
        <EmptyState
          title="Aucun groupe"
          description="Créez d'abord un groupe depuis l'accueil."
        />
      </div>
    );
  }

  const sessionAttendance = data.attendance[sessionId] ?? {};
  const presentCount = members.filter(
    (m) => sessionAttendance[m.id] === "present"
  ).length;

  return (
    <div>
      <PageHeader title="Présences" subtitle="Faites l'appel en un tap" />

      <GroupSelector />

      {sessions.length === 0 ? (
        <EmptyState
          title="Aucune séance"
          description="Planifiez une séance dans le calendrier pour faire l'appel."
        />
      ) : members.length === 0 ? (
        <EmptyState
          title="Aucun membre"
          description="Ajoutez des membres au groupe pour faire l'appel."
        />
      ) : (
        <>
          <div className="mb-4">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
              Séance
            </label>
            <select
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.type === "match" ? "🏆 " : "🏃 "}
                  {s.title} — {formatDate(s.date)} {formatTime(s.date)}
                </option>
              ))}
            </select>
          </div>

          <Card className="mb-4 flex items-center justify-between">
            <span className="text-sm text-slate-500">Présents</span>
            <span className="text-lg font-bold text-emerald-600">
              {presentCount}/{members.length}
            </span>
          </Card>

          <div className="space-y-2">
            {members.map((m, i) => {
              const status = sessionAttendance[m.id] ?? "inconnu";
              return (
                <Card
                  key={m.id}
                  className="animate-rise flex items-center gap-3"
                  style={{ animationDelay: `${i * 35}ms` }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-slate-900">
                      {m.firstName} {m.lastName}
                    </p>
                    {m.jerseyNumber && (
                      <p className="text-xs text-slate-500">
                        N°{m.jerseyNumber}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {STATUS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() =>
                          setAttendance(
                            sessionId,
                            m.id,
                            status === opt.key ? "inconnu" : opt.key
                          )
                        }
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 active:scale-95 ${
                          status === opt.key
                            ? opt.active
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
