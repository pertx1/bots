"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { isStandalone } from "@/lib/notify";
import { useStore } from "@/lib/store";
import { InstallGuide } from "./InstallGuide";
import { Mascot } from "./Mascot";
import { Button, inputCls } from "./ui";

const STUDY_SLOTS = ["12:30", "13:30", "14:30", "16:00", "17:30"];
const TIDY_SLOTS = ["14:00", "19:30", "21:00"];

export function Onboarding() {
  const { data, setSettings } = useStore();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(data.settings.name);
  const [pet, setPet] = useState(data.settings.petName);
  const [study, setStudy] = useState(data.settings.studyTime);
  const [tidy, setTidy] = useState(data.settings.tidyTime);
  const [installed] = useState(() => isStandalone());

  return (
    <div className="pt-safe pb-safe flex min-h-dvh flex-col bg-azul-600 text-white">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6">
        <div className="flex justify-center gap-2 pt-4" aria-label={`Paso ${step + 1} de 3`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-2 rounded-full transition-all ${i === step ? "w-8 bg-sun" : "w-2 bg-white/40"}`} />
          ))}
        </div>

        {step === 0 && (
          <div key="s0" className="animate-slide-up flex flex-1 flex-col justify-center">
            <Mascot mood="eufórica" size={170} className="mx-auto" />
            <h1 className="font-display mt-6 text-5xl font-extrabold leading-[1.02]">¡Hola, {name || "June"}!</h1>
            <p className="mt-4 text-lg text-azul-50">
              Soy <b className="text-white">{pet || "tu mono"}</b>, tu mono. Mi trabajo: que <b className="text-white">empieces</b> (aunque sea 5 minutos) y saber
              siempre <b className="text-white">por dónde empezar</b>. Sin agobios y sin sermones, palabrita.
            </p>
            <label className="mt-6 block">
              <span className="mb-1 block text-sm font-bold text-azul-50">¿Cómo te llamo?</span>
              <input className={`${inputCls} !border-white/30 !bg-white !text-ink`} value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block text-sm font-bold text-azul-50">¿Y cómo quieres que se llame tu mono? 🐒</span>
              <input
                className={`${inputCls} !border-white/30 !bg-white !text-ink`}
                value={pet}
                maxLength={20}
                onChange={(e) => setPet(e.target.value)}
              />
            </label>
          </div>
        )}

        {step === 1 && (
          <div key="s1" className="animate-slide-up flex flex-1 flex-col justify-center">
            <h1 className="font-display text-4xl font-extrabold leading-tight">Ponme en tu iPhone</h1>
            {installed ? (
              <p className="mt-4 flex items-center gap-2 rounded-2xl bg-mint p-4 font-bold text-ink">
                <CheckCircle2 className="h-6 w-6" /> ¡Ya estoy instalada! Nos saltamos esto.
              </p>
            ) : (
              <>
                <p className="mt-2 mb-5 text-azul-50">Así funciono a pantalla completa, sin internet y te puedo mandar avisos.</p>
                <InstallGuide dark />
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div key="s2" className="animate-slide-up flex flex-1 flex-col justify-center">
            <h1 className="font-display text-4xl font-extrabold leading-tight">¿A qué hora estudiamos?</h1>
            <p className="mt-2 text-azul-50">Me dijiste que a mediodía rindes mejor. Te propongo esa franja.</p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {STUDY_SLOTS.map((s) => (
                <button
                  key={s}
                  aria-pressed={study === s}
                  onClick={() => setStudy(s)}
                  className={`min-h-14 rounded-2xl text-lg font-extrabold transition ${study === s ? "bg-sun text-ink" : "bg-white/15"}`}
                >
                  {s}
                </button>
              ))}
              <label className="col-span-3 mt-1 flex min-h-12 items-center justify-between gap-3 rounded-2xl bg-white/15 px-4 font-bold">
                Otra hora
                <input type="time" value={study} onChange={(e) => setStudy(e.target.value)} className="rounded-xl bg-white px-3 py-1.5 text-ink" />
              </label>
            </div>
            <p className="mt-6 font-bold">¿Y un ratito para recoger?</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {TIDY_SLOTS.map((s) => (
                <button
                  key={s}
                  aria-pressed={tidy === s}
                  onClick={() => setTidy(s)}
                  className={`min-h-12 rounded-2xl font-extrabold transition ${tidy === s ? "bg-pink text-ink" : "bg-white/15"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="py-6">
          <Button
            variant="sun"
            className="w-full py-4 text-lg"
            onClick={() => {
              if (step < 2) setStep(step + 1);
              else
                setSettings({
                  name: name.trim() || "June",
                  petName: pet.trim() || "Coco",
                  studyTime: study,
                  tidyTime: tidy,
                  onboarded: true,
                });
            }}
          >
            {step === 0 ? "¡Vamos allá!" : step === 1 ? (installed ? "Siguiente" : "Hecho (o luego)") : "¡Empezar!"}
            <ArrowRight className="h-5 w-5" />
          </Button>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="mt-2 min-h-11 w-full font-bold text-azul-50">
              Atrás
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
