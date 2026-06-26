"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Modal,
  inputClass,
} from "@/components/ui";
import { memberStats, pastSessions, statusForMember } from "@/lib/stats";
import { formatDate, formatTime } from "@/lib/format";
import type { AttendanceStatus } from "@/lib/types";

const STATUS_LABEL: Record<AttendanceStatus, { label: string; cls: string }> = {
  present: { label: "Présent", cls: "bg-emerald-500/15 text-emerald-300" },
  absent: { label: "Absent", cls: "bg-red-500/15 text-red-300" },
  excuse: { label: "Excusé", cls: "bg-amber-500/15 text-amber-300" },
  inconnu: { label: "Non pointé", cls: "bg-white/5 text-slate-400" },
};

export default function MemberDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { data, ready, updateMember, deleteMember } = useStore();
  const [open, setOpen] = useState(false);

  const member = data.members.find((m) => m.id === params.id) ?? null;

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    jerseyNumber: "",
    position: "",
    phone: "",
  });

  const stats = useMemo(
    () => (member ? memberStats(data, member) : null),
    [data, member]
  );

  const history = useMemo(() => {
    if (!member) return [];
    return pastSessions(data, member.groupId).map((s) => ({
      session: s,
      status: statusForMember(data, s.id, member.id),
    }));
  }, [data, member]);

  if (!ready) return <p className="text-slate-400">Chargement…</p>;

  if (!member) {
    return (
      <div>
        <Link href="/membres" className="text-sm text-emerald-400">
          ← Retour aux membres
        </Link>
        <div className="mt-4">
          <EmptyState
            title="Membre introuvable"
            description="Ce membre a peut-être été supprimé."
          />
        </div>
      </div>
    );
  }

  function openEdit() {
    if (!member) return;
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      jerseyNumber: member.jerseyNumber ?? "",
      position: member.position ?? "",
      phone: member.phone ?? "",
    });
    setOpen(true);
  }

  function handleSave() {
    if (!member || !form.firstName.trim() || !form.lastName.trim()) return;
    updateMember(member.id, {
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
      <Link
        href="/membres"
        className="text-sm font-medium text-[#f5188c] hover:underline"
      >
        ← Retour aux membres
      </Link>

      <div className="animate-rise mb-6 mt-4 flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[#f5188c] bg-[#241a3a] text-xl font-bold text-white shadow-[0_0_18px_rgba(245,24,140,0.4)]">
          {member.jerseyNumber || (
            <span>
              {member.firstName[0]}
              {member.lastName[0]}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold uppercase tracking-wide text-white">
            {member.firstName} {member.lastName}
          </h1>
          <p className="text-sm text-slate-400">
            {[member.position, member.jerseyNumber && `N°${member.jerseyNumber}`]
              .filter(Boolean)
              .join(" · ") || "—"}
          </p>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <Button variant="ghost" onClick={openEdit}>
          Modifier
        </Button>
        {member.phone && (
          <a href={`tel:${member.phone}`}>
            <Button variant="ghost">Appeler {member.phone}</Button>
          </a>
        )}
        <Button
          variant="danger"
          onClick={() => {
            if (confirm(`Supprimer ${member.firstName} ${member.lastName} ?`)) {
              deleteMember(member.id);
              router.push("/membres");
            }
          }}
        >
          Supprimer
        </Button>
      </div>

      <Card className="animate-rise mb-6 flex items-center justify-between">
        <span className="text-sm text-slate-400">Évaluation (niveau)</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() =>
                updateMember(member.id, {
                  level: member.level === n ? undefined : n,
                })
              }
              className={`text-2xl leading-none transition-transform active:scale-90 ${
                n <= (member.level ?? 0) ? "text-[#f5188c]" : "text-slate-600"
              }`}
              aria-label={`${n} étoiles`}
            >
              ★
            </button>
          ))}
        </div>
      </Card>

      {stats && stats.total > 0 && (
        <Card className="animate-rise mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-slate-400">Taux de présence</span>
            <span className="text-lg font-bold text-[#f5188c]">
              {stats.rate}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[#241a3a]">
            <div
              className="h-full rounded-full bg-[#f5188c] transition-[width] duration-700 ease-out"
              style={{ width: `${stats.rate}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {stats.present} présent{stats.present > 1 ? "s" : ""} · {stats.absent}{" "}
            absent{stats.absent > 1 ? "s" : ""} · {stats.excuse} excusé
            {stats.excuse > 1 ? "s" : ""} sur {stats.total} séance
            {stats.total > 1 ? "s" : ""}
          </p>
        </Card>
      )}

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
        Historique des présences
      </h2>
      {history.length === 0 ? (
        <EmptyState
          title="Aucune séance passée"
          description="L'historique se remplira après les séances."
        />
      ) : (
        <div className="space-y-2">
          {history.map(({ session, status }, i) => (
            <Card
              key={session.id}
              className="animate-rise flex items-center gap-3"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-white">
                  {session.title}
                </p>
                <p className="text-xs text-slate-400">
                  {formatDate(session.date)} · {formatTime(session.date)}
                </p>
              </div>
              <span
                className={`rounded-lg px-2 py-1 text-xs font-semibold ${STATUS_LABEL[status].cls}`}
              >
                {STATUS_LABEL[status].label}
              </span>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Modifier le membre">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Prénom">
              <input
                className={inputClass}
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
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
              onClick={handleSave}
              disabled={!form.firstName.trim() || !form.lastName.trim()}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
