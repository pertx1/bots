"use client";

import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronDown,
  CircleParking,
  Play,
  Plus,
  Star,
  Timer,
  Trash2,
  Wand2,
} from "lucide-react";
import { useState } from "react";
import { breakDown, KIND_HINT } from "@/lib/breakdown";
import { addDays, daysBetween, prettyDate, relativeDay, todayKey, uid } from "@/lib/dates";
import { canMarkImportant, nextStep, useStore } from "@/lib/store";
import type { Step, Task } from "@/lib/types";
import { useUI } from "../app-ui";
import { Button, DoneCheck, inputCls, Pill, SectionTitle, Sheet } from "../ui";

export function Estudiar() {
  const { data } = useStore();
  const ui = useUI();
  const today = todayKey();
  const [planOpen, setPlanOpen] = useState(false);

  const active = data.tasks
    .filter((t) => !t.done && !t.planId && t.date <= addDays(today, 0))
    .sort((a, b) => Number(b.important) - Number(a.important));
  const upcoming = data.tasks.filter((t) => !t.done && t.date > today).sort((a, b) => a.date.localeCompare(b.date));
  const doneRecent = data.tasks.filter((t) => t.done && t.doneAt && daysBetween(t.doneAt.slice(0, 10), today) <= 1);

  return (
    <div className="animate-fade-in">
      <h1 className="font-display px-1 pt-2 text-[2.1rem] font-extrabold leading-tight tracking-tight">Estudiar</h1>
      <p className="px-1 text-ink-soft">Paso a paso. Nadie se come un elefante de un bocado.</p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button className="min-h-24 flex-col !items-start !gap-1 rounded-3xl text-left" onClick={() => ui.openPreFocus({ kind: "five", taskId: active[0]?.id })}>
          <Timer className="h-6 w-6" />
          <span className="font-display text-xl font-extrabold leading-none">Solo 5 min</span>
          <span className="text-xs font-semibold opacity-80">el arranque fácil</span>
        </Button>
        <Button
          variant="sun"
          className="min-h-24 flex-col !items-start !gap-1 rounded-3xl text-left"
          onClick={() => ui.openPreFocus({ kind: "focus", taskId: active[0]?.id })}
        >
          <Play className="h-6 w-6" fill="currentColor" />
          <span className="font-display text-xl font-extrabold leading-none">Bloque {data.settings.focusMinutes}′</span>
          <span className="text-xs font-semibold opacity-80">+ {data.settings.breakMinutes}′ de descanso</span>
        </Button>
      </div>

      <Unblocker />

      <SectionTitle action={<Pill className="bg-azul-100 text-azul-700">{active.length}</Pill>}>Tus tareas</SectionTitle>
      {active.length === 0 ? (
        <p className="card p-5 text-ink-soft">Nada pendiente por aquí. Usa el desatascador de arriba y te lo pongo fácil.</p>
      ) : (
        <div className="space-y-3">
          {active.map((t) => (
            <TaskCard key={t.id} task={t} />
          ))}
        </div>
      )}

      <SectionTitle
        action={
          <Button variant="ghost" className="min-h-11 px-3 py-2 text-sm" onClick={() => setPlanOpen(true)}>
            <Plus className="h-4 w-4" /> Examen
          </Button>
        }
      >
        <span className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-azul-600" /> Exámenes y entregas
        </span>
      </SectionTitle>
      {data.plans.length === 0 ? (
        <button onClick={() => setPlanOpen(true)} className="card w-full p-5 text-left">
          <p className="font-bold">¿Tienes examen o entrega?</p>
          <p className="text-ink-soft">Dime la fecha y lo reparto en los días que quedan. Tú solo miras «Hoy toca…».</p>
        </button>
      ) : (
        <div className="space-y-3">
          {data.plans
            .slice()
            .sort((a, b) => a.examDate.localeCompare(b.examDate))
            .map((p) => (
              <PlanCard key={p.id} planId={p.id} />
            ))}
        </div>
      )}

      {upcoming.filter((t) => !t.planId).length > 0 && (
        <>
          <SectionTitle>Más adelante</SectionTitle>
          <div className="space-y-3">
            {upcoming
              .filter((t) => !t.planId)
              .map((t) => (
                <TaskCard key={t.id} task={t} />
              ))}
          </div>
        </>
      )}

      <Parking />

      {doneRecent.length > 0 && (
        <>
          <SectionTitle>Tachadas ✨</SectionTitle>
          <div className="space-y-2">
            {doneRecent.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        </>
      )}

      <PlanSheet open={planOpen} onClose={() => setPlanOpen(false)} />
    </div>
  );
}

/* ---------------- Desatascador ---------------- */

function Unblocker() {
  const { data, addTask } = useStore();
  const ui = useUI();
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [important, setImportant] = useState(true);
  const [date, setDate] = useState(todayKey());
  const canImp = canMarkImportant(data, date);

  const generate = () => {
    if (!title.trim()) return;
    setSteps(breakDown(title.trim()));
  };

  const save = (start: boolean) => {
    if (!steps) return;
    const id = addTask(title.trim(), steps.filter((s) => s.text.trim()), { date, important: important && canImp });
    setTitle("");
    setSteps(null);
    ui.toast("¡Guardada! Ahora solo el primer paso 👇");
    if (start) ui.openPreFocus({ kind: "five", taskId: id });
  };

  return (
    <section className="card mt-6 overflow-hidden">
      <div className="bg-linear-to-br from-azul-600 to-azul-500 p-5 text-white">
        <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-sun">
          <Wand2 className="h-4 w-4" /> El desatascador
        </p>
        <p className="font-display mt-1 text-2xl font-extrabold leading-tight">¿Qué te da pereza? Lo troceo en pasitos de 5 min.</p>
      </div>
      <form
        className="space-y-2 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          generate();
        }}
      >
        <label htmlFor="bigtask" className="sr-only">
          Tarea grande
        </label>
        <input
          id="bigtask"
          className={inputCls}
          placeholder="Ej: estudiar tema 4 de historia"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <p className="px-1 text-xs text-ink-soft">{KIND_HINT}</p>
        <Button type="submit" className="w-full" disabled={!title.trim()}>
          <Wand2 className="h-5 w-5" /> Trocéamelo
        </Button>
      </form>

      {steps && (
        <div className="animate-slide-up space-y-3 border-t-2 border-azul-50 p-4">
          <p className="font-bold">Tus pasos (puedes cambiarlos):</p>
          <StepEditor steps={steps} onChange={setSteps} />
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <label className="flex min-h-11 items-center gap-2 font-semibold">
              <span>Para</span>
              <input type="date" className={`${inputCls} !w-auto !py-2`} value={date} min={todayKey()} onChange={(e) => setDate(e.target.value || todayKey())} />
            </label>
            <button
              type="button"
              onClick={() => setImportant((v) => !v)}
              disabled={!canImp}
              aria-pressed={important && canImp}
              className={`flex min-h-11 items-center gap-2 rounded-full px-4 font-bold ${
                important && canImp ? "bg-sun text-ink" : "bg-azul-50 text-ink-soft"
              }`}
            >
              <Star className="h-4 w-4" fill={important && canImp ? "currentColor" : "none"} />
              {canImp ? "Importante" : "Ya hay 3 importantes"}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button variant="ghost" onClick={() => save(false)}>
              Guardar
            </Button>
            <Button onClick={() => save(true)}>
              <Play className="h-4 w-4" fill="currentColor" /> Empezar ya
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}

function StepEditor({ steps, onChange }: { steps: Step[]; onChange: (s: Step[]) => void }) {
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= steps.length) return;
    const next = steps.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => (
        <li key={s.id} className="rounded-2xl bg-azul-50/70 p-2">
          <div className="flex items-start gap-2">
            <span className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-azul-600 text-sm font-extrabold text-white">
              {i + 1}
            </span>
            <textarea
              aria-label={`Paso ${i + 1}`}
              rows={Math.max(2, Math.ceil(s.text.length / 34))}
              className="min-h-11 min-w-0 flex-1 resize-none rounded-xl bg-white px-3 py-2 font-medium [field-sizing:content] focus:outline-none focus:ring-2 focus:ring-azul-400"
              value={s.text}
              onChange={(e) => onChange(steps.map((x) => (x.id === s.id ? { ...x, text: e.target.value } : x)))}
            />
          </div>
          <div className="flex justify-end gap-1">
            <button type="button" aria-label="Subir paso" onClick={() => move(i, -1)} className="flex h-11 w-11 items-center justify-center text-azul-700">
              <ArrowUp className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Bajar paso" onClick={() => move(i, 1)} className="flex h-11 w-11 items-center justify-center text-azul-700">
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Borrar paso"
              onClick={() => onChange(steps.filter((x) => x.id !== s.id))}
              className="flex h-11 w-11 items-center justify-center text-pink"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={() => onChange([...steps, { id: uid(), text: "", minutes: 5, done: false }])}
          className="flex min-h-11 items-center gap-2 rounded-full px-3 font-bold text-azul-700"
        >
          <Plus className="h-4 w-4" /> Añadir paso
        </button>
      </li>
    </ol>
  );
}

/* ---------------- Tarjeta de tarea ---------------- */

function TaskCard({ task }: { task: Task }) {
  const store = useStore();
  const ui = useUI();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const step = nextStep(task);
  const doneCount = task.steps.filter((s) => s.done).length;
  const canImp = task.important || canMarkImportant(store.data, task.date);

  return (
    <div className={`card overflow-hidden ${task.done ? "opacity-70" : ""}`}>
      <div className="flex items-center gap-3 p-3">
        <DoneCheck done={task.done} onToggle={() => store.setTaskDone(task.id, !task.done)} label={`Tarea hecha: ${task.title}`} />
        <button className="min-w-0 flex-1 py-1 text-left" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <p className="strike font-bold" data-done={task.done}>
            {task.title}
          </p>
          <p className="text-sm text-ink-soft">
            {doneCount}/{task.steps.length} pasos · {relativeDay(task.date)}
          </p>
        </button>
        <button
          onClick={() => {
            if (!canImp) return ui.toast("Máximo 3 importantes al día. Desmarca otra antes 😉", "sun");
            store.toggleImportant(task.id);
          }}
          aria-label={task.important ? "Quitar de importantes" : "Marcar como importante"}
          aria-pressed={task.important}
          className={`flex h-11 w-11 items-center justify-center rounded-full ${task.important ? "text-sun" : "text-azul-200"}`}
        >
          <Star className="h-6 w-6" fill={task.important ? "currentColor" : "none"} />
        </button>
        <button onClick={() => setOpen((o) => !o)} aria-label="Ver pasos" className="flex h-11 w-9 items-center justify-center text-azul-700">
          <ChevronDown className={`h-5 w-5 transition ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      <div className="mx-3 mb-3 h-2 overflow-hidden rounded-full bg-azul-50">
        <div className="h-full rounded-full bg-mint transition-all duration-500" style={{ width: `${task.steps.length ? (doneCount / task.steps.length) * 100 : 0}%` }} />
      </div>

      {open && (
        <div className="animate-fade-in border-t-2 border-azul-50 p-3">
          {editing ? (
            <>
              <StepEditor steps={task.steps} onChange={(steps) => store.updateTask(task.id, { steps })} />
              <Button variant="ghost" className="mt-2 w-full" onClick={() => setEditing(false)}>
                Listo
              </Button>
            </>
          ) : (
            <ul className="space-y-1">
              {task.steps.map((s) => (
                <li key={s.id} className="flex items-center gap-3">
                  <DoneCheck done={s.done} onToggle={() => store.toggleStep(task.id, s.id)} label={`Paso hecho: ${s.text}`} />
                  <span className={`strike text-[15px] ${s.id === step?.id ? "font-bold" : ""} ${s.done ? "text-ink-soft" : ""}`} data-done={s.done}>
                    {s.text}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {!editing && (
            <div className="mt-3 flex flex-wrap gap-2">
              {!task.done && (
                <Button className="flex-1" onClick={() => ui.openPreFocus({ kind: "focus", taskId: task.id })}>
                  <Play className="h-4 w-4" fill="currentColor" /> Foco
                </Button>
              )}
              <Button variant="ghost" onClick={() => setEditing(true)}>
                Editar pasos
              </Button>
              <Button
                variant="ghost"
                aria-label="Borrar tarea"
                onClick={() => {
                  if (confirm("¿Borrar esta tarea?")) store.deleteTask(task.id);
                }}
              >
                <Trash2 className="h-4 w-4 text-pink" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------- Planificador hacia atrás ---------------- */

function PlanCard({ planId }: { planId: string }) {
  const store = useStore();
  const plan = store.data.plans.find((p) => p.id === planId)!;
  const tasks = store.data.tasks.filter((t) => t.planId === planId).sort((a, b) => a.date.localeCompare(b.date));
  const done = tasks.filter((t) => t.done).length;
  const left = daysBetween(todayKey(), plan.examDate);
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
        </div>
        <ChevronDown className={`h-5 w-5 text-azul-700 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="animate-fade-in mt-3 space-y-1">
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-3">
              <DoneCheck done={t.done} onToggle={() => store.setTaskDone(t.id, !t.done)} label={`Hecho: ${t.title}`} />
              <div className="min-w-0 flex-1">
                <p className="strike text-[15px] font-semibold" data-done={t.done}>
                  {t.title}
                </p>
                <p className="text-xs text-ink-soft">{relativeDay(t.date)}</p>
              </div>
            </div>
          ))}
          <button
            onClick={() => confirm("¿Borrar este examen y su plan?") && store.deletePlan(plan.id)}
            className="mt-2 flex min-h-11 items-center gap-2 text-sm font-bold text-pink"
          >
            <Trash2 className="h-4 w-4" /> Borrar plan
          </button>
        </div>
      )}
    </div>
  );
}

function PlanSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useStore();
  const ui = useUI();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(addDays(todayKey(), 7));
  const [topics, setTopics] = useState("");

  return (
    <Sheet open={open} onClose={onClose} title="Nuevo examen o entrega">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || date <= todayKey()) return;
          const list = topics
            .split(/[\n,;]+/)
            .map((t) => t.trim())
            .filter(Boolean);
          store.addPlan(title.trim(), date, list);
          ui.toast("¡Plan hecho! Mira «Hoy toca…» cada día y listo 📅");
          setTitle("");
          setTopics("");
          onClose();
        }}
      >
        <label className="block">
          <span className="mb-1 block font-bold">¿Qué es?</span>
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: examen de historia" />
        </label>
        <label className="block">
          <span className="mb-1 block font-bold">¿Cuándo?</span>
          <input type="date" className={inputCls} value={date} min={addDays(todayKey(), 1)} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block font-bold">Temas o partes (separados por comas)</span>
          <textarea
            className={`${inputCls} min-h-24`}
            value={topics}
            onChange={(e) => setTopics(e.target.value)}
            placeholder="Ej: tema 4, tema 5, mapas"
          />
        </label>
        <p className="text-sm text-ink-soft">
          Lo reparto hacia atrás desde la fecha: primero estudiar cada tema, luego repasos y el último día un simulacro.
        </p>
        <Button type="submit" className="w-full" disabled={!title.trim() || date <= todayKey()}>
          Repártemelo
        </Button>
      </form>
    </Sheet>
  );
}

