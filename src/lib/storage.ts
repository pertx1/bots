import { createDefaultData } from "./defaults";
import type { AppData } from "./types";

/**
 * Capa de almacenamiento. Hoy guarda en localStorage; para migrar a Supabase
 * basta con escribir otro adaptador con la misma interfaz (load/save) y
 * cambiar `storage` abajo.
 */
export interface StorageAdapter {
  load(): AppData | null;
  save(data: AppData): void;
  clear(): void;
}

const KEY = "june-app-v1";

export const localStorageAdapter: StorageAdapter = {
  load() {
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as AppData) : null;
    } catch {
      return null;
    }
  },
  save(data) {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // Sin espacio o modo privado: seguimos en memoria.
    }
  },
  clear() {
    try {
      window.localStorage.removeItem(KEY);
    } catch {}
  },
};

export const storage: StorageAdapter = localStorageAdapter;

/** Rellena campos que falten (datos antiguos o importados a medias). */
export function normalize(input: unknown): AppData {
  const base = createDefaultData();
  if (!input || typeof input !== "object") return base;
  const d = input as Partial<AppData>;
  return {
    ...base,
    ...d,
    version: 1,
    settings: {
      ...base.settings,
      ...(d.settings ?? {}),
      reminders: { ...base.settings.reminders, ...(d.settings?.reminders ?? {}) },
      // El mono se llama Blu, punto.
      petName: "Blu",
      gender: d.settings?.gender === "m" ? "m" : "f",
      method: d.settings?.method ?? (d.settings?.focusMinutes && d.settings.focusMinutes !== 25 ? "libre" : "pomodoro"),
      freeTime:
        Array.isArray(d.settings?.freeTime) && d.settings.freeTime.length === 7 ? d.settings.freeTime : base.settings.freeTime,
    },
    tasks: Array.isArray(d.tasks) ? d.tasks : [],
    plans: Array.isArray(d.plans)
      ? d.plans.map((p) => ({ ...p, amount: p.amount ?? 3, understanding: p.understanding ?? 3, totalMinutes: p.totalMinutes ?? 0 }))
      : [],
    missions: Array.isArray(d.missions) && d.missions.length ? d.missions : base.missions,
    missionLog: Array.isArray(d.missionLog) ? d.missionLog : [],
    sessions: Array.isArray(d.sessions) ? d.sessions : [],
    parked: Array.isArray(d.parked) ? d.parked : [],
    activeDays: Array.isArray(d.activeDays) ? d.activeDays : [],
    notified: d.notified && typeof d.notified === "object" ? d.notified : {},
  };
}

export function isAppData(x: unknown): boolean {
  return !!x && typeof x === "object" && "settings" in x && "tasks" in x;
}
