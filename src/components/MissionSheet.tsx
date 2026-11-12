"use client";

import { Check, Shuffle, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { confettiFrom } from "@/lib/confetti";
import { DONE_CHEERS, randomFrom } from "@/lib/copy";
import { ZONES } from "@/lib/defaults";
import { todayKey } from "@/lib/dates";
import { chime } from "@/lib/sound";
import { useStore } from "@/lib/store";
import type { Mission } from "@/lib/types";
import { useUI } from "./app-ui";
import { Mascot } from "./Mascot";
import { Button, Sheet } from "./ui";

export function MissionSheet() {
  const ui = useUI();
  const open = !!ui.mission || ui.rescue;
  return (
    <Sheet open={open} onClose={ui.closeMission} title={ui.rescue ? "Modo Rescate 🚨" : "Micro-misión"}>
      {ui.rescue ? <Rescue /> : ui.mission ? <MissionCard key={ui.mission.id} mission={ui.mission} onDone={ui.closeMission} /> : null}
    </Sheet>
  );
}

function MissionCard({ mission, onDone, doneLabel = "¡Hecha!" }: { mission: Mission; onDone: () => void; doneLabel?: string }) {
  const { logMission } = useStore();
  const ui = useUI();
  const [running, setRunning] = useState(false);
  const [left, setLeft] = useState(mission.minutes * 60);
  const btn = useRef<HTMLButtonElement>(null);
  const zone = ZONES.find((z) => z.id === mission.zone);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          chime();
          setRunning(false);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  return (
    <div className="space-y-5">
      <div className={`rounded-3xl ${zone?.color ?? "bg-azul-100"} p-5`}>
        <p className="text-sm font-bold">
          {zone?.emoji} {zone?.label} · {mission.minutes} min
        </p>
        <p className="font-display mt-2 text-2xl font-extrabold leading-tight">{mission.text}</p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex min-h-12 items-center gap-2 rounded-full bg-azul-50 px-5 font-bold text-azul-700 active:scale-95"
        >
          <Timer className="h-5 w-5" />
          {running ? "Pausar" : left === mission.minutes * 60 ? "Poner temporizador" : "Seguir"}
        </button>
        <span className="font-display text-3xl font-extrabold tabular-nums" role="timer">
          {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
        </span>
      </div>

      <Button
        ref={btn}
        variant="mint"
        className="w-full py-4 text-lg"
        onClick={() => {
          confettiFrom(btn.current, 80);
          logMission(mission.id);
          ui.toast(randomFrom(DONE_CHEERS), "mint");
          onDone();
        }}
      >
        <Check className="h-6 w-6" strokeWidth={3} /> {doneLabel}
      </Button>
    </div>
  );
}

function Rescue() {
  const { data } = useStore();
  const [count, setCount] = useState(0);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [seed] = useState(() => Math.floor(Math.random() * 1000));
  const t = todayKey();
  const doneToday = new Set(data.missionLog.filter((l) => l.date === t).map((l) => l.missionId));
  // Primero lo rápido: ordenamos por minutos
  const pool = data.missions
    .filter((m) => !doneToday.has(m.id) && !skipped.includes(m.id))
    .sort((a, b) => a.minutes - b.minutes || ((a.id.charCodeAt(0) + seed) % 7) - ((b.id.charCodeAt(0) + seed) % 7));
  const current = pool[0];

  if (!current)
    return (
      <div className="py-6 text-center">
        <Mascot mood="eufórica" size={140} className="mx-auto" />
        <h3 className="font-display mt-3 text-2xl font-extrabold">¡Rescate completado!</h3>
        <p className="mt-1 text-ink-soft">No quedan misiones por hoy. Tu habitación te pide perdón por todo.</p>
      </div>
    );

  return (
    <div className="space-y-4">
      <p className="text-ink-soft">
        Una cosa cada vez. No mires el resto. {count > 0 && <b className="text-ink">Llevas {count} 💪</b>}
      </p>
      <MissionCard key={current.id} mission={current} onDone={() => setCount((c) => c + 1)} doneLabel="¡Hecha! Siguiente" />
      <button
        onClick={() => setSkipped((s) => [...s, current.id])}
        className="mx-auto flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-azul-700"
      >
        <Shuffle className="h-4 w-4" /> Esta no me apetece, dame otra
      </button>
    </div>
  );
}
