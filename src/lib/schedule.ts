import { addDays, daysBetween, fromKey, minutesOfDay, todayKey } from "./dates";
import { computeStreak } from "./streak";
import type { AppData } from "./types";

export interface Reminder {
  at: string; // ISO (UTC)
  title: string;
  body: string;
  tag: string;
}

const at = (day: string, hhmm: string, deltaMin = 0) => {
  const d = fromKey(day);
  d.setMinutes(minutesOfDay(hhmm) + deltaMin);
  return d;
};

/**
 * Lista de próximos avisos (7 días) a partir de sus datos. Se manda al
 * servidor cada vez que cambia algo, así que siempre está al día.
 */
export function buildReminders(d: AppData, days = 7): Reminder[] {
  const s = d.settings;
  const pet = s.petName || "Blu";
  const now = Date.now();
  const today = todayKey();
  const out: Reminder[] = [];
  const push = (date: Date, title: string, body: string, tag: string) => {
    if (date.getTime() > now + 30_000) out.push({ at: date.toISOString(), title, body, tag });
  };
  const studiedToday = d.sessions.some((x) => x.date === today);
  const tidiedToday = d.missionLog.some((l) => l.date === today);
  const streak = computeStreak(d.activeDays);
  const many = s.reminderLevel === "muchos";

  for (let i = 0; i < days; i++) {
    const day = addDays(today, i);
    const sessions = d.tasks.filter((t) => t.planId && !t.done && t.date === day && t.time);

    // Sesiones del plan de exámenes: aviso antes y a la hora
    if (s.reminders.study) {
      sessions.forEach((t) => {
        const plan = d.plans.find((p) => p.id === t.planId);
        const what = plan?.title ?? "estudiar";
        if (s.reminderLevel !== "pocos") push(at(day, t.time!, -10), `📚 En 10 min: ${what}`, `${t.minutes} min. Ve preparando la mesa y el móvil en No molestar.`, `pre-${t.id}`);
        push(at(day, t.time!), `⏰ ¡Hora de ${what}!`, `${t.minutes} min. Abre la app y dale a Empezar. ${pet} cree en ti 🐒`, `go-${t.id}`);
        if (many) push(at(day, t.time!, 20), `${pet} sigue esperando 👀`, "¿Empezamos? Aunque sean 5 minutos, cuenta.", `nudge-${t.id}`);
      });

      // Sin sesiones de plan: aviso a su hora de estudio de siempre
      if (!sessions.length && !(i === 0 && studiedToday)) {
        push(at(day, s.studyTime), "¡Es tu hora buena! ☀️", "Solo 5 minutos y decides. Abrir los apuntes ya cuenta.", `study-${day}`);
        if (many) push(at(day, s.studyTime, 45), `${pet} sigue aquí 👀`, "5 minutitos. Venga, que tú puedes.", `study2-${day}`);
      }
    }

    if (s.reminders.tidy && s.reminderLevel !== "pocos" && !(i === 0 && tidiedToday)) {
      push(at(day, s.tidyTime), "Misión silla 👀", "2 minutos de orden y tu habitación te lo agradece.", `tidy-${day}`);
    }

    if (s.reminders.streak && s.reminderLevel !== "pocos" && !(i === 0 && streak.activeToday) && (streak.count > 0 || i > 0)) {
      push(at(day, "20:30"), "🔥 ¡Que no se apague la racha!", "Una misión de 2 minutos y la salvas.", `streak-${day}`);
    }
  }

  if (s.reminders.exams) {
    d.plans.forEach((p) => {
      const left = daysBetween(today, p.examDate);
      if (left >= 3) push(at(addDays(p.examDate, -3), "09:00"), `📅 ${p.title} en 3 días`, "Mira tu plan en «Hoy toca…». Vas bien.", `exam3-${p.id}`);
      if (left >= 1) push(at(addDays(p.examDate, -1), "19:00"), `📝 Mañana: ${p.title}`, "Repaso final suave y a dormir pronto. ¡Lo vas a bordar!", `exam1-${p.id}`);
    });
  }

  return out.sort((a, b) => a.at.localeCompare(b.at)).slice(0, 200);
}
