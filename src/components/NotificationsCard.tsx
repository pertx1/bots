"use client";

import { Bell, BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import { isIOS, isStandalone } from "@/lib/notify";
import { disablePush, enablePush, pushEnabledHere, pushSupported, serverPushEnabled } from "@/lib/push";
import { useStore } from "@/lib/store";
import { useUI } from "./app-ui";
import { Button } from "./ui";

/** Activar/desactivar avisos. Se usa en Ajustes y como banner en Hoy. */
export function NotificationsCard({ compact = false }: { compact?: boolean }) {
  const { data } = useStore();
  const ui = useUI();
  const [on, setOn] = useState(false);
  const [server, setServer] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [env] = useState(() => ({ ios: isIOS(), standalone: isStandalone(), supported: pushSupported() }));

  useEffect(() => {
    let alive = true;
    serverPushEnabled().then((v) => {
      if (!alive) return;
      setServer(v);
      setOn(pushEnabledHere());
    });
    return () => {
      alive = false;
    };
  }, []);

  if (compact && (on || server === false || server === null)) return null;

  if (env.ios && !env.standalone)
    return compact ? null : (
      <p className="rounded-2xl bg-white p-3 text-sm">
        En iPhone los avisos solo funcionan con la app <b>instalada en la pantalla de inicio</b> (Compartir → Añadir a pantalla de
        inicio). Ábrela desde el icono y vuelve aquí.
      </p>
    );

  if (!env.supported)
    return compact ? null : <p className="rounded-2xl bg-white p-3 text-sm">Este navegador no permite avisos. Prueba desde Safari con la app instalada.</p>;

  if (on)
    return (
      <div className="space-y-2 rounded-2xl bg-white p-3">
        <p className="flex items-center gap-2 font-bold text-ink">
          <BellRing className="h-5 w-5 text-mint" /> Avisos activados en este móvil
        </p>
        <p className="text-sm text-ink-soft">Te aviso aunque tengas la app cerrada: sesiones de estudio, recoger, exámenes y racha.</p>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="flex-1"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              const r = await enablePush(data);
              setBusy(false);
              ui.toast(r === "ok" ? "Te he mandado una de prueba 📲" : "No ha llegado a salir. Prueba otra vez en un rato.", r === "ok" ? "mint" : "sun");
            }}
          >
            Probar
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              await disablePush();
              setOn(false);
            }}
          >
            Desactivar
          </Button>
        </div>
      </div>
    );

  if (server === false)
    return compact ? null : (
      <p className="rounded-2xl bg-white p-3 text-sm">
        Los avisos con la app cerrada todavía no están conectados al servidor. Mientras tanto te aviso dentro de la app cuando la tengas
        abierta.
      </p>
    );

  return (
    <div className={`space-y-2 rounded-3xl ${compact ? "card p-4" : "bg-white p-3"}`}>
      {compact && (
        <p className="font-display text-lg font-extrabold leading-tight">¿Te aviso cuando toque estudiar? 🔔</p>
      )}
      <p className="text-sm text-ink-soft">
        Te digo cuándo empezar cada sesión, la hora de recoger, los exámenes cerca y si la racha está en peligro.
      </p>
      <Button
        className="w-full"
        disabled={busy || server === null}
        onClick={async () => {
          setBusy(true);
          const r = await enablePush(data);
          setBusy(false);
          if (r === "ok") {
            setOn(true);
            ui.toast("¡Avisos activados! Te he mandado uno de prueba 🎉", "mint");
          } else if (r === "denied") ui.toast("Sin permiso no puedo avisarte. Actívalo en Ajustes del iPhone → Notificaciones → June.", "sun");
          else if (r === "server-off") setServer(false);
          else ui.toast("Algo ha fallado. Prueba otra vez en un ratito.", "sun");
        }}
      >
        <Bell className="h-5 w-5" /> Activar avisos
      </Button>
    </div>
  );
}
