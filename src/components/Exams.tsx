"use client";

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Clock, Play, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { addDays, daysBetween, fromKey, prettyDate, relativeDay, toKey, todayKey } from "@/lib/dates";
import {
  AMOUNT_EMOJI,
  AMOUNT_LABELS,
  busyByDay,
  estimateMinutes,
  planSummary,
  scheduleStudy,
  UNDERSTAND_EMOJI,
  UNDERSTAND_LABELS,
} from "@/lib/planner";
import { useStore } from "@/lib/store";
import type { FreeSlot, Level } from "@/lib/types";
import { useUI } from "./app-ui";
import { Button, DoneCheck, inputCls, Sheet } from "./ui";

const WEEK = ["L", "M", "X", "J", "V", "S", "D"];
const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const fmtMin = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60}` : ""}` : `${m} min`);

/* ---------------- Calendario ---------------- */

export function ExamCalendar({ onAdd }: { onAdd: () => void }) {
  const { data } = useStore();
  const today = todayKey();
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [selected, setSelected] = useState(today);

  const exams = useMemo(() => {
    const m = new Map<string, string[]>();
    data.plans.forEach((p) => m.set(p.examDate, [...(m.get(p.examDate) ?? []), p.title]));
    return m;
  }, [data.plans]);
  const study = useMemo(() => {
    const m = new Map<string, { n: number; done: number }>();
    data.tasks.forEach((t) => {
      if (!t.planId) return;
      const v = m.get(t.date) ?? { n: 0, done: 0 };
      m.set(t.date, { n: v.n + 1, done: v.done + Number(t.done) });
    });
    return m;
  }, [data.tasks]);

  const first = fromKey(`${month}-01`);
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toKey(new Date(first.getFullYear(), first.getMonth(), i + 1))),
  ];
  const shift = (n: number) => {
    const d = new Date(first.getFullYear(), first.getMonth() + n, 1);
    setMonth(toKey(d).slice(0, 7));
  };

  const dayTasks = data.tasks.filter((t) => t.planId && t.date === selected).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  const dayExams = exams.get(selected) ?? [];

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => shift(-1)} aria-label="Mes anterior" className="flex h-11 w-11 items-center justify-center rounded-full bg-azul-50 text-azul-700">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="font-display text-lg font-extrabold">
          {MONTHS[first.getMonth()]} {first.getFullYear()}
        </p>
        <button onClick={() => shift(1)} aria-label="Mes siguiente" className="flex h-11 w-11 items-center justify-center rounded-full bg-azul-50 text-azul-700">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-ink-soft">
        {WEEK.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <span key={`e${i}`} />;
          const isExam = exams.has(d);
          const st = study.get(d);
          const sel = d === selected;
          return (
            <button
              key={d}
              onClick={() => setSelected(d)}
              aria-label={`${prettyDate(d)}${isExam ? ", examen" : ""}${st ? `, ${st.n} sesiones de estudio` : ""}`}
              aria-pressed={sel}
              className={`relative flex aspect-square min-h-11 flex-col items-center justify-center rounded-xl text-sm font-bold transition ${
                isExam ? "bg-pink text-ink" : sel ? "bg-azul-600 text-white" : d < today ? "text-ink-soft/50" : "bg-azul-50/60"
              } ${sel && isExam ? "ring-[3px] ring-azul-600" : ""} ${d === today && !sel ? "ring-2 ring-azul-400" : ""}`}
            >
              {Number(d.slice(8))}
              {isExam && <span className="text-[10px] leading-none">📝</span>}
              {!isExam && st && (
                <span
                  className={`absolute bottom-1 h-1.5 w-1.5 rounded-full ${st.done === st.n ? "bg-mint" : sel ? "bg-white" : "bg-azul-600"}`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl bg-azul-50/60 p-3">
        <p className="font-bold capitalize">{relativeDay(selected)}</p>
        {dayExams.map((t) => (
          <p key={t} className="mt-1 font-bold text-pink">📝 Examen: {t}</p>
        ))}
        {dayTasks.length === 0 && dayExams.length === 0 && <p className="text-sm text-ink-soft">Día libre de exámenes 🌴</p>}
        {dayTasks.map((t) => (
          <p key={t.id} className={`mt-1 flex items-center gap-2 text-sm ${t.done ? "text-ink-soft line-through" : ""}`}>
            <Clock className="h-4 w-4 shrink-0 text-azul-600" />
            <b>{t.time}</b> · {t.minutes} min · {t.title}
          </p>
        ))}
      </div>
      <Button className="mt-3 w-full" onClick={onAdd}>
        <CalendarDays className="h-5 w-5" /> Añadir examen
      </Button>
    </div>
  );
}

/* ---------------- Barra deslizante con caritas ---------------- */

function LevelSlider({
  label,
  value,
  onChange,
  labels,
  emoji,
  id,
}: {
  label: string;
  value: Level;
  onChange: (v: Level) => void;
  labels: readonly string[];
  emoji: readonly string[];
  id: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-end justify-between gap-2">
        <label htmlFor={id} className="font-bold">
          {label}
        </label>
        <span key={value} className="animate-pop font-display text-lg font-extrabold text-azul-700">
          {emoji[value - 1]} {labels[value - 1]}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as Level)}
        aria-valuetext={labels[value - 1]}
        className="range-june w-full"
        style={{ "--fill": `${((value - 1) / 4) * 100}%` } as React.CSSProperties}
      />
      <div className="flex justify-between text-[11px] font-semibold text-ink-soft">
        <span>{labels[0]}</span>
        <span>{labels[4]}</span>
      </div>
    </div>
  );
}

/* ---------------- Horas libres ---------------- */

export function FreeTimeEditor({ value, onChange }: { value: FreeSlot[]; onChange: (v: FreeSlot[]) => void }) {
  // Lunes primero
  const order = [1, 2, 3, 4, 5, 6, 0];
  const set = (i: number, patch: Partial<FreeSlot>) => onChange(value.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  return (
    <div className="space-y-2">
      {order.map((i) => {
        const s = value[i];
        return (
          <div key={i} className="rounded-2xl bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="w-24 font-bold">{DAY_NAMES[i]}</span>
              <input
                type="time"
                aria-label={`Hora de empezar el ${DAY_NAMES[i]}`}
                value={s.start}
                onChange={(e) => set(i, { start: e.target.value || s.start })}
                disabled={s.minutes === 0}
                className="rounded-xl bg-azul-50 px-2 py-1.5 font-semibold disabled:opacity-40"
              />
              <span className="w-16 text-right text-sm font-extrabold text-azul-700">{s.minutes ? fmtMin(s.minutes) : "libre"}</span>
            </div>
            <input
              type="range"
              min={0}
              max={240}
              step={15}
              value={s.minutes}
              aria-label={`Minutos libres el ${DAY_NAMES[i]}`}
              onChange={(e) => set(i, { minutes: Number(e.target.value) })}
              className="range-june mt-2 w-full"
              style={{ "--fill": `${(s.minutes / 240) * 100}%` } as React.CSSProperties}
            />
          </div>
        );
      })}
      <p className="text-xs text-ink-soft">Pon 0 los días que no quieras estudiar nada (sí, se puede 🛋️).</p>
    </div>
  );
}

/* ---------------- Nuevo examen ---------------- */

export function PlanSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title="Nuevo examen">
      {open && <PlanForm onDone={onClose} />}
    </Sheet>
  );
}

