import { addDays, todayKey, weekStart } from "./dates";

export interface StreakInfo {
  count: number;
  activeToday: boolean;
  /** Fechas tapadas con el comodín dentro de la racha actual. */
  wildcardDays: string[];
  wildcardAvailableThisWeek: boolean;
}

/**
 * Racha de días seguidos con 1 comodín por semana (lunes-domingo).
 * Si hoy aún no ha hecho nada, la racha sigue viva (cuenta desde ayer).
 */
export function computeStreak(activeDays: string[], today = todayKey()): StreakInfo {
  const set = new Set(activeDays);
  const activeToday = set.has(today);
  const usedWeeks = new Set<string>();
  const wildcardDays: string[] = [];
  let count = 0;
  let day = activeToday ? today : addDays(today, -1);

  for (let guard = 0; guard < 3660; guard++) {
    if (set.has(day)) {
      count++;
    } else {
      const wk = weekStart(day);
      // Comodín: solo si el día anterior sí fue activo (no tapa huecos de días seguidos)
      const prevActive = set.has(addDays(day, -1));
      if (!usedWeeks.has(wk) && prevActive) {
        usedWeeks.add(wk);
        wildcardDays.push(day);
      } else {
        break;
      }
    }
    day = addDays(day, -1);
  }

  return {
    count,
    activeToday,
    wildcardDays,
    wildcardAvailableThisWeek: !usedWeeks.has(weekStart(today)),
  };
}
