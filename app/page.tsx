"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { Button, Field, Modal, inputClass } from "@/components/ui";
import { pastSessions } from "@/lib/stats";
import { trainingLoad, type LoadLevel } from "@/lib/training";
import type { CoachProfile } from "@/lib/types";

const COLORS = ["#f5188c", "#22d3ee", "#f59e0b", "#ef4444", "#8b5cf6", "#10b981"];
const WEEKDAYS = ["LUN.", "MAR.", "MER.", "JEU.", "VEN.", "SAM.", "DIM."];

// Redimensionne une image (data URL) à 256px max pour rester léger en stockage.
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const max = 256;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function HomePage() {
  const {
    data,
    ready,
    selectedGroupId,
    setSelectedGroupId,
    addGroup,
    updateProfile,
  } = useStore();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [sport, setSport] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [editProfile, setEditProfile] = useState(false);
  const [pForm, setPForm] = useState<CoachProfile>(data.profile);
  const fileRef = useRef<HTMLInputElement>(null);

  const profile = data.profile;
  const group = data.groups.find((g) => g.id === selectedGroupId) ?? null;

  const members = useMemo(
    () => data.members.filter((m) => m.groupId === selectedGroupId),
    [data.members, selectedGroupId]
  );

  // Charge d'entraînement et évaluation moyenne du groupe
  const load = useMemo(
    () =>
      selectedGroupId
        ? trainingLoad(data, selectedGroupId)
        : { current: 0, average: 0, ratio: 0, level: "ok" as LoadLevel },
    [data, selectedGroupId]
  );
  const evalAvg = useMemo(() => {
    const rated = members.filter((m) => typeof m.level === "number");
    if (rated.length === 0) return 0;
    return (
      rated.reduce((s, m) => s + (m.level ?? 0), 0) / rated.length
    );
  }, [members]);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file);
      updateProfile({ photo: dataUrl });
    } catch {
      /* ignore */
    }
    e.target.value = "";
  }

  // Séances de la semaine en cours, par jour
  const week = useMemo(() => {
    const start = startOfWeek(new Date());
    const groupSessions = data.sessions.filter(
      (s) => s.groupId === selectedGroupId
    );
    return Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const sessions = groupSessions.filter((s) => {
        const sd = new Date(s.date);
        return (
          sd.getFullYear() === date.getFullYear() &&
          sd.getMonth() === date.getMonth() &&
          sd.getDate() === date.getDate()
        );
      });
      return { date, sessions };
    });
  }, [data.sessions, selectedGroupId]);

  // Présences agrégées sur les séances passées
  const presence = useMemo(() => {
    if (!selectedGroupId)
      return { rate: 0, present: 0, slots: 0, absent: 0, excuse: 0 };
    const past = pastSessions(data, selectedGroupId);
    let present = 0;
    let absent = 0;
    let excuse = 0;
    for (const s of past) {
      const map = data.attendance[s.id] ?? {};
      for (const m of members) {
        const st = map[m.id];
        if (st === "present") present++;
        else if (st === "absent") absent++;
        else if (st === "excuse") excuse++;
      }
    }
    const slots = past.length * members.length;
    const rate = slots > 0 ? Math.round((present / slots) * 100) : 0;
    return { rate, present, slots, absent, excuse };
  }, [data, selectedGroupId, members]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#140d22] px-4 pt-6 text-slate-400">
        Chargement…
      </div>
    );
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
    <div className="min-h-screen bg-[#140d22] bg-[radial-gradient(1100px_500px_at_100%_-5%,rgba(245,24,140,0.18),transparent_55%),radial-gradient(900px_500px_at_-5%_0%,rgba(124,58,237,0.18),transparent_55%)] px-4 pb-28 pt-6 md:px-8 md:pb-10">
      <div className="mx-auto max-w-6xl">
        {/* Barre du haut */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-extrabold uppercase tracking-wide text-white">
            Tableau de bord
          </h1>
          {data.groups.length > 0 && (
            <select
              value={selectedGroupId ?? ""}
              onChange={(e) => setSelectedGroupId(e.target.value || null)}
              className="rounded-xl border border-[#2e2444] bg-[#1e1633] px-3 py-2 text-sm font-medium text-white focus:border-[#f5188c] focus:outline-none"
            >
              {data.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} — {g.sport}
                </option>
              ))}
            </select>
          )}
        </div>

        {data.groups.length === 0 ? (
          <Panel className="animate-rise p-8 text-center">
            <p className="text-lg font-bold text-white">
              Bienvenue sur CoachManager 👋
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
              Créez votre première équipe pour activer votre tableau de bord.
            </p>
            <div className="mt-4 flex justify-center">
              <NeonButton onClick={() => setOpen(true)}>
                Créer une équipe
              </NeonButton>
            </div>
          </Panel>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Hero profil */}
            <Panel className="animate-rise relative overflow-hidden p-5 lg:col-span-2">
              <div className="pointer-events-none absolute right-0 top-0 h-full w-1/2 bg-[radial-gradient(circle_at_80%_30%,rgba(245,24,140,0.35),transparent_60%)]" />
              <button
                onClick={() => {
                  setPForm(profile);
                  setEditProfile(true);
                }}
                className="absolute right-3 top-3 z-10 rounded-lg bg-white/5 p-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
                aria-label="Modifier le profil"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                </svg>
              </button>
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="group relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#f5188c] text-[#f5188c] shadow-[0_0_25px_rgba(245,24,140,0.5)]"
                  aria-label="Changer la photo"
                >
                  {profile.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.photo}
                      alt="Profil"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                    Changer
                  </span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPhoto}
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-extrabold uppercase tracking-wide text-white">
                      {profile.name}
                    </h2>
                    <span className="rounded-full bg-[#10b981]/20 px-2.5 py-0.5 text-xs font-semibold text-[#34d399]">
                      {profile.role}
                    </span>
                  </div>
                  <div className="mt-1 text-lg leading-none text-[#f5188c]">
                    {"★★★★★".slice(0, profile.rating)}
                    <span className="text-slate-600">
                      {"☆☆☆☆☆".slice(0, 5 - profile.rating)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm italic text-slate-300">
                    « {profile.quote} »
                  </p>
                  <p className="mt-1 text-right text-sm font-semibold text-slate-400">
                    — {profile.author}
                  </p>
                </div>
              </div>
            </Panel>

            {/* Nouvelle séance */}
            <Link
              href="/calendrier"
              className="animate-rise group flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-[#f5188c] bg-[#1b0f24] bg-[radial-gradient(circle_at_50%_120%,rgba(245,24,140,0.35),transparent_60%)] p-5 text-center shadow-[0_0_25px_rgba(245,24,140,0.2)] transition-all duration-200 hover:shadow-[0_0_35px_rgba(245,24,140,0.4)] active:scale-[0.99]"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f5188c] text-3xl font-light text-white shadow-[0_0_20px_rgba(245,24,140,0.6)] transition-transform duration-200 group-hover:scale-110">
                +
              </span>
              <p className="mt-3 text-lg font-extrabold uppercase tracking-wide text-white">
                Nouvelle séance
              </p>
              <p className="text-xs text-slate-400">
                Créer une séance d&apos;entraînement
              </p>
            </Link>

            {/* Calendrier semaine */}
            <Panel className="animate-rise p-5" style={{ animationDelay: "60ms" }}>
              <WidgetTitle>Calendrier</WidgetTitle>
              <div className="mt-4 grid grid-cols-7 gap-1.5">
                {week.map(({ date, sessions }, i) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-slate-500">
                      {WEEKDAYS[i]}
                    </span>
                    <div className="flex h-12 w-full flex-col items-center justify-center gap-1 rounded-lg bg-[#241a3a]">
                      <span className="text-xs font-semibold text-slate-300">
                        {date.getDate()}
                      </span>
                      <span className="flex gap-0.5">
                        {sessions.slice(0, 3).map((s) => (
                          <span
                            key={s.id}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor:
                                s.type === "match" ? "#22d3ee" : "#f5188c",
                            }}
                          />
                        ))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-1.5 text-xs text-slate-400">
                <Legend color="#f5188c" label="Séance d'entraînement" />
                <Legend color="#22d3ee" label="Match / compétition" />
              </div>
            </Panel>

            {/* Présence */}
            <Panel className="animate-rise p-5" style={{ animationDelay: "120ms" }}>
              <WidgetTitle>Présence</WidgetTitle>
              <div className="mt-4 flex items-center gap-4">
                <Donut value={presence.rate} />
                <div className="text-sm">
                  <p className="font-semibold text-white">
                    {presence.present}/{presence.slots} Présent
                  </p>
                  <p className="mt-1 text-slate-400">
                    {presence.absent} Absent · {presence.excuse} Excusé
                  </p>
                  <Link
                    href="/presences"
                    className="mt-2 inline-block text-xs font-semibold text-[#f5188c] hover:underline"
                  >
                    Faire l&apos;appel →
                  </Link>
                </div>
              </div>
            </Panel>

            {/* Indicateurs clés */}
            <Panel className="animate-rise p-5" style={{ animationDelay: "180ms" }}>
              <WidgetTitle>Indicateurs clés</WidgetTitle>
              <div className="mt-4 space-y-3">
                <Indicator label="Membres" value={String(members.length)} />
                <Indicator
                  label="Séances planifiées"
                  value={String(
                    data.sessions.filter((s) => s.groupId === selectedGroupId)
                      .length
                  )}
                />
                <Indicator label="Présence moyenne" value={`${presence.rate}%`} />
              </div>
            </Panel>

            {/* Charge d'entraînement */}
            <Panel className="animate-rise p-5" style={{ animationDelay: "240ms" }}>
              <WidgetTitle>Charge d&apos;entraînement</WidgetTitle>
              <LoadGauge level={load.level} ratio={load.ratio} />
              <div className="mt-4 space-y-2 text-xs">
                <Alert
                  on={load.level === "ok"}
                  color="#34d399"
                  label="Aucune alerte de charge"
                />
                <Alert
                  on={load.level === "rotation"}
                  color="#f59e0b"
                  label="Rotation conseillée"
                />
                <Alert
                  on={load.level === "fatigue"}
                  color="#ef4444"
                  label="Risque de fatigue"
                />
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Charge semaine : {load.current} · moyenne : {Math.round(load.average)}
              </p>
            </Panel>

            {/* Évaluation */}
            <Link
              href="/membres"
              className="animate-rise block"
              style={{ animationDelay: "300ms" }}
            >
              <Panel className="p-5 transition-colors hover:border-[#3a2e55]">
                <WidgetTitle>Évaluation</WidgetTitle>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-extrabold text-white">
                    {evalAvg ? evalAvg.toFixed(1) : "–"}
                  </span>
                  <span className="mb-1 text-sm text-slate-400">/ 5</span>
                </div>
                <div className="mt-1 text-lg leading-none text-[#f5188c]">
                  {"★★★★★".slice(0, Math.round(evalAvg))}
                  <span className="text-slate-600">
                    {"☆☆☆☆☆".slice(0, 5 - Math.round(evalAvg))}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Niveau moyen de l&apos;effectif · noter depuis les fiches joueurs →
                </p>
              </Panel>
            </Link>

            {/* Footboard */}
            <Link
              href="/footboard"
              className="animate-rise block"
              style={{ animationDelay: "360ms" }}
            >
              <Panel className="p-5 transition-colors hover:border-[#3a2e55]">
                <WidgetTitle>Footboard</WidgetTitle>
                <div
                  className="relative mt-4 h-28 overflow-hidden rounded-xl border border-[#2a2040]"
                  style={{
                    background:
                      "linear-gradient(180deg, #123524 0%, #0d2a1c 100%)",
                  }}
                >
                  <div className="absolute inset-2 rounded border border-white/15" />
                  <div className="absolute left-2 right-2 top-1/2 h-px bg-white/15" />
                  <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/15" />
                  {[
                    [50, 85],
                    [25, 62],
                    [50, 62],
                    [75, 62],
                    [35, 32],
                    [65, 32],
                  ].map(([x, y], i) => (
                    <span
                      key={i}
                      className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f5188c] shadow-[0_0_8px_rgba(245,24,140,0.7)]"
                      style={{ left: `${x}%`, top: `${y}%` }}
                    />
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Composer votre équipe sur le terrain →
                </p>
              </Panel>
            </Link>
          </div>
        )}
      </div>

      {/* Édition du profil */}
      <Modal
        open={editProfile}
        onClose={() => setEditProfile(false)}
        title="Mon profil"
      >
        <div className="space-y-4">
          <Field label="Nom">
            <input
              className={inputClass}
              value={pForm.name}
              onChange={(e) => setPForm({ ...pForm, name: e.target.value })}
              autoFocus
            />
          </Field>
          <Field label="Rôle / badge">
            <input
              className={inputClass}
              value={pForm.role}
              onChange={(e) => setPForm({ ...pForm, role: e.target.value })}
              placeholder="Ex : Coach jeunes"
            />
          </Field>
          <Field label="Niveau (étoiles)">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPForm({ ...pForm, rating: n })}
                  className={`text-2xl leading-none ${
                    n <= pForm.rating ? "text-[#f5188c]" : "text-slate-600"
                  }`}
                  aria-label={`${n} étoiles`}
                >
                  ★
                </button>
              ))}
            </div>
          </Field>
          <Field label="Citation">
            <textarea
              className={inputClass}
              rows={2}
              value={pForm.quote}
              onChange={(e) => setPForm({ ...pForm, quote: e.target.value })}
            />
          </Field>
          <Field label="Auteur de la citation">
            <input
              className={inputClass}
              value={pForm.author}
              onChange={(e) => setPForm({ ...pForm, author: e.target.value })}
            />
          </Field>
          <div className="flex justify-between gap-2 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                updateProfile({ photo: undefined });
                setPForm({ ...pForm, photo: undefined });
              }}
            >
              Retirer la photo
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setEditProfile(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  updateProfile({
                    name: pForm.name.trim() || "Mon profil",
                    role: pForm.role.trim() || "Coach",
                    rating: pForm.rating,
                    quote: pForm.quote,
                    author: pForm.author,
                  });
                  setEditProfile(false);
                }}
              >
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle équipe">
        <div className="space-y-4">
          <Field label="Nom de l'équipe">
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
                      ? "scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#1a1230]"
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

