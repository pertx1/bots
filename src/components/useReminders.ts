"use client";

import { useEffect, useRef } from "react";
import { daysBetween, minutesOfDay, nowMinutes, relativeDay, todayKey } from "@/lib/dates";
import { systemNotify } from "@/lib/notify";
import { pushEnabledHere, syncPush } from "@/lib/push";
import { computeStreak } from "@/lib/streak";
import { useStore } from "@/lib/store";
import { useUI } from "./app-ui";

/**
 * Recordatorios locales mientras la app está abierta (o en segundo plano
 * reciente). Cada aviso se manda como mucho una vez por clave y día.
 */
export function useReminders() {
  const store = useStore();
  const ui = useUI();
  const ref = useRef({ store, ui });
  useEffect(() => {
    ref.current = { store, ui };
  });

  useEffect(() => {
    const check = () => {
      const { store, ui } = ref.current;
      const d = store.data;
      if (!d.settings.onboarded || ui.focus) return;
      const t = todayKey();
      const now = nowMinutes();
      const level = d.settings.reminderLevel;
      const sent = (k: string) => d.notified[k]?.slice(0, 10) === t;
      const fire = (k: string, title: string, body: string) => {
        if (sent(k)) return false;
        store.markNotified(k);
        ui.toast(`${title} ${body}`, "sun");
        // Si hay push, el aviso del sistema ya llega desde el servidor
        if (!pushEnabledHere()) void systemNotify(title, body);
        return true;
      };
      const studiedToday = d.sessions.some((s) => s.date === t);

      // Sesiones del plan de exámenes de hoy
      if (d.settings.reminders.study) {
        d.tasks
          .filter((x) => x.planId && !x.done && x.date === t && x.time)
          .forEach((x) => {
            const startAt = minutesOfDay(x.time!);
            if (now >= startAt - 10 && now < startAt) fire(`pre-${x.id}`, "📚 En 10 min te toca:", x.title);
            else if (now >= startAt && now < startAt + 60) fire(`go-${x.id}`, "⏰ ¡Ahora!", `${x.title} · ${x.minutes} min`);
          });
      }

      // Hora de estudiar (+ insistencia si «muchos»)
      if (d.settings.reminders.study && !studiedToday) {
        const at = minutesOfDay(d.settings.studyTime);
        if (now >= at && now < at + 240) {
          if (!fire("study", "¡Es tu hora buena! ☀️", "Solo 5 minutos y decides. Venga, que tú puedes.")) {
            const nudges = level === "muchos" ? 3 : level === "normal" ? 1 : 0;
            for (let i = 1; i <= nudges; i++) {
              if (now >= at + i * 45 && fire(`study-${i}`, `${d.settings.petName} sigue aquí 👀`, "5 minutitos. Abrir los apuntes ya cuenta.")) break;
            }
          }
        }
      }

      // Hora de recoger
      if (d.settings.reminders.tidy && level !== "pocos") {
        const at = minutesOfDay(d.settings.tidyTime);
        const tidied = d.missionLog.some((l) => l.date === t);
        if (!tidied && now >= at && now < at + 180) fire("tidy", "Misión silla 👀", "2 minutos de orden y la habitación te lo agradece.");
      }

      // Exámenes cerca
      if (d.settings.reminders.exams) {
        const soon = d.plans.filter((p) => {
          const left = daysBetween(t, p.examDate);
          return left >= 0 && left <= 3;
        });
        if (soon[0] && now >= 9 * 60)
          fire("exam", "📅 Examen cerca", `${soon[0].title} es ${relativeDay(soon[0].examDate)}. Mira «Hoy toca…».`);
      }

      // Racha en peligro
      if (d.settings.reminders.streak && level !== "pocos") {
        const s = computeStreak(d.activeDays);
        if (s.count > 0 && !s.activeToday && now >= 20 * 60)
          fire("streak", `🔥 ¡Tu racha de ${s.count}!`, "Una misión de 2 minutos y la salvas.");
      }
    };

    const first = setTimeout(check, 4000);
    const id = setInterval(check, 30_000);
    const onVis = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);
}

/** Manda al servidor la lista de próximos avisos cuando cambian los datos. */
export function usePushSync() {
  const { data } = useStore();
  useEffect(() => {
    const id = setTimeout(() => void syncPush(data), 3000);
    return () => clearTimeout(id);
  }, [data]);
}
