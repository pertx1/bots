"use client";

import { Download, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { isStandalone } from "@/lib/notify";
import { SOUND_LABELS } from "@/lib/sound";
import { isAppData } from "@/lib/storage";
import { gx } from "@/lib/gender";
import { useStore } from "@/lib/store";
import type { ReminderLevel, SoundKind } from "@/lib/types";
import { useUI } from "./app-ui";
import { FreeTimeEditor } from "./Exams";
import { InstallGuide } from "./InstallGuide";
import { TimerPicker } from "./Methods";
import { NotificationsCard } from "./NotificationsCard";
import { Button, inputCls, Sheet, Toggle } from "./ui";

export function SettingsSheet() {
  const ui = useUI();
  return (
    <Sheet open={ui.settingsOpen} onClose={() => ui.setSettingsOpen(false)} title="Ajustes">
      {ui.settingsOpen && <SettingsBody />}
    </Sheet>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-azul-700">{title}</h3>
      <div className="space-y-3 rounded-3xl bg-azul-50/60 p-4">{children}</div>
    </section>
  );
}

function SettingsBody() {
  const store = useStore();
  const ui = useUI();
  const s = store.data.settings;
  const file = useRef<HTMLInputElement>(null);
  const [showInstall, setShowInstall] = useState(false);
  const standalone = isStandalone();

  const exportData = () => {
    const blob = new Blob([JSON.stringify(store.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blu-copia-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    ui.toast("Copia descargada 💾");
  };

  const importData = async (f: File) => {
    try {
      const json = JSON.parse(await f.text());
      if (!isAppData(json)) throw new Error("formato");
      if (!confirm("Esto reemplaza tus datos actuales por los del archivo. ¿Seguimos?")) return;
      store.replaceAll(json);
      ui.toast("¡Datos importados! ✨", "mint");
    } catch {
      ui.toast("Ese archivo no parece una copia de Blu 🤔", "sun");
    }
  };

  return (
    <div>
      <Group title="Tú">
        <label className="block">
          <span className="mb-1 block font-bold">Nombre</span>
          <input className={inputCls} value={s.name} onChange={(e) => store.setSettings({ name: e.target.value })} />
        </label>
        <div>
          <p className="mb-1 font-bold">Cómo te hablo</p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["f", "En femenino"],
                ["m", "En masculino"],
              ] as const
            ).map(([g, label]) => (
              <button
                key={g}
                aria-pressed={s.gender === g}
                onClick={() => store.setSettings({ gender: g })}
                className={`min-h-12 rounded-2xl font-bold ${s.gender === g ? "bg-azul-600 text-white" : "bg-white text-azul-700"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block font-bold">Hora de estudio</span>
            <input type="time" className={inputCls} value={s.studyTime} onChange={(e) => store.setSettings({ studyTime: e.target.value || "13:30" })} />
          </label>
          <label className="block">
            <span className="mb-1 block font-bold">Hora de recoger</span>
            <input type="time" className={inputCls} value={s.tidyTime} onChange={(e) => store.setSettings({ tidyTime: e.target.value || "19:30" })} />
          </label>
        </div>
      </Group>

      <Group title="Horas libres para estudiar">
        <p className="text-sm text-ink-soft">Con esto calculo cuándo empezar cada examen y a qué hora te aviso.</p>
        <FreeTimeEditor value={s.freeTime} onChange={(freeTime) => store.setSettings({ freeTime })} />
        {store.data.plans.length > 0 && (
          <Button
            variant="white"
            className="w-full"
            onClick={() => {
              store.data.plans.forEach((p) => store.recalcPlan(p.id));
              ui.toast("Exámenes recolocados con tus nuevas horas 🔄");
            }}
          >
            Recolocar mis exámenes
          </Button>
        )}
      </Group>

      <Group title="Foco">
        <TimerPicker />
        <p className="pt-1 text-sm font-bold">O a tu medida:</p>
        <Stepper
          label="Bloque de estudio"
          value={s.focusMinutes}
          min={10}
          max={90}
          step={5}
          onChange={(v) => store.setSettings({ focusMinutes: v, method: "libre" })}
        />
        <Stepper
          label="Descanso"
          value={s.breakMinutes}
          min={3}
          max={20}
          step={1}
          onChange={(v) => store.setSettings({ breakMinutes: v, method: "libre" })}
        />
        <div>
          <p className="mb-2 font-bold">Sonido de fondo</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SOUND_LABELS) as SoundKind[]).map((k) => (
              <button
                key={k}
                aria-pressed={s.sound === k}
                onClick={() => store.setSettings({ sound: k })}
                className={`min-h-11 rounded-full px-4 text-sm font-bold ${s.sound === k ? "bg-azul-600 text-white" : "bg-white text-azul-700"}`}
              >
                {SOUND_LABELS[k]}
              </button>
            ))}
          </div>
        </div>
      </Group>

      <Group title="Recordatorios">
        <div>
          <p className="mb-2 font-bold">¿Cuánto te doy la lata?</p>
          <div className="grid grid-cols-3 gap-2">
            {(["pocos", "normal", "muchos"] as ReminderLevel[]).map((l) => (
              <button
                key={l}
                aria-pressed={s.reminderLevel === l}
                onClick={() => store.setSettings({ reminderLevel: l })}
                className={`min-h-12 rounded-2xl font-bold capitalize ${s.reminderLevel === l ? "bg-azul-600 text-white" : "bg-white text-azul-700"}`}
              >
                {l === "muchos" ? "Muchos 😈" : l}
              </button>
            ))}
          </div>
        </div>
        <Toggle label="Hora de estudiar" checked={s.reminders.study} onChange={(v) => store.setSettings({ reminders: { ...s.reminders, study: v } })} />
        <Toggle label="Hora de recoger" checked={s.reminders.tidy} onChange={(v) => store.setSettings({ reminders: { ...s.reminders, tidy: v } })} />
        <Toggle label="Exámenes cerca" checked={s.reminders.exams} onChange={(v) => store.setSettings({ reminders: { ...s.reminders, exams: v } })} />
        <Toggle label="Racha en peligro" checked={s.reminders.streak} onChange={(v) => store.setSettings({ reminders: { ...s.reminders, streak: v } })} />

        <NotificationsCard />
      </Group>

      <Group title="Instalar en el iPhone">
        {standalone ? (
          <p className="font-semibold">Ya la tienes instalada. ¡Bien! 📲</p>
        ) : showInstall ? (
          <InstallGuide />
        ) : (
          <Button variant="white" className="w-full" onClick={() => setShowInstall(true)}>
            Ver cómo instalarla
          </Button>
        )}
      </Group>

      <Group title="Tus datos">
        <p className="text-sm text-ink-soft">Todo se guarda solo en este móvil. Haz una copia de vez en cuando por si acaso.</p>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="white" onClick={exportData}>
            <Download className="h-5 w-5" /> Exportar
          </Button>
          <Button variant="white" onClick={() => file.current?.click()}>
            <Upload className="h-5 w-5" /> Importar
          </Button>
        </div>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importData(f);
            e.target.value = "";
          }}
        />
        <Button
          variant="pink"
          className="w-full"
          onClick={() => {
            if (!confirm("¿Borrar TODO? Tareas, rachas, misiones… no se puede deshacer.")) return;
            if (!confirm(`¿${gx(s, "Segurísima", "Segurísimo")}? 🥺`)) return;
            store.resetAll();
            ui.setSettingsOpen(false);
          }}
        >
          <Trash2 className="h-5 w-5" /> Borrar todo
        </Button>
      </Group>
      <p className="pb-2 text-center text-xs text-ink-soft">Hecha con 💙 (y con June en mente)</p>
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-bold">{label}</span>
      <div className="flex items-center gap-2">
        <button
          aria-label={`Menos ${label}`}
          onClick={() => onChange(Math.max(min, value - step))}
          className="h-11 w-11 rounded-full bg-white text-xl font-extrabold text-azul-700"
        >
          −
        </button>
        <span className="w-16 text-center font-display text-xl font-extrabold tabular-nums">{value} min</span>
        <button
          aria-label={`Más ${label}`}
          onClick={() => onChange(Math.min(max, value + step))}
          className="h-11 w-11 rounded-full bg-white text-xl font-extrabold text-azul-700"
        >
          +
        </button>
      </div>
    </div>
  );
}