function Panel({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl border border-[#2a2040] bg-[#1a1230] shadow-lg ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

function WidgetTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-extrabold uppercase tracking-wide text-white">
      {children}
    </h3>
  );
}

function NeonButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl bg-[#f5188c] px-5 py-2.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(245,24,140,0.5)] transition-all duration-150 hover:bg-[#ff3a9f] active:scale-95"
    >
      {children}
    </button>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <p className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </p>
  );
}

function Indicator({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[#2a2040] pb-2 last:border-0 last:pb-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-lg font-bold text-white">{value}</span>
    </div>
  );
}

function Donut({ value }: { value: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg className="h-24 w-24 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#2a2040" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="#f5188c"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
        {value}%
      </span>
    </div>
  );
}

function LoadGauge({ level, ratio }: { level: LoadLevel; ratio: number }) {
  const color =
    level === "fatigue" ? "#ef4444" : level === "rotation" ? "#f59e0b" : "#34d399";
  // On borne l'aiguille entre 0 et 2 (ratio aigu/chronique).
  const pct = Math.max(4, Math.min(100, (ratio / 2) * 100));
  return (
    <div className="mt-4">
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#241a3a]">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>Faible</span>
        <span>Optimale</span>
        <span>Élevée</span>
      </div>
    </div>
  );
}

function Alert({
  on,
  color,
  label,
}: {
  on: boolean;
  color: string;
  label: string;
}) {
  return (
    <p
      className={`flex items-center gap-2 transition-opacity ${
        on ? "opacity-100" : "opacity-35"
      }`}
    >
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{
          backgroundColor: color,
          boxShadow: on ? `0 0 8px ${color}` : "none",
        }}
      />
      <span className={on ? "font-semibold text-white" : "text-slate-400"}>
        {label}
      </span>
    </p>
  );
}
