import { breakDown } from "./breakdown";
import { addDays, daysBetween, fromKey, minutesOfDay, nowMinutes, todayKey, uid } from "./dates";
import type { AppData, ExamPlan, FreeSlot, Level, Task } from "./types";

/**
 * Planificador de exámenes.
 * 1. Estima cuánto hay que estudiar según cuánto temario hay y cuánto lo entiende.
 * 2. Lo reparte hacia atrás desde el día antes del examen, dentro de sus horas
 *    libres, a un ritmo cómodo (2 bloques al día). Si no cabe, sube el ritmo.
 * 3. El primer día que sale es «cuándo empezar»; cada sesión tiene hora y minutos.
 */

export const BLOCK = 25;
const COMFY_PER_DAY = 2 * BLOCK;

export const AMOUNT_LABELS = ["Poquito", "Normal", "Bastante", "Mucho", "Un montón"] as const;
export const AMOUNT_EMOJI = ["🍃", "📄", "📚", "🧱", "🏔️"] as const;
export const UNDERSTAND_LABELS = ["Ni idea", "Me cuesta", "Más o menos", "Bien", "Lo domino"] as const;
export const UNDERSTAND_EMOJI = ["😵‍💫", "😬", "🤔", "🙂", "😎"] as const;

const BASE_MINUTES = [75, 150, 275, 425, 600];
const UNDERSTAND_FACTOR = [1.6, 1.35, 1.1, 0.9, 0.7];

export function estimateMinutes(amount: Level, understanding: Level): number {
  const raw = BASE_MINUTES[amount - 1] * UNDERSTAND_FACTOR[understanding - 1];
  return Math.max(2, Math.ceil(raw / BLOCK)) * BLOCK;
}

export interface Session {
  date: string;
  time: string;
  minutes: number;
}

export interface Schedule {
  sessions: Session[];
  startDate?: string;
  totalMinutes: number;
  scheduledMinutes: number;
  /** ok: ritmo cómodo · justa: hay que apretar · nodatiempo: no cabe todo */
  status: "ok" | "justa" | "nodatiempo";
  maxPerDay: number;
}

const hhmm = (min: number) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** Minutos ya ocupados cada día por otros planes (tareas sin hacer). */
export function busyByDay(d: AppData, exceptPlanId?: string): Map<string, number> {
  const m = new Map<string, number>();
  d.tasks.forEach((t) => {
    if (!t.planId || t.done || t.planId === exceptPlanId || !t.minutes) return;
    m.set(t.date, (m.get(t.date) ?? 0) + t.minutes);
  });
  return m;
}

export function scheduleStudy(
  totalMinutes: number,
  examDate: string,
  free: FreeSlot[],
  busy: Map<string, number> = new Map(),
  today = todayKey(),
): Schedule {
  const last = addDays(examDate, -1);
  const days: string[] = [];
  for (let d = today; d <= last; d = addDays(d, 1)) days.push(d);

  // Hueco libre de cada día (hoy solo si aún no ha pasado su franja)
  const capacity = new Map<string, { start: number; free: number }>();
  days.forEach((d) => {
    const slot = free[fromKey(d).getDay()];
    let start = minutesOfDay(slot.start) + (busy.get(d) ?? 0);
    let end = minutesOfDay(slot.start) + slot.minutes;
    if (d === today) {
      const now = nowMinutes() + 10;
      start = Math.max(start, now);
      end = Math.max(start, end);
    }
    const freeMin = Math.floor(Math.max(0, end - start) / BLOCK) * BLOCK;
    capacity.set(d, { start, free: freeMin });
  });

  const allocate = (cap: number) => {
    const plan = new Map<string, number>();
    let left = totalMinutes;
    for (let i = days.length - 1; i >= 0 && left > 0; i--) {
      const c = capacity.get(days[i])!;
      const take = Math.min(cap, c.free, Math.ceil(left / BLOCK) * BLOCK);
      if (take >= BLOCK) {
        plan.set(days[i], take);
        left -= take;
      }
    }
    return { plan, left };
  };

  let maxPerDay = COMFY_PER_DAY;
  let { plan, left } = allocate(maxPerDay);
  let status: Schedule["status"] = "ok";
  while (left > 0 && maxPerDay < 240) {
    maxPerDay += BLOCK;
    status = "justa";
    ({ plan, left } = allocate(maxPerDay));
  }
  if (left > 0) status = "nodatiempo";

  const sessions = days
    .filter((d) => plan.has(d))
    .map((d) => ({ date: d, time: hhmm(capacity.get(d)!.start), minutes: plan.get(d)! }));

  return {
    sessions,
    startDate: sessions[0]?.date,
    totalMinutes,
    scheduledMinutes: sessions.reduce((n, s) => n + s.minutes, 0),
    status,
    maxPerDay: Math.max(0, ...sessions.map((s) => s.minutes)),
  };
}

/** Convierte las sesiones en tareas con contenido: estudiar → repasar → simulacro. */
export function buildPlanTasks(plan: ExamPlan, sessions: Session[]): Task[] {
  const topics = plan.topics.length ? plan.topics : ["el temario"];
  const n = sessions.length;
  const createdAt = new Date().toISOString();
  const simulacro = n >= 2;
  const studyCount = Math.max(1, Math.ceil((n - (simulacro ? 1 : 0)) * 0.7));

  // Qué tema toca en cada sesión de estudio (si hay más sesiones que temas, se parte en partes)
  const topicOf = Array.from({ length: studyCount }, (_, j) => Math.min(topics.length - 1, Math.floor((j * topics.length) / studyCount)));

  const titleFor = (i: number): { title: string; seed: string } => {
    if (simulacro && i === n - 1) return { title: `${plan.title}: simulacro y repaso final`, seed: `repasar ${plan.title}` };
    if (i < studyCount) {
      const idx = topicOf[i];
      const total = topicOf.filter((x) => x === idx).length;
      const part = total > 1 ? ` (parte ${i - topicOf.indexOf(idx) + 1}/${total})` : "";
      return { title: `${plan.title}: estudiar ${topics[idx]}${part}`, seed: `estudiar ${topics[idx]} ${plan.title}` };
    }
    const r = topics[(i - studyCount) % topics.length];
    return { title: `${plan.title}: repasar ${r}`, seed: `repasar ${r} ${plan.title}` };
  };

  return sessions.map((s, i) => {
    const { title, seed } = titleFor(i);
    const steps = breakDown(seed);
    return {
      id: uid(),
      title,
      steps: title.includes("simulacro") ? steps.slice(-3) : steps,
      date: s.date,
      time: s.time,
      minutes: s.minutes,
      important: false,
      done: false,
      createdAt,
      planId: plan.id,
    };
  });
}

export function planSummary(s: Schedule): string {
  if (!s.startDate) return "No queda ningún hueco libre antes del examen. Revisa tus horas libres.";
  const days = s.sessions.length;
  const avg = Math.round(s.scheduledMinutes / days / 5) * 5;
  const h = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ""}` : `${m} min`);
  return `${days} ${days === 1 ? "día" : "días"} · unos ${h(avg)} al día · ${h(s.scheduledMinutes)} en total`;
}

export function daysUntil(date: string) {
  return daysBetween(todayKey(), date);
}
