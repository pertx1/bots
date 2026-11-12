"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { gx } from "@/lib/gender";
import { isStandalone } from "@/lib/notify";
import { SOUND_LABELS } from "@/lib/sound";
import { useStore } from "@/lib/store";
import type { ReminderLevel, SoundKind } from "@/lib/types";
import { FreeTimeEditor } from "./Exams";
import { InstallGuide } from "./InstallGuide";
import { Mascot } from "./Mascot";
import { TimerPicker } from "./Methods";
import { NotificationsCard } from "./NotificationsCard";
import { Button, inputCls, Toggle } from "./ui";

const STUDY_SLOTS = ["12:30", "13:30", "14:30", "16:00", "17:30"];
const TIDY_SLOTS = ["14:00", "19:30", "21:00"];
const STEPS = 6;

/**
 * Bienvenida: recoge todo lo que hay en Ajustes, un paso cada vez.
 * Cada elección se guarda al momento; al final solo se marca como hecha.
 */
export function Onboarding() {
  const { data, setSettings } = useStore();
  const s = data.settings;
  const [step, setStep] = useState(0);
  const [installed] = useState(() => isStandalone());
  const g = (f: string, m: string) => gx(s, f, m);

  const chip = (on: boolean, color = "bg-sun text-ink") => `transition active:scale-95 ${on ? color : "bg-white/15"}`;

  return (
    <div className="pt-safe pb-safe flex min-h-dvh flex-col bg-azul-600 text-white">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6">
        <div className="flex items-center justify-center gap-2 pt-4" aria-label={`Paso ${step + 1} de ${STEPS}`}>
          {Array.from({ length: STEPS }, (_, i) => (
            <span key={i} className={`h-2 rounded-full transition-all ${i === step ? "w-8 bg-sun" : i < step ? "w-2 bg-white" : "w-2 bg-white/40"}`} />
          ))}
        </div>

        <div key={step} className="animate-slide-up flex flex-1 flex-col justify-center py-6">
          {step === 0 && (
            <>
              <Mascot mood="eufórica" size={150} className="mx-auto" name="Blu" />
              <h1 className="font-display mt-4 text-5xl font-extrabold leading-[1.02]">¡Hola{s.name.trim() ? `, ${s.name.trim()}` : ""}!</h1>
              <p className="mt-3 text-lg text-azul-50">
                Soy <b className="text-white">Blu</b>, tu mono. Mi trabajo: que <b className="text-white">empieces</b> (aunque sea 5 minutos) y
                saber siempre <b className="text-white">por dónde empezar</b>. Sin agobios y sin sermones, palabrita.
              </p>
              <label className="mt-5 block">
                <span className="mb-1 block text-sm font-bold text-azul-50">¿Cómo te llamo?</span>
                <input
                  className={`${inputCls} !border-white/30 !bg-white !text-ink`}
                  value={s.name}
                  placeholder="Tu nombre"
                  autoComplete="given-name"
                  onChange={(e) => setSettings({ name: e.target.value })}
                />
              </label>
              <fieldset className="mt-4">
                <legend className="mb-1 text-sm font-bold text-azul-50">¿Cómo te hablo?</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ["f", "En femenino", "¡Estás lista!"],
                      ["m", "En masculino", "¡Estás listo!"],
                    ] as const
                  ).map(([v, label, ex]) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={s.gender === v}
                      onClick={() => setSettings({ gender: v })}
                      className={`min-h-14 rounded-2xl px-3 text-left font-bold ${chip(s.gender === v)}`}
                    >
                      <span className="block">{label}</span>
                      <span className="block text-xs font-semibold opacity-80">{ex}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="font-display text-4xl font-extrabold leading-tight">Ponme en tu móvil</h1>
              {installed ? (
                <p className="mt-4 flex items-center gap-2 rounded-2xl bg-mint p-4 font-bold text-ink">
                  <CheckCircle2 className="h-6 w-6" /> ¡Ya me tienes instalado! Nos saltamos esto.
                </p>
              ) : (
                <>
                  <p className="mb-5 mt-2 text-azul-50">Así funciono a pantalla completa, sin internet y te puedo mandar avisos.</p>
                  <InstallGuide dark />
                </>
              )}
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="font-display text-4xl font-extrabold leading-tight">¿A qué hora estudias mejor?</h1>
              <p className="mt-2 text-azul-50">Te aviso a esa hora los días que no tengas plan de examen.</p>
              <div className="mt-5 grid grid-cols-3 gap-2">
                {STUDY_SLOTS.map((t) => (
                  <button
                    key={t}
                    aria-pressed={s.studyTime === t}
                    onClick={() => setSettings({ studyTime: t })}
                    className={`min-h-14 rounded-2xl text-lg font-extrabold ${chip(s.studyTime === t)}`}
                  >
                    {t}
                  </button>
                ))}
                <label className="col-span-3 mt-1 flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-white/15 px-4 font-bold">
                  Otra hora
                  <input
                    type="time"
                    value={s.studyTime}
                    onChange={(e) => e.target.value && setSettings({ studyTime: e.target.value })}
                    className="rounded-xl bg-white px-3 py-1.5 text-ink"
                  />
                </label>
              </div>
              <p className="mt-6 font-bold">¿Y un ratito para recoger?</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {TIDY_SLOTS.map((t) => (
                  <button
                    key={t}
                    aria-pressed={s.tidyTime === t}
                    onClick={() => setSettings({ tidyTime: t })}
                    className={`min-h-12 rounded-2xl font-extrabold ${chip(s.tidyTime === t, "bg-pink text-ink")}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="font-display text-4xl font-extrabold leading-tight">Tus horas libres</h1>
              <p className="mb-4 mt-2 text-azul-50">
                Con esto calculo cuándo empezar cada examen y cuánto estudiar cada día. Mueve la barra de cada día.
              </p>
              <div className="rounded-3xl bg-white/10 p-2 text-ink">
                <FreeTimeEditor value={s.freeTime} onChange={(freeTime) => setSettings({ freeTime })} />
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="font-display text-4xl font-extrabold leading-tight">¿Cómo te gusta estudiar?</h1>
              <p className="mb-4 mt-2 text-azul-50">Elige un método. Si no sabes, Pomodoro es el clásico que funciona.</p>
              <TimerPicker dark />
              <p className="mb-2 mt-6 font-bold">Sonido de fondo mientras estudias</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(SOUND_LABELS) as SoundKind[]).map((k) => (
                  <button
                    key={k}
                    aria-pressed={s.sound === k}
                    onClick={() => setSettings({ sound: k })}
                    className={`min-h-11 rounded-full px-4 text-sm font-bold ${chip(s.sound === k)}`}
                  >
                    {SOUND_LABELS[k]}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h1 className="font-display text-4xl font-extrabold leading-tight">¿Cuánto te doy la lata?</h1>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {(["pocos", "normal", "muchos"] as ReminderLevel[]).map((l) => (
                  <button
                    key={l}
                    aria-pressed={s.reminderLevel === l}
                    onClick={() => setSettings({ reminderLevel: l })}
                    className={`min-h-12 rounded-2xl font-bold capitalize ${chip(s.reminderLevel === l)}`}
                  >
                    {l === "muchos" ? "Muchos 😈" : l}
                  </button>
                ))}
              </div>
              <div className="mt-4 rounded-3xl bg-white/10 px-4 py-2">
                <Toggle dark label="Hora de estudiar" checked={s.reminders.study} onChange={(v) => setSettings({ reminders: { ...s.reminders, study: v } })} />
                <Toggle dark label="Hora de recoger" checked={s.reminders.tidy} onChange={(v) => setSettings({ reminders: { ...s.reminders, tidy: v } })} />
                <Toggle dark label="Exámenes cerca" checked={s.reminders.exams} onChange={(v) => setSettings({ reminders: { ...s.reminders, exams: v } })} />
                <Toggle dark label="Racha en peligro" checked={s.reminders.streak} onChange={(v) => setSettings({ reminders: { ...s.reminders, streak: v } })} />
              </div>
              <div className="mt-4 text-ink">
                <NotificationsCard />
              </div>
            </>
          )}
        </div>

        <div className="pb-6">
          <Button
            variant="sun"
            className="w-full py-4 text-lg"
            onClick={() => {
              if (step < STEPS - 1) setStep(step + 1);
              else setSettings({ name: s.name.trim(), onboarded: true });
            }}
          >
            {step === 0 ? "¡Vamos allá!" : step === 1 && !installed ? "Hecho (o luego)" : step === STEPS - 1 ? `¡${g("Lista", "Listo")}, a empezar!` : "Siguiente"}
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="mt-2 flex justify-between">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="min-h-11 px-2 font-bold text-azul-50">
                Atrás
              </button>
            ) : (
              <span />
            )}
            {step > 0 && step < STEPS - 1 && (
              <button onClick={() => setSettings({ name: s.name.trim(), onboarded: true })} className="min-h-11 px-2 font-bold text-azul-50">
                Saltar el resto
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
