"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createDefaultData } from "./defaults";
import { todayKey, uid } from "./dates";
import { buildPlanTasks } from "./planner";
import { normalize, storage } from "./storage";
import type { AppData, ExamPlan, FocusSession, Mission, Settings, Step, Task, Zone } from "./types";

export const MAX_IMPORTANT = 3;

function withActive(d: AppData): AppData {
  const t = todayKey();
  return d.activeDays.includes(t) ? d : { ...d, activeDays: [...d.activeDays, t] };
}

function useStoreValue() {
  const [data, setData] = useState<AppData | null>(null);
  const first = useRef(true);

  useEffect(() => {
    const loaded = storage.load();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde el dispositivo
    setData(loaded ? normalize(loaded) : createDefaultData());
  }, []);

  useEffect(() => {
    if (!data) return;
    if (first.current) {
      first.current = false;
      return;
    }
    storage.save(data);
  }, [data]);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((d) => (d ? fn(d) : d));
  }, []);

  const actions = useMemo(
    () => ({
      update,
      setSettings: (patch: Partial<Settings>) =>
        update((d) => ({ ...d, settings: { ...d.settings, ...patch } })),

      addTask: (title: string, steps: Step[], opts: { date?: string; important?: boolean } = {}) => {
        const id = uid();
        update((d) => {
          const date = opts.date ?? todayKey();
          const canImportant = canMarkImportant(d, date);
          const task: Task = {
            id,
            title,
            steps,
            date,
            important: !!opts.important && canImportant,
            done: false,
            createdAt: new Date().toISOString(),
          };
          return { ...d, tasks: [task, ...d.tasks] };
        });
        return id;
      },
      updateTask: (id: string, patch: Partial<Task>) =>
        update((d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      deleteTask: (id: string) => update((d) => ({ ...d, tasks: d.tasks.filter((t) => t.id !== id) })),

      toggleStep: (taskId: string, stepId: string) =>
        update((d) => {
          let becameDone = false;
          const tasks = d.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const steps = t.steps.map((s) => {
              if (s.id !== stepId) return s;
              if (!s.done) becameDone = true;
              return { ...s, done: !s.done };
            });
            const allDone = steps.length > 0 && steps.every((s) => s.done);
            return { ...t, steps, done: allDone, doneAt: allDone ? todayKey() : undefined };
          });
          const next = { ...d, tasks };
          return becameDone ? withActive(next) : next;
        }),

      setTaskDone: (id: string, done: boolean) =>
        update((d) => {
          const next = {
            ...d,
            tasks: d.tasks.map((t) =>
              t.id === id ? { ...t, done, doneAt: done ? todayKey() : undefined } : t,
            ),
          };
          return done ? withActive(next) : next;
        }),

      /** Comprueba antes con canMarkImportant(); aquí también se protege. */
      toggleImportant: (id: string) =>
        update((d) => {
          const task = d.tasks.find((t) => t.id === id);
          if (!task) return d;
          if (!task.important && !canMarkImportant(d, task.date)) return d;
          return { ...d, tasks: d.tasks.map((t) => (t.id === id ? { ...t, important: !t.important } : t)) };
        }),

      addPlan: (title: string, examDate: string, topics: string[]) =>
        update((d) => {
          const plan: ExamPlan = { id: uid(), title, examDate, topics, createdAt: new Date().toISOString() };
          return { ...d, plans: [...d.plans, plan], tasks: [...d.tasks, ...buildPlanTasks(plan)] };
        }),
      deletePlan: (id: string) =>
        update((d) => ({
          ...d,
          plans: d.plans.filter((p) => p.id !== id),
          tasks: d.tasks.filter((t) => t.planId !== id),
        })),

      logMission: (missionId: string) =>
        update((d) => withActive({ ...d, missionLog: [...d.missionLog, { missionId, date: todayKey() }] })),
      addMission: (zone: Zone, text: string, minutes: number) =>
        update((d) => {
          const mission: Mission = { id: uid(), zone, text, minutes, custom: true };
          return { ...d, missions: [...d.missions, mission] };
        }),
      deleteMission: (id: string) => update((d) => ({ ...d, missions: d.missions.filter((m) => m.id !== id) })),

      addSession: (s: Omit<FocusSession, "id" | "date">) =>
        update((d) => {
          const session: FocusSession = { ...s, id: uid(), date: todayKey() };
          const next = { ...d, sessions: [...d.sessions, session].slice(-500) };
          return s.completed || s.minutes >= 3 ? withActive(next) : next;
        }),

      park: (text: string) =>
        update((d) => ({
          ...d,
          parked: [{ id: uid(), text, createdAt: new Date().toISOString(), done: false }, ...d.parked],
        })),
      toggleParked: (id: string) =>
        update((d) => ({ ...d, parked: d.parked.map((p) => (p.id === id ? { ...p, done: !p.done } : p)) })),
      deleteParked: (id: string) => update((d) => ({ ...d, parked: d.parked.filter((p) => p.id !== id) })),

      markNotified: (key: string) =>
        update((d) => ({ ...d, notified: { ...d.notified, [key]: todayKey() } })),

      replaceAll: (raw: unknown) => setData(normalize(raw)),
      resetAll: () => {
        storage.clear();
        setData(createDefaultData());
      },
    }),
    [update],
  );

  return { data, ...actions };
}

export type Store = ReturnType<typeof useStoreValue> & { data: AppData };

const Ctx = createContext<ReturnType<typeof useStoreValue> | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Solo usar por debajo de <Ready>, donde data ya está cargada. */
export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v || !v.data) throw new Error("Store no listo");
  return v as Store;
}

export function useRawStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("Falta StoreProvider");
  return v;
}

/* ---------- selectores ---------- */

export function canMarkImportant(d: AppData, date: string): boolean {
  return d.tasks.filter((t) => t.date === date && t.important && !t.done).length < MAX_IMPORTANT;
}

export function nextStep(task: Task): Step | undefined {
  return task.steps.find((s) => !s.done);
}

/** Tareas de estudio que tocan hoy (incluye atrasadas de planes). */
export function tasksForToday(d: AppData): Task[] {
  const t = todayKey();
  return d.tasks
    .filter((x) => !x.done && (x.date === t || (x.date < t && !!x.planId) || (x.date < t && x.important)))
    .sort((a, b) => Number(b.important) - Number(a.important) || a.date.localeCompare(b.date));
}

export function nextMission(d: AppData, zone?: Zone): Mission | undefined {
  const t = todayKey();
  const doneToday = new Set(d.missionLog.filter((l) => l.date === t).map((l) => l.missionId));
  const pool = d.missions.filter((m) => !doneToday.has(m.id) && (!zone || m.zone === zone));
  if (!pool.length) return undefined;
  // Rotación estable por día para que no salga siempre la misma
  const seed = Number(t.replaceAll("-", "")) + doneToday.size;
  return pool[seed % pool.length];
}

export function todayProgress(d: AppData) {
  const t = todayKey();
  const steps = d.tasks.reduce(
    (n, task) => n + task.steps.filter((s) => s.done).length * Number(task.date <= t),
    0,
  );
  const tasksDone = d.tasks.filter((x) => x.done && x.doneAt?.startsWith(t)).length;
  const missions = d.missionLog.filter((l) => l.date === t).length;
  const focusMin = d.sessions.filter((s) => s.date === t).reduce((n, s) => n + s.minutes, 0);
  const important = d.tasks.filter((x) => x.important && x.date === t);
  return {
    steps,
    tasksDone,
    missions,
    focusMin,
    importantTotal: important.length,
    importantDone: important.filter((x) => x.done).length,
  };
}
