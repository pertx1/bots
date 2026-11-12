"use client";

import { Check, CloudDrizzle, Pause, Play, Square, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { COMEBACK, DONE_CHEERS, randomFrom } from "@/lib/copy";
import { confetti } from "@/lib/confetti";
import { chime, startSound, stopSound } from "@/lib/sound";
import { nextStep, useStore } from "@/lib/store";
import { gx } from "@/lib/gender";
import { timerById } from "@/lib/methods";
import { blockMinutes, type FocusConfig, useUI } from "./app-ui";
import { Mascot } from "./Mascot";
import { Button, inputCls } from "./ui";

export function FocusOverlay() {
  const ui = useUI();
  if (!ui.focus) return null;
  return <FocusRun key={ui.focus.id} cfg={ui.focus} />;
}

const fmt = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

function FocusRun({ cfg }: { cfg: FocusConfig }) {
  const ui = useUI();
  const store = useStore();
  const { data } = store;
  const total = cfg.minutes * 60_000;

  const [endAt, setEndAt] = useState(() => Date.now() + total);
  const [now, setNow] = useState(() => Date.now());
  const [paused, setPaused] = useState<number | null>(null);
  const [away, setAway] = useState(false);
  const [exits, setExits] = useState(0);
  const [phase, setPhase] = useState<"run" | "done">("run");
  const [parking, setParking] = useState(false);
  const [thought, setThought] = useState("");
  const [muted, setMuted] = useState(false);
  const [comeback] = useState(() => randomFrom(COMEBACK));
  const logged = useRef(false);

  const isBreak = cfg.kind === "break";
  const remaining = paused ?? endAt - now;
  const progress = 1 - Math.max(0, remaining) / total;
  const task = data.tasks.find((t) => t.id === cfg.taskId);
  const step = task ? nextStep(task) : undefined;

  const log = (completed: boolean, rem: number) => {
    if (logged.current || isBreak) return;
    logged.current = true;
    const minutes = Math.round((total - Math.max(0, rem)) / 60_000);
    if (!completed && minutes < 1) return;
    store.addSession({
      kind: cfg.kind === "five" ? "five" : "focus",
      minutes: completed ? cfg.minutes : minutes,
      completed,
      exits,
      label: task?.title,
    });
    if (cfg.kind === "focus") {
      store.setSettings({ blocksInARow: completed ? data.settings.blocksInARow + 1 : 0 });
    }
  };

  // Reloj
  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (phase === "run" && paused === null && t >= endAt) {
        setPhase("done");
        stopSound();
        chime();
        if (!isBreak) confetti(undefined, window.innerHeight * 0.4, 90);
        log(true, 0);
      }
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, paused, endAt]);

  // Si sale de la app: pausa y cuenta la salida
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden" && phase === "run" && paused === null && !isBreak) {
        setPaused(endAt - Date.now());
        setExits((n) => n + 1);
        setAway(true);
        stopSound();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [phase, paused, endAt, isBreak]);

  // Sonido de fondo
  useEffect(() => {
    if (!isBreak && phase === "run" && paused === null && !muted && data.settings.sound !== "none") {
      startSound(data.settings.sound);
    } else stopSound();
    return () => stopSound();
  }, [isBreak, phase, paused, muted, data.settings.sound]);

  // Pantalla siempre encendida si se puede
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as unknown as { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    nav.wakeLock
      ?.request("screen")
      .then((l) => (lock = l))
      .catch(() => {});
    return () => {
      lock?.release().catch(() => {});
    };
  }, []);

  const resume = () => {
    if (paused !== null) setEndAt(Date.now() + paused);
    setPaused(null);
    setAway(false);
  };

  const stopEarly = () => {
    log(false, remaining);
    stopSound();
    ui.endFocus();
    if (!isBreak) ui.toast("Guardado. Cada minuto cuenta, de verdad 💙");
  };

  const markStep = () => {
    if (!task || !step) return;
    store.toggleStep(task.id, step.id);
    confetti(undefined, window.innerHeight * 0.55, 45);
    ui.toast(randomFrom(DONE_CHEERS), "mint");
  };

  const bg = isBreak ? "bg-mint text-ink" : "bg-azul-600 text-white";
  const R = 118;
  const C = 2 * Math.PI * R;

  return (
    <div className={`fixed inset-0 z-[60] flex flex-col ${bg} animate-fade-in`} role="dialog" aria-modal="true" aria-label="Modo foco">
      <div className="pt-safe mx-auto flex w-full max-w-lg flex-1 flex-col px-6 pb-6">
        {phase === "run" ? (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold uppercase tracking-widest opacity-80">
                {isBreak ? "Descanso" : cfg.kind === "five" ? "Solo 5 minutos" : "Modo foco"}
              </p>
              <div className="flex items-center gap-2">
                {!isBreak && (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold" aria-live="polite">
                    Salidas: {exits}
                  </span>
                )}
                {!isBreak && data.settings.sound !== "none" && (
                  <button
                    onClick={() => setMuted((m) => !m)}
                    aria-label={muted ? "Activar sonido" : "Silenciar sonido"}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15"
                  >
                    {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center">
              <div className="relative">
                <svg width="270" height="270" viewBox="0 0 270 270" className="-rotate-90" aria-hidden>
                  <circle cx="135" cy="135" r={R} stroke="currentColor" strokeOpacity="0.15" strokeWidth="16" fill="none" />
                  <circle
                    cx="135"
                    cy="135"
                    r={R}
                    stroke={isBreak ? "#0d1440" : "#ffcf3d"}
                    strokeWidth="16"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={C}
                    strokeDashoffset={C * (1 - progress)}
                    style={{ transition: "stroke-dashoffset 0.3s linear" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-6xl font-extrabold tabular-nums" role="timer" aria-label={`Quedan ${fmt(remaining)}`}>
                    {fmt(remaining)}
                  </span>
                  {paused !== null && <span className="mt-1 text-sm font-bold opacity-80">en pausa</span>}
                </div>
              </div>

              <div className="mt-8 w-full text-center">
                {isBreak ? (
                  <p className="font-display text-xl font-bold">
                    Levántate, bebe agua, estira. El móvil… mejor no 😇
                  </p>
                ) : task ? (
                  <>
                    <p className="text-sm font-semibold opacity-80">{task.title}</p>
                    <p className="font-display mt-1 text-xl font-bold leading-snug">
                      {step ? step.text : "¡Todos los pasos hechos! Repasa lo que quieras."}
                    </p>
                    {step && (
                      <button
                        onClick={markStep}
                        className="mx-auto mt-4 flex min-h-12 items-center gap-2 rounded-full bg-white px-5 font-bold text-azul-700 active:scale-95"
                      >
                        <Check className="h-5 w-5" strokeWidth={3} /> Paso hecho
                      </button>
                    )}
                  </>
                ) : (
                  <p className="font-display text-xl font-bold">Lo que sea, pero empieza. Tú puedes.</p>
                )}
              </div>
            </div>

            {parking ? (
              <form
                className="mb-4 space-y-2 rounded-3xl bg-white p-4 text-ink"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (thought.trim()) store.park(thought.trim());
                  setThought("");
                  setParking(false);
                  ui.toast("Aparcado 🅿️ Luego lo miras. Ahora, a lo tuyo.");
                }}
              >
                <label htmlFor="thought" className="font-bold">
                  ¿Qué se te ha pasado por la cabeza?
                </label>
                <input
                  id="thought"
                  autoFocus
                  className={inputCls}
                  value={thought}
                  onChange={(e) => setThought(e.target.value)}
                  placeholder="Ej: contestar a Lucía, buscar esa canción…"
                />
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Aparcar y volver
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setParking(false)}>
                    Nada
                  </Button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => (paused === null ? setPaused(endAt - Date.now()) : resume())}
                  className="flex min-h-16 flex-col items-center justify-center rounded-2xl bg-white/15 text-sm font-bold active:scale-95"
                >
                  {paused === null ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  {paused === null ? "Pausa" : "Seguir"}
                </button>
                {!isBreak ? (
                  <button
                    onClick={() => setParking(true)}
                    className="flex min-h-16 flex-col items-center justify-center rounded-2xl bg-sun text-sm font-bold text-ink active:scale-95"
                  >
                    <CloudDrizzle className="h-6 w-6" />
                    Me he despistado
                  </button>
                ) : (
                  <span />
                )}
                <button
                  onClick={stopEarly}
                  className="flex min-h-16 flex-col items-center justify-center rounded-2xl bg-white/15 text-sm font-bold active:scale-95"
                >
                  <Square className="h-6 w-6" />
                  {isBreak ? "Saltar" : "Parar"}
                </button>
              </div>
            )}
          </>
        ) : (
          <DoneScreen cfg={cfg} exits={exits} />
        )}
      </div>

      {away && phase === "run" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink/60 p-6">
          <div className="animate-pop w-full max-w-sm rounded-[32px] bg-white p-6 text-center text-ink">
            <Mascot mood="tranqui" size={110} className="mx-auto" />
            <h2 className="font-display mt-2 text-2xl font-extrabold">{comeback}</h2>
            <p className="mt-2 text-ink-soft">
              He pausado el reloj. Llevas {exits} {exits === 1 ? "salida" : "salidas"} en este bloque. Sin dramas: lo importante es volver.
            </p>
            <Button className="mt-5 w-full" onClick={resume}>
              <Play className="h-5 w-5" fill="currentColor" /> Volvemos
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function DoneScreen({ cfg, exits }: { cfg: FocusConfig; exits: number }) {
  const ui = useUI();
  const { data, setSettings } = useStore();
  const s = data.settings;
  const nextBlock = blockMinutes(cfg.energy, s.focusMinutes);
  const recent = data.sessions.filter((x) => x.kind === "focus").slice(-8, -1);
  const avgExits = recent.length ? recent.reduce((n, x) => n + x.exits, 0) / recent.length : null;
  const timer = timerById(s.method);
  const longBreak = cfg.kind === "focus" && !!timer?.every && s.blocksInARow > 0 && s.blocksInARow % timer.every === 0;
  const breakMin = longBreak ? timer!.longBreak! : s.breakMinutes;
  const suggestMore = cfg.kind === "focus" && !timer?.every && s.blocksInARow >= 3 && s.focusMinutes < 50;

  const startBlock = (minutes = nextBlock) => ui.startFocus({ kind: "focus", minutes, taskId: cfg.taskId, energy: cfg.energy });

  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center">
      <Mascot mood={cfg.kind === "break" ? "contenta" : "eufórica"} size={150} />
      {cfg.kind === "five" && (
        <>
          <h2 className="font-display mt-4 text-4xl font-extrabold">¡5 minutos hechos!</h2>
          <p className="mt-2 text-lg opacity-90">Lo más difícil (empezar) ya está. ¿Sigues un poco más?</p>
          <div className="mt-8 w-full space-y-3">
            <Button variant="sun" className="w-full py-4 text-lg" onClick={() => startBlock()}>
              ¡Sí! {nextBlock} minutos más
            </Button>
            <Button variant="white" className="w-full" onClick={ui.endFocus}>
              No, por hoy vale (y está genial)
            </Button>
          </div>
        </>
      )}
      {cfg.kind === "focus" && (
        <>
          <h2 className="font-display mt-4 text-4xl font-extrabold">¡Bloque completado!</h2>
          <p className="mt-2 text-lg opacity-90">
            {exits === 0
              ? `Y sin salir de la app ni una vez. ${gx(s, "Reina", "Crack")}. 👑`
              : avgExits !== null && exits < avgExits
                ? `Solo ${exits} ${exits === 1 ? "salida" : "salidas"}: menos que tu media. ¡Mejorando!`
                : `${exits} ${exits === 1 ? "salida" : "salidas"}. La próxima, No molestar y a por el 0.`}
          </p>
          {suggestMore && (
            <div className="mt-5 w-full rounded-3xl bg-white/15 p-4">
              <p className="font-bold">Llevas {s.blocksInARow} bloques seguidos 🔥 ¿Subimos a {s.focusMinutes + 5} min?</p>
              <div className="mt-3 flex gap-2">
                <Button variant="sun" className="flex-1" onClick={() => setSettings({ focusMinutes: s.focusMinutes + 5, blocksInARow: 0, method: "libre" })}>
                  ¡Venga!
                </Button>
                <Button variant="white" className="flex-1" onClick={() => setSettings({ blocksInARow: 0 })}>
                  Así estoy bien
                </Button>
              </div>
            </div>
          )}
          <div className="mt-6 w-full space-y-3">
            <Button variant="mint" className="w-full py-4 text-lg" onClick={() => ui.startFocus({ kind: "break", minutes: breakMin, taskId: cfg.taskId, energy: cfg.energy })}>
              {longBreak ? `¡${s.blocksInARow} pomodoros! Descanso largo de ${breakMin} min 🍅` : `Descanso de ${breakMin} min`}
            </Button>
            <Button variant="white" className="w-full" onClick={ui.endFocus}>
              Terminar por hoy
            </Button>
          </div>
        </>
      )}
      {cfg.kind === "break" && (
        <>
          <h2 className="font-display mt-4 text-4xl font-extrabold">¡Fin del descanso!</h2>
          <p className="mt-2 text-lg">¿Otro bloque? Tu cerebro ya está calentito.</p>
          <div className="mt-8 w-full space-y-3">
            <Button className="w-full py-4 text-lg" onClick={() => startBlock(s.focusMinutes)}>
              Otro bloque de {s.focusMinutes} min
            </Button>
            <Button variant="white" className="w-full" onClick={ui.endFocus}>
              Terminar por hoy
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
