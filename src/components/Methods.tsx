"use client";

import { CalendarPlus, Play } from "lucide-react";
import { useState } from "react";
import { addDays, todayKey, uid } from "@/lib/dates";
import { TECHNIQUES, type Technique, timerById, TIMERS } from "@/lib/methods";
import { useStore } from "@/lib/store";
import { useUI } from "./app-ui";
import { Button, inputCls, Sheet } from "./ui";

/** Elegir temporizador: Pomodoro, Mini, 52/17, Bloque 90. */
export function TimerPicker({ dark = false }: { dark?: boolean }) {
  const { data, setSettings } = useStore();
  const s = data.settings;
  const current = timerById(s.method);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {TIMERS.map((t) => {
          const on = s.method === t.id;
          return (
            <button
              key={t.id}
              aria-pressed={on}
              onClick={() => setSettings({ method: t.id, focusMinutes: t.focus, breakMinutes: t.brk, blocksInARow: 0 })}
              className={`flex min-h-16 items-center gap-2 rounded-2xl p-3 text-left transition active:scale-95 ${
                on ? "bg-sun text-ink" : dark ? "bg-white/15" : "bg-white text-ink"
              }`}
            >
              <span className="text-2xl" aria-hidden>
                {t.emoji}
              </span>
              <span>
                <span className="block font-extrabold leading-tight">{t.name}</span>
                <span className={`block text-xs font-semibold ${on ? "" : "opacity-75"}`}>
                  {t.focus}′ + {t.brk}′
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className={`mt-2 text-sm ${dark ? "text-azul-50" : "text-ink-soft"}`}>
        {current
          ? current.desc
          : `A tu medida: ${s.focusMinutes} min de foco y ${s.breakMinutes} de descanso.`}
      </p>
    </div>
  );
}

/** Fichas de técnicas de estudio con sus pasos. */
export function Techniques() {
  const [open, setOpen] = useState<Technique | null>(null);
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {TECHNIQUES.map((t) => (
          <button key={t.id} onClick={() => setOpen(t)} className="card flex min-h-28 flex-col items-start p-4 text-left active:scale-[0.98]">
            <span className="text-3xl" aria-hidden>
              {t.emoji}
            </span>
            <span className="font-display mt-1 text-lg font-extrabold leading-tight">{t.name}</span>
            <span className="text-xs font-semibold text-ink-soft">{t.best}</span>
          </button>
        ))}
      </div>
      <Sheet open={!!open} onClose={() => setOpen(null)} title={open ? `${open.emoji} ${open.name}` : undefined}>
        {open && <TechniqueBody key={open.id} t={open} onDone={() => setOpen(null)} />}
      </Sheet>
    </>
  );
}

function TechniqueBody({ t, onDone }: { t: Technique; onDone: () => void }) {
  const store = useStore();
  const ui = useUI();
  const [topic, setTopic] = useState("");
  const name = topic.trim() || "el tema";
  const steps = t.steps(name);

  const start = () => {
    const id = store.addTask(
      `${t.name}: ${name}`,
      steps.map((s) => ({ id: uid(), text: s.text, minutes: s.minutes, done: false })),
    );
    if (t.reviewDays) {
      t.reviewDays.forEach((d) =>
        store.addTask(
          `Repaso (${d === 1 ? "1 día" : `${d} días`}): ${name}`,
          [
            { id: uid(), text: "Sin mirar, escribe todo lo que recuerdes del tema", minutes: 5, done: false },
            { id: uid(), text: "Compara con los apuntes y repasa lo que faltaba", minutes: 7, done: false },
          ],
          { date: addDays(todayKey(), d) },
        ),
      );
      ui.toast("Repasos programados para dentro de 1, 3 y 7 días 📆", "mint");
    }
    onDone();
    ui.openPreFocus({ kind: "focus", taskId: id });
  };

  return (
    <div className="space-y-4">
      <p>{t.what}</p>
      <p className="rounded-2xl bg-sun/30 p-3 text-sm font-semibold">✨ Va genial para: {t.best.toLowerCase()}</p>
      <label className="block">
        <span className="mb-1 block font-bold">¿Con qué tema? (opcional)</span>
        <input className={inputCls} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Ej: tema 4 de historia" />
      </label>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 rounded-2xl bg-azul-50/70 p-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-azul-600 text-sm font-extrabold text-white">
              {i + 1}
            </span>
            <span className="text-[15px]">
              {s.text} <span className="text-xs font-bold text-azul-700">· {s.minutes}′</span>
            </span>
          </li>
        ))}
      </ol>
      <Button className="w-full" onClick={start}>
        {t.reviewDays ? <CalendarPlus className="h-5 w-5" /> : <Play className="h-5 w-5" fill="currentColor" />}
        {t.reviewDays ? "Empezar y programar repasos" : "Probarlo ahora"}
      </Button>
    </div>
  );
}
