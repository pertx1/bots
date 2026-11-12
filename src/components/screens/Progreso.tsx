"use client";

import { Flame, LogOut, Sparkles, Timer, Trophy } from "lucide-react";
import { addDays, prettyDate, shortDay, todayKey, weekStart } from "@/lib/dates";
import { computeStreak } from "@/lib/streak";
import { useStore } from "@/lib/store";
import { Mascot, mascotMood } from "../Mascot";
import { SectionTitle } from "../ui";

export function Progreso() {
  const { data } = useStore();
  const today = todayKey();
  const streak = computeStreak(data.activeDays);
  const { mood, line } = mascotMood(data);
  const active = new Set(data.activeDays);
  const wild = new Set(streak.wildcardDays);
  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));

  const ws = weekStart(today);
  const weekSessions = data.sessions.filter((s) => s.date >= ws);
  const focusMin = weekSessions.reduce((n, s) => n + s.minutes, 0);
  const missions = data.missionLog.filter((l) => l.date >= ws).length;
  const tasksDone = data.tasks.filter((t) => t.done && t.doneAt && t.doneAt.slice(0, 10) >= ws).length;

  const recent = data.sessions.filter((s) => s.kind === "focus" || s.kind === "five").slice(-10);
  const maxExits = Math.max(3, ...recent.map((s) => s.exits));
  const half = Math.floor(recent.length / 2);
  const avg = (arr: typeof recent) => (arr.length ? arr.reduce((n, s) => n + s.exits, 0) / arr.length : 0);
  const improving = recent.length >= 4 && avg(recent.slice(half)) < avg(recent.slice(0, half));

  return (
    <div className="animate-fade-in">
      <h1 className="font-display px-1 pt-2 text-[2.1rem] font-extrabold leading-tight tracking-tight">Progreso</h1>

      <section className="card relative mt-4 overflow-hidden p-5 text-center">
        <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-azul-100 to-transparent" aria-hidden />
        <Mascot mood={mood} size={150} className="relative mx-auto" />
        <p className="font-display relative mt-1 text-lg font-bold">Blu</p>
        <p className="relative mx-auto mt-1 max-w-xs text-ink-soft">{line}</p>
      </section>

      <section className="mt-4 overflow-hidden rounded-[28px] bg-linear-to-br from-orange to-pink p-5 text-ink">
        <div className="flex items-center gap-4">
          <Flame className="h-14 w-14" fill="currentColor" />
          <div>
            <p className="font-display text-5xl font-extrabold leading-none">{streak.count}</p>
            <p className="font-bold">{streak.count === 1 ? "día seguido" : "días seguidos"}</p>
          </div>
        </div>
        <p className="mt-3 text-sm font-semibold">
          {streak.wildcardAvailableThisWeek
            ? "🃏 Comodín de esta semana: disponible. Si un día no puedes, no pierdes la racha."
            : "🃏 Comodín de esta semana: ya usado. ¡El lunes tienes otro!"}
        </p>
        {!streak.activeToday && streak.count > 0 && (
          <p className="mt-1 text-sm font-bold">Hoy aún no cuenta: una misión de 2 min la salva 💪</p>
        )}
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {days.map((d) => {
            const on = active.has(d);
            const w = wild.has(d);
            return (
              <div key={d} className="flex flex-col items-center gap-1">
                <span
                  title={prettyDate(d)}
                  className={`flex aspect-square w-full items-center justify-center rounded-xl text-sm font-extrabold ${
                    on ? "bg-white text-orange" : w ? "bg-white/60" : "bg-white/25"
                  } ${d === today ? "ring-[3px] ring-ink" : ""}`}
                >
                  {on ? "🔥" : w ? "🃏" : ""}
                </span>
                <span className="text-[11px] font-bold">{shortDay(d)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <SectionTitle>Esta semana</SectionTitle>
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<Timer className="h-6 w-6 text-azul-600" />} value={focusMin} label="min de foco" />
        <Stat icon={<Sparkles className="h-6 w-6 text-pink" />} value={missions} label="misiones" />
        <Stat icon={<Trophy className="h-6 w-6 text-sun" />} value={tasksDone} label="tareas" />
      </div>

      <SectionTitle>
        <span className="flex items-center gap-2">
          <LogOut className="h-5 w-5 text-azul-600" /> Veces que saliste de la app
        </span>
      </SectionTitle>
      <div className="card p-5">
        {recent.length === 0 ? (
          <p className="text-ink-soft">Cuando hagas bloques de foco verás aquí cuántas veces te fuiste. Spoiler: cada vez menos.</p>
        ) : (
          <>
            <div className="flex h-32 items-end gap-2" role="img" aria-label="Salidas por sesión, de la más antigua a la más reciente">
              {recent.map((s) => (
                <div key={s.id} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-xs font-bold text-ink-soft">{s.exits}</span>
                  <div
                    className={`w-full rounded-t-lg ${s.exits === 0 ? "bg-mint" : "bg-azul-400"}`}
                    style={{ height: `${Math.max(6, (s.exits / maxExits) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm font-semibold">
              {improving
                ? "📉 ¡Cada vez sales menos! Tu concentración está subiendo de nivel."
                : "Menos es mejor. Truco: No molestar antes de empezar."}
            </p>
          </>
        )}
        <p className="mt-2 text-sm text-ink-soft">
          Tu bloque ahora: <b className="text-ink">{data.settings.focusMinutes} min</b>. Si encadenas 3, te propongo subir 5.
        </p>
      </div>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="card flex flex-col items-start p-4">
      {icon}
      <p className="font-display mt-2 text-3xl font-extrabold">{value}</p>
      <p className="text-xs font-semibold text-ink-soft">{label}</p>
    </div>
  );
}