function PlanForm({ onDone }: { onDone: () => void }) {
  const store = useStore();
  const ui = useUI();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(addDays(todayKey(), 7));
  const [topics, setTopics] = useState("");
  const [amount, setAmount] = useState<Level>(3);
  const [understanding, setUnderstanding] = useState<Level>(3);
  const [editHours, setEditHours] = useState(false);

  const valid = title.trim() && date > todayKey();
  const total = estimateMinutes(amount, understanding);
  const sched = useMemo(
    () => (valid ? scheduleStudy(total, date, store.data.settings.freeTime, busyByDay(store.data)) : null),
    [valid, total, date, store.data],
  );

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        store.addPlan({
          title: title.trim(),
          examDate: date,
          topics: topics
            .split(/[\n,;]+/)
            .map((t) => t.trim())
            .filter(Boolean),
          amount,
          understanding,
        });
        ui.toast(sched?.startDate ? `¡Plan hecho! Empiezas ${relativeDay(sched.startDate)} 📅` : "Examen guardado 📅");
        onDone();
      }}
    >
      <label className="block">
        <span className="mb-1 block font-bold">¿De qué es?</span>
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Historia" />
      </label>
      <label className="block">
        <span className="mb-1 block font-bold">¿Qué día?</span>
        <input type="date" className={inputCls} value={date} min={addDays(todayKey(), 1)} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block font-bold">Temas (opcional, separados por comas)</span>
        <input className={inputCls} value={topics} onChange={(e) => setTopics(e.target.value)} placeholder="Ej: tema 4, tema 5" />
      </label>

      <div className="space-y-5 rounded-3xl bg-azul-50/60 p-4">
        <LevelSlider id="amount" label="¿Cuánto temario es?" value={amount} onChange={setAmount} labels={AMOUNT_LABELS} emoji={AMOUNT_EMOJI} />
        <LevelSlider
          id="understanding"
          label="¿Lo entiendes?"
          value={understanding}
          onChange={setUnderstanding}
          labels={UNDERSTAND_LABELS}
          emoji={UNDERSTAND_EMOJI}
        />
      </div>

      <div>
        <button type="button" onClick={() => setEditHours((v) => !v)} className="flex min-h-11 w-full items-center justify-between font-bold">
          <span className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-azul-600" /> Tus horas libres
          </span>
          <ChevronDown className={`h-5 w-5 text-azul-700 transition ${editHours ? "rotate-180" : ""}`} />
        </button>
        {editHours && (
          <div className="mt-2 rounded-3xl bg-azul-50/60 p-3">
            <FreeTimeEditor value={store.data.settings.freeTime} onChange={(freeTime) => store.setSettings({ freeTime })} />
          </div>
        )}
      </div>

      {sched && (
        <div
          className={`animate-fade-in rounded-3xl p-4 ${
            sched.status === "ok" ? "bg-mint/25" : sched.status === "justa" ? "bg-sun/35" : "bg-pink/25"
          }`}
          aria-live="polite"
        >
          {sched.startDate ? (
            <>
              <p className="text-xs font-extrabold uppercase tracking-widest">Tu plan</p>
              <p className="font-display mt-1 text-2xl font-extrabold leading-tight">
                Empieza {relativeDay(sched.startDate)}
                {sched.sessions[0] && ` a las ${sched.sessions[0].time}`}
              </p>
              <p className="mt-1 font-semibold">{planSummary(sched)}</p>
              <p className="mt-2 text-sm">
                {sched.status === "ok"
                  ? "Ritmo tranqui: como mucho 50 min al día. Sin agobios 😌"
                  : sched.status === "justa"
                    ? `Vas un poco justa: algunos días toca hasta ${fmtMin(sched.maxPerDay)}. Se puede 💪`
                    : `No cabe todo en tus horas libres (faltan ${fmtMin(sched.totalMinutes - sched.scheduledMinutes)}). Añade horas o céntrate en lo más importante.`}
              </p>
              <div className="no-scrollbar -mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1">
                {sched.sessions.map((s) => (
                  <span key={s.date} className="shrink-0 rounded-2xl bg-white px-3 py-2 text-center text-xs font-bold">
                    <span className="block capitalize">{relativeDay(s.date)}</span>
                    <span className="block text-azul-700">
                      {s.time} · {s.minutes}′
                    </span>
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="font-semibold">{planSummary(sched)}</p>
          )}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={!valid}>
        ¡Hecho! Guárdame el plan
      </Button>
    </form>
  );
}

/* ---------------- Tarjeta de examen ---------------- */

export function PlanCard({ planId }: { planId: string }) {
  const store = useStore();
  const ui = useUI();
  const plan = store.data.plans.find((p) => p.id === planId)!;
  const tasks = store.data.tasks.filter((t) => t.planId === planId).sort((a, b) => a.date.localeCompare(b.date));
  const done = tasks.filter((t) => t.done).length;
  const left = daysBetween(todayKey(), plan.examDate);
  const next = tasks.find((t) => !t.done);
  const [open, setOpen] = useState(false);

  return (
    <div className="card p-4">
      <button className="flex w-full items-center gap-3 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span
          className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl font-extrabold ${
            left <= 2 ? "bg-pink text-ink" : left <= 6 ? "bg-sun text-ink" : "bg-azul-100 text-azul-700"
          }`}
        >
          <span className="font-display text-xl leading-none">{Math.max(0, left)}</span>
          <span className="text-[10px] uppercase">{left === 1 ? "día" : "días"}</span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">{plan.title}</p>
          <p className="text-sm text-ink-soft">
            {left < 0 ? "Ya pasó. ¡Espero que bordado!" : prettyDate(plan.examDate)} · {done}/{tasks.length} sesiones
          </p>
          {next && left >= 0 && (
            <p className="text-sm font-bold text-azul-700">
              Siguiente: {relativeDay(next.date)} {next.time && `a las ${next.time}`} · {next.minutes} min
            </p>
          )}
        </div>
        <ChevronDown className={`h-5 w-5 shrink-0 text-azul-700 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="animate-fade-in mt-3 space-y-1">
          <p className="text-sm text-ink-soft">
            Temario: {AMOUNT_EMOJI[plan.amount - 1]} {AMOUNT_LABELS[plan.amount - 1].toLowerCase()} · Lo entiendes:{" "}
            {UNDERSTAND_EMOJI[plan.understanding - 1]} {UNDERSTAND_LABELS[plan.understanding - 1].toLowerCase()}
          </p>
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3">
              <DoneCheck done={t.done} onToggle={() => store.setTaskDone(t.id, !t.done)} label={`Hecho: ${t.title}`} />
              <div className="min-w-0 flex-1">
                <p className="strike text-[15px] font-semibold" data-done={t.done}>
                  {t.title.replace(`${plan.title}: `, "")}
                </p>
                <p className="text-xs text-ink-soft">
                  {relativeDay(t.date)} {t.time && `· ${t.time}`} {t.minutes && `· ${t.minutes} min`}
                </p>
              </div>
              {!t.done && (
                <button
                  onClick={() => ui.openPreFocus({ kind: "focus", taskId: t.id })}
                  aria-label={`Empezar ${t.title}`}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-azul-50 text-azul-700"
                >
                  <Play className="h-4 w-4" fill="currentColor" />
                </button>
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-4 pt-2">
            {left > 0 && (
              <button
                onClick={() => {
                  store.recalcPlan(plan.id);
                  ui.toast("Plan recolocado con tus horas libres 🔄");
                }}
                className="flex min-h-11 items-center gap-2 text-sm font-bold text-azul-700"
              >
                <RefreshCw className="h-4 w-4" /> Recalcular
              </button>
            )}
            <button
              onClick={() => confirm("¿Borrar este examen y su plan?") && store.deletePlan(plan.id)}
              className="flex min-h-11 items-center gap-2 text-sm font-bold text-pink"
            >
              <Trash2 className="h-4 w-4" /> Borrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