/* ---------------- Lista de aparcamiento ---------------- */

function Parking() {
  const store = useStore();
  const [text, setText] = useState("");
  const items = store.data.parked;

  return (
    <>
      <SectionTitle>
        <span className="flex items-center gap-2">
          <CircleParking className="h-5 w-5 text-azul-600" /> Pensamientos aparcados
        </span>
      </SectionTitle>
      <div className="card p-3">
        <p className="px-1 pb-2 text-sm text-ink-soft">Lo que se te cruza mientras estudias va aquí. Luego lo miras, ahora no.</p>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) store.park(text.trim());
            setText("");
          }}
        >
          <label htmlFor="park" className="sr-only">
            Nuevo pensamiento
          </label>
          <input id="park" className={inputCls} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ej: mirar el regalo de mamá" />
          <Button type="submit" aria-label="Aparcar" className="px-4">
            <Plus className="h-5 w-5" strokeWidth={3} />
          </Button>
        </form>
        {items.length > 0 && (
          <ul className="mt-2 divide-y divide-azul-50">
            {items.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-1.5">
                <DoneCheck done={p.done} onToggle={() => store.toggleParked(p.id)} label={`Hecho: ${p.text}`} />
                <span className={`strike flex-1 ${p.done ? "text-ink-soft" : ""}`} data-done={p.done}>
                  {p.text}
                </span>
                <button aria-label="Borrar" onClick={() => store.deleteParked(p.id)} className="flex h-11 w-11 items-center justify-center text-azul-200">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
