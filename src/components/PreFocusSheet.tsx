"use client";

import { BellOff, Play } from "lucide-react";
import { useState } from "react";
import { FIVE_MIN_PROMISES, randomFrom } from "@/lib/copy";
import { SOUND_LABELS, unlockAudio } from "@/lib/sound";
import { nextStep, useStore } from "@/lib/store";
import type { Energy, SoundKind } from "@/lib/types";
import { gx } from "@/lib/gender";
import { blockMinutes, useUI } from "./app-ui";
import { Button, Sheet } from "./ui";

const FACES: { e: Energy; emoji: string; label: [string, string]; hint: string }[] = [
  { e: 1, emoji: "🫠", label: ["Fundida", "Fundido"], hint: "bloques cortitos" },
  { e: 2, emoji: "😐", label: ["Normalita", "Normalito"], hint: "bloque medio" },
  { e: 3, emoji: "🤩", label: ["¡A tope!", "¡A tope!"], hint: "bloque completo" },
];

export function PreFocusSheet() {
  const ui = useUI();
  const cfg = ui.preFocus;
  return (
    <Sheet open={!!cfg} onClose={ui.closePreFocus} title={cfg?.kind === "five" ? "Solo 5 minutos" : "Bloque de foco"}>
      {cfg && <PreFocusBody key={`${cfg.kind}-${cfg.taskId ?? ""}`} />}
    </Sheet>
  );
}

function PreFocusBody() {
  const ui = useUI();
  const { data, setSettings } = useStore();
  const cfg = ui.preFocus!;
  const [energy, setEnergy] = useState<Energy>(2);
  const [promise] = useState(() => randomFrom(FIVE_MIN_PROMISES));
  const task = data.tasks.find((t) => t.id === cfg.taskId);
  const step = task ? nextStep(task) : undefined;
  const minutes = cfg.kind === "five" ? 5 : blockMinutes(energy, data.settings.focusMinutes);

  return (
    <div className="space-y-5">
      {cfg.kind === "five" && <p className="text-ink-soft">{promise}</p>}

      {task && (
        <div className="rounded-2xl bg-azul-50 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-azul-700">Vas a hacer</p>
          <p className="font-display text-lg font-bold leading-tight">{step?.text ?? task.title}</p>
          {step && <p className="mt-1 text-sm text-ink-soft">de «{task.title}»</p>}
        </div>
      )}

      <div>
        <p className="mb-2 font-bold">¿Cómo va esa energía?</p>
        <div className="grid grid-cols-3 gap-2">
          {FACES.map((f) => (
            <button
              key={f.e}
              onClick={() => setEnergy(f.e)}
              aria-pressed={energy === f.e}
              className={`flex min-h-24 flex-col items-center justify-center rounded-2xl border-[3px] p-2 transition active:scale-95 ${
                energy === f.e ? "border-azul-600 bg-azul-50" : "border-azul-100 bg-white"
              }`}
            >
              <span className={`text-4xl ${energy === f.e ? "animate-pop" : ""}`}>{f.emoji}</span>
              <span className="mt-1 text-sm font-bold">{gx(data.settings, f.label[0], f.label[1])}</span>
              <span className="text-[11px] text-ink-soft">{f.hint}</span>
            </button>
          ))}
        </div>
        {cfg.kind === "five" && (
          <p className="mt-2 text-sm text-ink-soft">
            Si luego quieres seguir, tu bloque será de <b>{blockMinutes(energy, data.settings.focusMinutes)} min</b>.
          </p>
        )}
      </div>

      <div className="flex gap-3 rounded-2xl bg-sun/30 p-4">
        <BellOff className="mt-0.5 h-6 w-6 shrink-0 text-ink" aria-hidden />
        <p className="text-sm">
          <b>Truco anti-móvil:</b> desliza desde la esquina de arriba a la derecha → <b>Concentración</b> →{" "}
          <b>No molestar</b>. Nadie te va a escribir nada tan importante en {minutes} minutos. Prometido.
        </p>
      </div>

      <div>
        <p className="mb-2 font-bold">Sonido de fondo</p>
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {(Object.keys(SOUND_LABELS) as SoundKind[]).map((k) => (
            <button
              key={k}
              onClick={() => setSettings({ sound: k })}
              aria-pressed={data.settings.sound === k}
              className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-bold transition ${
                data.settings.sound === k ? "bg-azul-600 text-white" : "bg-azul-50 text-azul-700"
              }`}
            >
              {SOUND_LABELS[k]}
            </button>
          ))}
        </div>
      </div>

      <Button
        className="w-full py-4 text-lg"
        onClick={() => {
          unlockAudio();
          ui.startFocus({ kind: cfg.kind, minutes, taskId: cfg.taskId, energy });
        }}
      >
        <Play className="h-5 w-5" fill="currentColor" /> ¡Vamos! {minutes} min
      </Button>
    </div>
  );
}
