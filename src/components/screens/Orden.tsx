"use client";

import { Check, Play, Plus, Siren, Trash2 } from "lucide-react";
import { useState } from "react";
import { ZONES } from "@/lib/defaults";
import { todayKey } from "@/lib/dates";
import { useStore } from "@/lib/store";
import type { Zone } from "@/lib/types";
import { useUI } from "../app-ui";
import { Button, inputCls, Pill, SectionTitle, Sheet } from "../ui";

export function Orden() {
  const { data, deleteMission } = useStore();
  const ui = useUI();
  const [zone, setZone] = useState<Zone>("ropa");
  const [adding, setAdding] = useState(false);
  const t = todayKey();
  const doneToday = new Set(data.missionLog.filter((l) => l.date === t).map((l) => l.missionId));
  const missions = data.missions.filter((m) => m.zone === zone);
  const doneCount = data.missionLog.filter((l) => l.date === t).length;

  return (
    <div className="animate-fade-in">
      <h1 className="font-display px-1 pt-2 text-[2.1rem] font-extrabold leading-tight tracking-tight">Orden</h1>
      <p className="px-1 text-ink-soft">Micro-misiones de 2-5 minutos. Un poquito cada día, como tú dices.</p>

      <button
        onClick={ui.startRescue}
        className="btn-3d mt-5 flex w-full items-center gap-4 rounded-[28px] bg-pink p-5 text-left text-ink [--shadow:#c93a78]"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/50">
          <Siren className="h-8 w-8" />
        </span>
        <span>
          <span className="font-display block text-2xl font-extrabold leading-none">Modo Rescate</span>
          <span className="mt-1 block text-sm font-semibold">¿Todo fatal? Te doy UNA misión. Solo una. Luego otra.</span>
        </span>
      </button>

      {doneCount > 0 && (
        <p className="mt-4 text-center font-bold text-azul-700">
          Hoy llevas {doneCount} {doneCount === 1 ? "misión" : "misiones"} 🧹✨
        </p>
      )}

      <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="Zonas">
        {ZONES.map((z) => (
          <button
            key={z.id}
            role="tab"
            aria-selected={zone === z.id}
            onClick={() => setZone(z.id)}
            className={`flex min-h-12 shrink-0 items-center gap-2 rounded-full px-4 font-bold transition ${
              zone === z.id ? "bg-ink text-white" : "bg-white text-ink"
            }`}
          >
            <span aria-hidden>{z.emoji}</span> {z.label}
          </button>
        ))}
      </div>

      <SectionTitle
        action={
          <Button variant="ghost" className="min-h-11 px-3 py-2 text-sm" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Mía
          </Button>
        }
      >
        Misiones
      </SectionTitle>

      <div className="space-y-3">
        {missions.map((m) => {
          const done = doneToday.has(m.id);
          return (
            <div key={m.id} className={`card flex items-center gap-3 p-4 transition ${done ? "opacity-60" : ""}`}>
              <div className="min-w-0 flex-1">
                <p className="strike font-bold" data-done={done}>
                  {m.text}
                </p>
                <div className="mt-1 flex gap-2">
                  <Pill className="bg-azul-50 text-azul-700">{m.minutes} min</Pill>
                  {m.custom && <Pill className="bg-sun/40 text-ink">tuya</Pill>}
                </div>
              </div>
              {m.custom && (
                <button
                  aria-label="Borrar misión"
                  onClick={() => confirm("¿Borrar esta misión?") && deleteMission(m.id)}
                  className="flex h-11 w-9 items-center justify-center text-azul-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              {done ? (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-mint text-white" aria-label="Hecha hoy">
                  <Check className="h-6 w-6" strokeWidth={4} />
                </span>
              ) : (
                <button
                  onClick={() => ui.startMission(m)}
                  aria-label={`Empezar: ${m.text}`}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-azul-600 text-white active:scale-90"
                >
                  <Play className="h-5 w-5" fill="currentColor" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <AddMission open={adding} onClose={() => setAdding(false)} zone={zone} />
    </div>
  );
}

function AddMission({ open, onClose, zone }: { open: boolean; onClose: () => void; zone: Zone }) {
  const { addMission } = useStore();
  const [text, setText] = useState("");
  const [minutes, setMinutes] = useState(3);
  const [z, setZ] = useState<Zone>(zone);

  return (
    <Sheet open={open} onClose={onClose} title="Nueva micro-misión">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          addMission(z, text.trim(), minutes);
          setText("");
          onClose();
        }}
      >
        <label className="block">
          <span className="mb-1 block font-bold">¿Qué hay que hacer? (muy concreto)</span>
          <input className={inputCls} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ej: guardar los cargadores en el cajón" />
        </label>
        <fieldset>
          <legend className="mb-1 font-bold">Zona</legend>
          <div className="flex flex-wrap gap-2">
            {ZONES.map((x) => (
              <button
                type="button"
                key={x.id}
                aria-pressed={z === x.id}
                onClick={() => setZ(x.id)}
                className={`min-h-11 rounded-full px-4 font-bold ${z === x.id ? "bg-azul-600 text-white" : "bg-azul-50 text-azul-700"}`}
              >
                {x.emoji} {x.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-1 font-bold">Minutos</legend>
          <div className="flex gap-2">
            {[2, 3, 4, 5].map((n) => (
              <button
                type="button"
                key={n}
                aria-pressed={minutes === n}
                onClick={() => setMinutes(n)}
                className={`h-12 w-14 rounded-2xl font-extrabold ${minutes === n ? "bg-azul-600 text-white" : "bg-azul-50 text-azul-700"}`}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>
        <Button type="submit" className="w-full" disabled={!text.trim()}>
          Añadir misión
        </Button>
      </form>
    </Sheet>
  );
}
