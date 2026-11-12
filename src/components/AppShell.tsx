"use client";

import { BarChart3, BookOpen, Home, Settings, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useRawStore, useStore } from "@/lib/store";
import { type Tab, UIProvider, useUI } from "./app-ui";
import { FocusOverlay } from "./FocusOverlay";
import { MissionSheet } from "./MissionSheet";
import { Onboarding } from "./Onboarding";
import { PreFocusSheet } from "./PreFocusSheet";
import { Estudiar } from "./screens/Estudiar";
import { Hoy } from "./screens/Hoy";
import { Orden } from "./screens/Orden";
import { Progreso } from "./screens/Progreso";
import { SettingsSheet } from "./SettingsSheet";
import { useReminders } from "./useReminders";

const TABS: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: "hoy", label: "Hoy", icon: Home },
  { id: "estudiar", label: "Estudiar", icon: BookOpen },
  { id: "orden", label: "Orden", icon: Sparkles },
  { id: "progreso", label: "Progreso", icon: BarChart3 },
];

export function App() {
  const raw = useRawStore();

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  if (!raw.data) return <Splash />;
  if (!raw.data.settings.onboarded) return <Onboarding />;
  return (
    <UIProvider>
      <Main />
    </UIProvider>
  );
}

function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-azul-600">
      <span className="font-display animate-pop text-5xl font-extrabold text-white">June</span>
    </div>
  );
}

function Main() {
  const ui = useUI();
  const { data } = useStore();
  useReminders();

  return (
    <div className="min-h-dvh">
      <header className="pt-safe sticky top-0 z-30 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 pb-2">
          <button onClick={() => ui.setTab("hoy")} className="font-display flex min-h-11 items-center gap-2 text-2xl font-extrabold text-azul-600">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-azul-600 text-lg text-white">J</span>
            {data.settings.name || "June"}
          </button>
          <button
            onClick={() => ui.setSettingsOpen(true)}
            aria-label="Ajustes"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-azul-700 shadow-sm active:scale-90"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-36">
        {ui.tab === "hoy" && <Hoy />}
        {ui.tab === "estudiar" && <Estudiar />}
        {ui.tab === "orden" && <Orden />}
        {ui.tab === "progreso" && <Progreso />}
      </main>

      <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 px-4" aria-label="Secciones">
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 rounded-[28px] bg-ink p-2 shadow-2xl shadow-ink/30">
          {TABS.map((t) => {
            const active = ui.tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => ui.setTab(t.id)}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-[20px] text-xs font-bold transition ${
                  active ? "bg-azul-600 text-white" : "text-azul-200"
                }`}
              >
                <t.icon className={`h-6 w-6 ${active ? "animate-pop" : ""}`} strokeWidth={active ? 2.6 : 2} />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex flex-col items-center gap-2 px-4 pt-[max(env(safe-area-inset-top),12px)]" aria-live="polite">
        {ui.toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-slide-up pointer-events-auto max-w-md rounded-2xl px-4 py-3 text-center font-bold shadow-xl ${
              t.tone === "mint" ? "bg-mint text-ink" : t.tone === "sun" ? "bg-sun text-ink" : "bg-azul-600 text-white"
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>

      <PreFocusSheet />
      <MissionSheet />
      <SettingsSheet />
      <FocusOverlay />
    </div>
  );
}
