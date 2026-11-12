import type { TimerId } from "./methods";

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
  /** Hora de empezar (HH:MM) si viene del plan de exámenes. */
  time?: string;
  /** Minutos previstos para la sesión. */
  minutes?: number;
  important: boolean;
  done: boolean;
  doneAt?: string;
  createdAt: string;
  planId?: string;
}

export type Level = 1 | 2 | 3 | 4 | 5;

export interface ExamPlan {
  id: string;
  title: string;
  examDate: string;
  topics: string[];
  createdAt: string;
  /** Cuánto temario (1 poquito – 5 un montón). */
  amount: Level;
  /** Cuánto lo entiende (1 ni idea – 5 lo domina). */
  understanding: Level;
  totalMinutes: number;
}

/** Horas libres de un día de la semana. */
export interface FreeSlot {
  start: string; // "HH:MM"
  minutes: number; // 0 = ese día no estudia
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
  /** Cómo le habla la app: en femenino o en masculino. */
  gender: "f" | "m";
  /** Cómo se llama su mono. */
  petName: string;
  /** Horas libres por día de la semana (0 = domingo … 6 = sábado). */
  freeTime: FreeSlot[];
  studyTime: string; // "HH:MM"
  tidyTime: string;
  /** Temporizador elegido (pomodoro, 52/17…) o «libre» si ajustó los minutos a mano. */
  method: TimerId;
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
