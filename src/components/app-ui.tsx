"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Energy, Mission } from "@/lib/types";

export type Tab = "hoy" | "estudiar" | "orden" | "progreso";

export interface FocusConfig {
  id?: number;
  kind: "five" | "focus" | "break";
  minutes: number;
  taskId?: string;
  energy?: Energy;
}

export interface PreFocusConfig {
  kind: "five" | "focus";
  taskId?: string;
}

interface Toast {
  id: number;
  text: string;
  tone: "azul" | "mint" | "sun";
}

interface UIState {
  tab: Tab;
  setTab: (t: Tab) => void;
  preFocus: PreFocusConfig | null;
  openPreFocus: (c: PreFocusConfig) => void;
  closePreFocus: () => void;
  focus: FocusConfig | null;
  startFocus: (c: FocusConfig) => void;
  endFocus: () => void;
  mission: Mission | null;
  rescue: boolean;
  startMission: (m: Mission) => void;
  startRescue: () => void;
  closeMission: () => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
  toasts: Toast[];
  toast: (text: string, tone?: Toast["tone"]) => void;
}

const Ctx = createContext<UIState | null>(null);
let toastId = 0;

export function UIProvider({ children }: { children: React.ReactNode }) {
  const [tab, setTab] = useState<Tab>("hoy");
  const [preFocus, setPreFocus] = useState<PreFocusConfig | null>(null);
  const [focus, setFocus] = useState<FocusConfig | null>(null);
  const [mission, setMission] = useState<Mission | null>(null);
  const [rescue, setRescue] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((text: string, tone: Toast["tone"] = "azul") => {
    const id = ++toastId;
    setToasts((t) => [...t.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const value = useMemo<UIState>(
    () => ({
      tab,
      setTab: (t) => {
        setTab(t);
        window.scrollTo({ top: 0 });
      },
      preFocus,
      openPreFocus: (c) => setPreFocus(c),
      closePreFocus: () => setPreFocus(null),
      focus,
      startFocus: (c) => {
        setPreFocus(null);
        setFocus({ ...c, id: ++toastId });
      },
      endFocus: () => setFocus(null),
      mission,
      rescue,
      startMission: (m) => {
        setRescue(false);
        setMission(m);
      },
      startRescue: () => {
        setMission(null);
        setRescue(true);
      },
      closeMission: () => {
        setMission(null);
        setRescue(false);
      },
      settingsOpen,
      setSettingsOpen,
      toasts,
      toast,
    }),
    [tab, preFocus, focus, mission, rescue, settingsOpen, toasts, toast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUI() {
  const v = useContext(Ctx);
  if (!v) throw new Error("Falta UIProvider");
  return v;
}

export function blockMinutes(energy: Energy | undefined, focusMinutes: number) {
  if (energy === 1) return Math.max(10, focusMinutes - 10);
  if (energy === 2) return Math.max(15, focusMinutes - 5);
  return focusMinutes;
}
