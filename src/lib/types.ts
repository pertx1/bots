export type Energy = 1 | 2 | 3;
export type Zone = "habitacion" | "ropa" | "escritorio";
export type SoundKind = "none" | "white" | "brown" | "rain";
export type ReminderLevel = "pocos" | "normal" | "muchos";

export interface Step {
  id: string;
  text: string;
  minutes: number;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  steps: Step[];
  /** Día para el que está planificada (YYYY-MM-DD). */
  date: string;
  important: boolean;
  done: boolean;
  doneAt?: string;
  createdAt: string;
  planId?: string;
}

export interface ExamPlan {
  id: string;
  title: string;
  examDate: string;
  topics: string[];
  createdAt: string;
}

export interface Mission {
  id: string;
  zone: Zone;
  text: string;
  minutes: number;
  custom?: boolean;
}

export interface MissionLog {
  missionId: string;
  date: string;
}

export interface FocusSession {
  id: string;
  date: string;
  minutes: number;
  completed: boolean;
  exits: number;
  kind: "five" | "focus";
  label?: string;
}

export interface ParkedThought {
  id: string;
  text: string;
  createdAt: string;
  done: boolean;
}

export interface Settings {
  name: string;
  studyTime: string; // "HH:MM"
  tidyTime: string;
  focusMinutes: number;
  breakMinutes: number;
  reminders: {
    study: boolean;
    tidy: boolean;
    exams: boolean;
    streak: boolean;
  };
  reminderLevel: ReminderLevel;
  sound: SoundKind;
  onboarded: boolean;
  /** Bloques completos seguidos (para sugerir subir 5 min). */
  blocksInARow: number;
  lastSuggestionAt?: string;
}

export interface AppData {
  version: 1;
  settings: Settings;
  tasks: Task[];
  plans: ExamPlan[];
  missions: Mission[];
  missionLog: MissionLog[];
  sessions: FocusSession[];
  parked: ParkedThought[];
  /** Días (YYYY-MM-DD) en los que hizo algo. */
  activeDays: string[];
  /** Avisos ya enviados: clave -> fecha. */
  notified: Record<string, string>;
}
