"use client";

import { ArrowRight, BookOpen, CalendarClock, Flame, Plus, Sparkles, Star, Zap } from "lucide-react";
import { useState } from "react";
import { breakDown } from "@/lib/breakdown";
import { greeting } from "@/lib/copy";
import { minutesOfDay, nowMinutes, relativeDay, todayKey } from "@/lib/dates";
import { ZONES } from "@/lib/defaults";
import { computeStreak } from "@/lib/streak";
import { canMarkImportant, MAX_IMPORTANT, nextMission, nextStep, tasksForToday, todayProgress, useStore } from "@/lib/store";
import { useUI } from "../app-ui";
import { Mascot, mascotMood } from "../Mascot";
import { Button, DoneCheck, inputCls, Pill, SectionTitle } from "../ui";

export function Hoy() {
  const { data, addTask, setTaskDone } = useStore();
  const ui = useUI();
  const [g] = useState(() => greeting(data.settings.name));
  const [newImp, setNewImp] = useState("");

  const today = todayKey();
  const studyTasks = tasksForToday(data);
  const nextTask = studyTasks[0];
  const step = nextTask ? nextStep(nextTask) : undefined;
  const mission = nextMission(data);
  const zone = ZONES.find((z) => z.id === mission?.zone);
  const important = data.tasks.filter((t) => t.important && t.date === today);
  const planToday = studyTasks.filter((t) => t.planId);
  const streak = computeStreak(data.activeDays);
  const prog = todayProgress(data);
  const { mood, line } = mascotMood(data);
  const actions = prog.steps + prog.missions + data.sessions.filter((s) => s.date === today && s.completed).length;
  const goal = 5;

  const studyAt = minutesOfDay(data.settings.studyTime);
  const now = nowMinutes();
  const studyHint =
    now < studyAt - 15
      ? `Tu hora buena es a las ${data.settings.studyTime} (mediodía = tu superpoder ☀️)`
      : now <= studyAt + 120
        ? "¡Es tu franja buena! Ahora rindes más que nunca."
        : "Tu franja buena ya pasó, pero 5 minutos siempre cuentan.";

  return (
    <div className="animate-fade-in">
      <section className="px-1 pt-2">
        <h1 className="font-display text-[2.1rem] font-extrabold leading-[1.05] tracking-tight">{g.hello}</h1>
        <p className="mt-2 text-lg text-ink-soft">{g.line}</p>
      </section>

      {/* El botón para empezar: lo primero que ve */}
      <section className="mt-6">
        <button
          onClick={() => ui.openPreFocus({ kind: "five", taskId: nextTask?.id })}
          className="animate-breathe relative w-full overflow-hidden rounded-[32px] bg-azul-600 px-6 pb-7 pt-6 text-left text-white active:translate-y-1"
          style={{ boxShadow: "0 10px 0 0 var(--color-azul-800)" }}
        >
          <span className="absolute -right-6 -top-8 h-36 w-36 rounded-full bg-azul-500" aria-hidden />
          <span className="absolute -bottom-10 right-16 h-24 w-24 rounded-full bg-sky/40" aria-hidden />
          <span className="relative flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-sun">
            <Zap className="h-4 w-4" fill="currentColor" /> Empieza aquí
          </span>
          <span className="font-display relative mt-1 block text-5xl font-extrabold leading-none">
            Solo 5 minutos
          </span>
          <span className="relative mt-3 block max-w-[17rem] text-base font-medium text-azul-50">
            {step ? (
              <>
                Primer paso: <b className="text-white">{step.text}</b>
              </>
            ) : (
              "Prometido: al acabar puedes parar. Lo difícil es empezar."
            )}
          </span>
        </button>
        <p className="mt-4 px-1 text-center text-sm font-semibold text-ink-soft">{studyHint}</p>
      </section>

      <SectionTitle>Qué toca ahora</SectionTitle>
      <div className="grid grid-cols-1 gap-3">
        <div className="card flex items-center gap-4 p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-azul-100 text-azul-700">
            <BookOpen className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-azul-700">Estudio</p>
            {nextTask ? (
              <>
                <p className="truncate font-bold">{nextTask.title}</p>
                <p className="line-clamp-2 text-sm text-ink-soft">{step?.text ?? "Último repaso"}</p>
              </>
            ) : (
              <p className="font-bold">Nada apuntado. Escríbelo y te lo troceo.</p>
            )}
          </div>
          {nextTask ? (
            <Button className="px-4" onClick={() => ui.openPreFocus({ kind: "focus", taskId: nextTask.id })}>
              Empezar
            </Button>
          ) : (
            <Button className="px-4" onClick={() => ui.setTab("estudiar")} aria-label="Ir a Estudiar">
              <ArrowRight className="h-5 w-5" />
            </Button>
          )}
        </div>

        {mission && (
          <div className="card flex items-center gap-4 p-4">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${zone?.color}`}>
              {zone?.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-pink">Orden · {mission.minutes} min</p>
              <p className="line-clamp-2 font-bold">{mission.text}</p>
            </div>
            <Button variant="pink" className="px-4" onClick={() => ui.startMission(mission)}>
              Vamos
            </Button>
          </div>
        )}
      </div>

      {planToday.length > 0 && (
        <>
          <SectionTitle>
            <span className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-azul-600" /> Hoy toca…
            </span>
          </SectionTitle>
          <div className="card divide-y divide-azul-50">
            {planToday.map((t) => {
              const plan = data.plans.find((p) => p.id === t.planId);
              return (
                <div key={t.id} className="flex items-center gap-3 p-4">
                  <DoneCheck done={t.done} onToggle={() => setTaskDone(t.id, !t.done)} label={`Hecho: ${t.title}`} />
                  <div className="min-w-0 flex-1">
                    <p className="strike font-bold" data-done={t.done}>
                      {t.title}
                    </p>
                    {plan && (
                      <p className="text-sm text-ink-soft">
                        Examen {relativeDay(plan.examDate)}
                        {t.date < today && " · se quedó de otro día"}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => ui.openPreFocus({ kind: "focus", taskId: t.id })}
                    aria-label={`Empezar ${t.title}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-azul-50 text-azul-700"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      <SectionTitle action={<Pill className="bg-sun text-ink">{important.filter((t) => t.done).length}/{MAX_IMPORTANT}</Pill>}>
        <span className="flex items-center gap-2">
          <Star className="h-5 w-5 text-sun" fill="currentColor" /> Tus 3 importantes
        </span>
      </SectionTitle>
      <div className="card p-2">
        {important.length === 0 && (
          <p className="px-3 pb-1 pt-3 text-ink-soft">Solo 3. Lo demás puede esperar (y no pasa nada).</p>
        )}
        {important.map((t) => (
          <div key={t.id} className="flex items-center gap-3 rounded-2xl p-2">
            <DoneCheck done={t.done} onToggle={() => setTaskDone(t.id, !t.done)} label={`Hecho: ${t.title}`} size="lg" />
            <p className="strike min-w-0 flex-1 text-lg font-bold" data-done={t.done}>
              <span className={t.done ? "text-ink-soft" : ""}>{t.title}</span>
            </p>
            {!t.done && (
              <button
                onClick={() => ui.openPreFocus({ kind: "focus", taskId: t.id })}
                aria-label={`Empezar ${t.title}`}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-azul-50 text-azul-700"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
        {canMarkImportant(data, today) ? (
          <form
            className="flex gap-2 p-2"
            onSubmit={(e) => {
              e.preventDefault();
              const title = newImp.trim();
              if (!title) return;
              addTask(title, breakDown(title), { important: true });
              setNewImp("");
              ui.toast("Apuntada y troceada en pasitos ✂️");
            }}
          >
            <label htmlFor="imp" className="sr-only">
              Nueva tarea importante
            </label>
            <input
              id="imp"
              className={inputCls}
              placeholder="Ej: estudiar tema 4 de historia"
              value={newImp}
              onChange={(e) => setNewImp(e.target.value)}
            />
            <Button type="submit" aria-label="Añadir importante" className="px-4">
              <Plus className="h-5 w-5" strokeWidth={3} />
            </Button>
          </form>
        ) : (
          <p className="px-3 pb-3 pt-1 text-sm font-semibold text-ink-soft">
            Ya tienes tus 3. Más sería agobio, y aquí no hacemos agobio 😌
          </p>
        )}
      </div>

      <SectionTitle>Tu día</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => ui.setTab("progreso")} className="card flex flex-col items-start p-4 text-left">
          <Flame className={`h-8 w-8 ${streak.count ? "text-orange" : "text-azul-200"}`} fill="currentColor" />
          <p className="font-display mt-2 text-4xl font-extrabold">{streak.count}</p>
          <p className="text-sm font-semibold text-ink-soft">
            {streak.count === 1 ? "día de racha" : "días de racha"}
            {!streak.activeToday && streak.count > 0 && " · ¡sálvala hoy!"}
          </p>
        </button>
        <div className="card flex flex-col items-start p-4">
          <Sparkles className="h-8 w-8 text-azul-600" />
          <p className="font-display mt-2 text-4xl font-extrabold">
            {Math.min(actions, goal)}
            <span className="text-xl text-ink-soft">/{goal}</span>
          </p>
          <p className="text-sm font-semibold text-ink-soft">cositas hechas hoy</p>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-azul-50">
            <div
              className="h-full rounded-full bg-linear-to-r from-azul-500 to-sky transition-all duration-700"
              style={{ width: `${Math.min(100, (actions / goal) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="card mt-3 flex items-center gap-3 p-4">
        <Mascot mood={mood} size={84} />
        <p className="font-semibold">{line}</p>
      </div>
    </div>
  );
}
