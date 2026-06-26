import type { AppData, Session } from "./types";

export type LoadLevel = "ok" | "rotation" | "fatigue";

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sessionLoad(s: Session): number {
  // À défaut d'intensité saisie, on considère une séance moyenne (5/10).
  return s.intensity ?? 5;
}

// Charge cumulée des séances d'une semaine donnée (offset 0 = semaine en cours).
function weekLoad(sessions: Session[], weekOffset: number): number {
  const start = startOfWeek(new Date());
  start.setDate(start.getDate() + weekOffset * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return sessions
    .filter((s) => {
      const d = new Date(s.date);
      return d >= start && d < end;
    })
    .reduce((sum, s) => sum + sessionLoad(s), 0);
}

export interface TrainingLoad {
  current: number; // charge de la semaine en cours
  average: number; // charge moyenne des 4 semaines précédentes
  ratio: number; // rapport charge aiguë / chronique
  level: LoadLevel;
}

// Rapport « charge aiguë / chronique » (ACWR), indicateur classique de risque.
export function trainingLoad(data: AppData, groupId: string): TrainingLoad {
  const sessions = data.sessions.filter((s) => s.groupId === groupId);
  const current = weekLoad(sessions, 0);
  const prev = [1, 2, 3, 4].map((w) => weekLoad(sessions, -w));
  const average = prev.reduce((a, b) => a + b, 0) / prev.length;
  const ratio = average > 0 ? current / average : current > 0 ? 1.5 : 0;

  let level: LoadLevel = "ok";
  if (ratio > 1.5) level = "fatigue";
  else if (ratio > 1.3) level = "rotation";

  return { current, average, ratio, level };
}
