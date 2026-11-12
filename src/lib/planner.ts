import { breakDown } from "./breakdown";
import { addDays, daysBetween, todayKey, uid } from "./dates";
import type { ExamPlan, Task } from "./types";

/**
 * Planificador hacia atrás: reparte el trabajo entre hoy y el día anterior
 * al examen. Primero estudiar cada tema, luego repasos y un simulacro final.
 */
export function buildPlanTasks(plan: ExamPlan): Task[] {
  const today = todayKey();
  const lastDay = addDays(plan.examDate, -1);
  const dayCount = Math.max(1, daysBetween(today, lastDay) + 1);
  const days = Array.from({ length: dayCount }, (_, i) => addDays(today, i));

  const topics = plan.topics.length ? plan.topics : [plan.title];
  const sessions: string[] = [];
  topics.forEach((t) => sessions.push(`Estudiar ${t}`));

  const capacity = dayCount * 2;
  // Repasos si hay hueco
  if (sessions.length + topics.length + 1 <= capacity) {
    topics.forEach((t) => sessions.push(`Repasar ${t}`));
  }
  sessions.push(`Simulacro: preguntas tipo examen de ${plan.title}`);

  // Si no cabe, juntamos sesiones de dos en dos
  let list = sessions;
  while (list.length > capacity) {
    const merged: string[] = [];
    for (let i = 0; i < list.length; i += 2) {
      merged.push(list[i + 1] ? `${list[i]} + ${list[i + 1].replace(/^(Estudiar|Repasar) /, "")}` : list[i]);
    }
    list = merged;
  }

  const n = list.length;
  const createdAt = new Date().toISOString();
  return list.map((title, i) => {
    // El simulacro siempre el último día disponible
    const idx = i === n - 1 ? dayCount - 1 : Math.min(dayCount - 1, Math.floor((i * dayCount) / n));
    const isSim = title.startsWith("Simulacro");
    return {
      id: uid(),
      title,
      steps: isSim
        ? breakDown(`repasar ${plan.title}`).slice(-3)
        : breakDown(title.startsWith("Estudiar") ? `estudiar ${title.slice(9)}` : title),
      date: days[idx],
      important: false,
      done: false,
      createdAt,
      planId: plan.id,
    };
  });
}
