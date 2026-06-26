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
  level?: number; // évaluation globale 1 à 5
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
  intensity?: number; // charge d'entraînement 1 à 10
}

// Présences : clé = sessionId, valeur = map memberId -> statut
export type AttendanceMap = Record<string, Record<string, AttendanceStatus>>;

// Profil du coach (global)
export interface CoachProfile {
  name: string;
  role: string;
  photo?: string; // image en data URL
  quote: string;
  author: string;
  rating: number; // 0 à 5
}

// Composition d'équipe : positionId -> memberId
export interface Lineup {
  formation: string;
  spots: Record<string, string>;
}

export interface AppData {
  groups: Group[];
  members: Member[];
  sessions: Session[];
  attendance: AttendanceMap;
  profile: CoachProfile;
  lineups: Record<string, Lineup>; // par groupe
}

export const defaultProfile: CoachProfile = {
  name: "Mon profil",
  role: "Coach",
  quote:
    "Le talent gagne des matchs, mais l'esprit d'équipe gagne des titres.",
  author: "Michael Jordan",
  rating: 3,
};

export const emptyData: AppData = {
  groups: [],
  members: [],
  sessions: [],
  attendance: {},
  profile: defaultProfile,
  lineups: {},
};
