// Modèle de données de l'application coach

export type SessionType = "entrainement" | "match";

export type AttendanceStatus = "present" | "absent" | "excuse" | "inconnu";

export interface Group {
  id: string;
  name: string;
  sport: string;
  color: string; // couleur d'accent du groupe (hex)
}

export interface Member {
  id: string;
  groupId: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: string;
  position?: string;
  phone?: string;
}

export interface Session {
  id: string;
  groupId: string;
  type: SessionType;
  title: string;
  date: string; // ISO datetime
  location?: string;
  opponent?: string; // pour les matchs
  notes?: string;
}

// Présences : clé = sessionId, valeur = map memberId -> statut
export type AttendanceMap = Record<string, Record<string, AttendanceStatus>>;

export interface AppData {
  groups: Group[];
  members: Member[];
  sessions: Session[];
  attendance: AttendanceMap;
}

export const emptyData: AppData = {
  groups: [],
  members: [],
  sessions: [],
  attendance: {},
};
