"use client";

import { useMemo, useState } from "react";
import type { Session } from "@/lib/types";
import { Card } from "@/components/ui";
import { formatTime } from "@/lib/format";

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];
const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function MonthCalendar({
  sessions,
  onEdit,
}: {
  sessions: Session[];
  onEdit: (s: Session) => void;
}) {
  const today = new Date();
  const [view, setView] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selected, setSelected] = useState<Date>(today);

  // Sessions regroupées par jour (clé = AAAA-MM-JJ)
  const byDay = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of sessions) {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const arr = map.get(key) ?? [];
      arr.push(s);
      map.set(key, arr);
    }
    return map;
  }, [sessions]);

  const sessionsFor = (d: Date) =>
    (byDay.get(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`) ?? []).sort(
      (a, b) => +new Date(a.date) - +new Date(b.date)
    );

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1);
  // Lundi = 0
  const offset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const selectedSessions = sessionsFor(selected);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setView(new Date(year, month - 1, 1))}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Mois précédent"
        >
          ‹
        </button>
        <span className="font-semibold capitalize text-white">
          {MONTHS[month]} {year}
        </span>
        <button
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Mois suivant"
        >
          ›
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={i}
            className="py-1 text-center text-xs font-medium text-slate-500"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const daySessions = sessionsFor(d);
          const isToday = sameDay(d, today);
          const isSelected = sameDay(d, selected);
          return (
            <button
              key={i}
              onClick={() => setSelected(d)}
              className={`flex aspect-square flex-col items-center justify-start rounded-lg p-1 text-sm transition-colors ${
                isSelected
                  ? "bg-emerald-500 text-slate-950"
                  : isToday
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span className={isToday && !isSelected ? "font-bold" : ""}>
                {d.getDate()}
              </span>
              <span className="mt-0.5 flex gap-0.5">
                {daySessions.slice(0, 3).map((s) => (
                  <span
                    key={s.id}
                    className={`h-1.5 w-1.5 rounded-full ${
                      isSelected
                        ? "bg-slate-900"
                        : s.type === "match"
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <h3 className="mb-2 text-sm font-semibold text-slate-300">
          {selected.toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </h3>
        {selectedSessions.length === 0 ? (
          <p className="text-sm text-slate-500">Aucune séance ce jour.</p>
        ) : (
          <div className="space-y-2">
            {selectedSessions.map((s) => (
              <Card key={s.id}>
                <button
                  onClick={() => onEdit(s)}
                  className="flex w-full items-center gap-2 text-left"
                >
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      s.type === "match"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {s.type === "match" ? "MATCH" : "ENTR."}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-white">
                    {s.title}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatTime(s.date)}
                  </span>
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
