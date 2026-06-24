"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type AppData,
  type AttendanceStatus,
  type Group,
  type Member,
  type Session,
  emptyData,
} from "./types";

const STORAGE_KEY = "coach-manager-data-v1";
const SELECTED_GROUP_KEY = "coach-manager-selected-group-v1";

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function loadData(): AppData {
  if (typeof window === "undefined") return emptyData;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      groups: parsed.groups ?? [],
      members: parsed.members ?? [],
      sessions: parsed.sessions ?? [],
      attendance: parsed.attendance ?? {},
    };
  } catch {
    return emptyData;
  }
}

interface StoreContextValue {
  data: AppData;
  ready: boolean;
  // Groupe actif
  selectedGroupId: string | null;
  setSelectedGroupId: (id: string | null) => void;
  // Groupes
  addGroup: (g: Omit<Group, "id">) => Group;
  updateGroup: (id: string, patch: Partial<Omit<Group, "id">>) => void;
  deleteGroup: (id: string) => void;
  // Membres
  addMember: (m: Omit<Member, "id">) => Member;
  updateMember: (id: string, patch: Partial<Omit<Member, "id">>) => void;
  deleteMember: (id: string) => void;
  // Séances
  addSession: (s: Omit<Session, "id">) => Session;
  updateSession: (id: string, patch: Partial<Omit<Session, "id">>) => void;
  deleteSession: (id: string) => void;
  // Présences
  setAttendance: (
    sessionId: string,
    memberId: string,
    status: AttendanceStatus
  ) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [ready, setReady] = useState(false);
  const [selectedGroupId, setSelectedGroupIdState] = useState<string | null>(
    null
  );

  // Chargement initial depuis le localStorage
  useEffect(() => {
    const loaded = loadData();
    setData(loaded);
    const savedGroup = window.localStorage.getItem(SELECTED_GROUP_KEY);
    if (savedGroup && loaded.groups.some((g) => g.id === savedGroup)) {
      setSelectedGroupIdState(savedGroup);
    } else if (loaded.groups.length > 0) {
      setSelectedGroupIdState(loaded.groups[0].id);
    }
    setReady(true);
  }, []);

  // Persistance à chaque changement
  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, ready]);

  const value = useMemo<StoreContextValue>(() => {
    return {
      data,
      ready,
      selectedGroupId,
      setSelectedGroupId(id) {
        setSelectedGroupIdState(id);
        if (typeof window !== "undefined") {
          if (id) window.localStorage.setItem(SELECTED_GROUP_KEY, id);
          else window.localStorage.removeItem(SELECTED_GROUP_KEY);
        }
      },
      addGroup(g) {
        const group: Group = { ...g, id: uid() };
        setData((d) => ({ ...d, groups: [...d.groups, group] }));
        setSelectedGroupIdState(group.id);
        return group;
      },
      updateGroup(id, patch) {
        setData((d) => ({
          ...d,
          groups: d.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)),
        }));
      },
      deleteGroup(id) {
        if (selectedGroupId === id) {
          const next = data.groups.find((g) => g.id !== id);
          setSelectedGroupIdState(next ? next.id : null);
        }
        setData((d) => {
          const sessionIds = d.sessions
            .filter((s) => s.groupId === id)
            .map((s) => s.id);
          const attendance = { ...d.attendance };
          sessionIds.forEach((sid) => delete attendance[sid]);
          return {
            groups: d.groups.filter((g) => g.id !== id),
            members: d.members.filter((m) => m.groupId !== id),
            sessions: d.sessions.filter((s) => s.groupId !== id),
            attendance,
          };
        });
      },
      addMember(m) {
        const member: Member = { ...m, id: uid() };
        setData((d) => ({ ...d, members: [...d.members, member] }));
        return member;
      },
      updateMember(id, patch) {
        setData((d) => ({
          ...d,
          members: d.members.map((m) => (m.id === id ? { ...m, ...patch } : m)),
        }));
      },
      deleteMember(id) {
        setData((d) => {
          const attendance: AppData["attendance"] = {};
          for (const [sid, map] of Object.entries(d.attendance)) {
            const { [id]: _removed, ...rest } = map;
            attendance[sid] = rest;
          }
          return {
            ...d,
            members: d.members.filter((m) => m.id !== id),
            attendance,
          };
        });
      },
      addSession(s) {
        const session: Session = { ...s, id: uid() };
        setData((d) => ({ ...d, sessions: [...d.sessions, session] }));
        return session;
      },
      updateSession(id, patch) {
        setData((d) => ({
          ...d,
          sessions: d.sessions.map((s) =>
            s.id === id ? { ...s, ...patch } : s
          ),
        }));
      },
      deleteSession(id) {
        setData((d) => {
          const attendance = { ...d.attendance };
          delete attendance[id];
          return {
            ...d,
            sessions: d.sessions.filter((s) => s.id !== id),
            attendance,
          };
        });
      },
      setAttendance(sessionId, memberId, status) {
        setData((d) => ({
          ...d,
          attendance: {
            ...d.attendance,
            [sessionId]: {
              ...(d.attendance[sessionId] ?? {}),
              [memberId]: status,
            },
          },
        }));
      },
    };
  }, [data, ready, selectedGroupId]);

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore doit être utilisé dans un StoreProvider");
  return ctx;
}
