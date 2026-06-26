import type { AppData, AttendanceStatus, Member, Session } from "./types";
import { isUpcoming } from "./format";

export interface MemberStats {
  member: Member;
  present: number;
  absent: number;
  excuse: number;
  notMarked: number; // séances passées sans pointage
  total: number; // nombre de séances passées
  rate: number; // taux de présence en % (présents / total)
}

// Séances passées d'un groupe, de la plus récente à la plus ancienne.
export function pastSessions(data: AppData, groupId: string): Session[] {
  return data.sessions
    .filter((s) => s.groupId === groupId && !isUpcoming(s.date))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export function statusForMember(
  data: AppData,
  sessionId: string,
  memberId: string
): AttendanceStatus {
  return data.attendance[sessionId]?.[memberId] ?? "inconnu";
}

// Statistiques de présence d'un membre sur les séances passées.
export function memberStats(data: AppData, member: Member): MemberStats {
  const sessions = pastSessions(data, member.groupId);
  let present = 0;
  let absent = 0;
  let excuse = 0;
  let notMarked = 0;
  for (const s of sessions) {
    const status = statusForMember(data, s.id, member.id);
    if (status === "present") present++;
    else if (status === "absent") absent++;
    else if (status === "excuse") excuse++;
    else notMarked++;
  }
  const total = sessions.length;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;
  return { member, present, absent, excuse, notMarked, total, rate };
}

// Stats de tous les membres d'un groupe, triées par meilleur taux de présence.
export function groupStats(data: AppData, groupId: string): MemberStats[] {
  return data.members
    .filter((m) => m.groupId === groupId)
    .map((m) => memberStats(data, m))
    .sort((a, b) => b.rate - a.rate || b.present - a.present);
}
