import { buildReminders } from "./schedule";
import type { AppData } from "./types";

const FLAG = "june-push-on";

export function pushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export function pushEnabledHere(): boolean {
  try {
    return localStorage.getItem(FLAG) === "1" && Notification.permission === "granted";
  } catch {
    return false;
  }
}

/** Clave pública VAPID que da el servidor (null si los avisos no están activados allí). */
async function serverKey(): Promise<string | null> {
  try {
    const r = await fetch("/api/push/sync", { cache: "no-store" });
    if (!r.ok) return null;
    const j = (await r.json()) as { enabled?: boolean; publicKey?: string | null };
    return j.enabled && j.publicKey ? j.publicKey : null;
  } catch {
    return null;
  }
}

export async function serverPushEnabled(): Promise<boolean> {
  return !!(await serverKey());
}

function keyBytes(key: string) {
  const pad = "=".repeat((4 - (key.length % 4)) % 4);
  const raw = atob((key + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function subscription(): Promise<PushSubscription> {
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) return existing;
  const key = await serverKey();
  if (!key) throw new Error("server-off");
  return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });
}

async function post(data: AppData, test = false) {
  const sub = await subscription();
  const res = await fetch("/api/push/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subscription: sub.toJSON(), reminders: buildReminders(data), test }),
  });
  if (!res.ok) throw new Error(String(res.status));
  return (await res.json()) as { saved: number; test?: string };
}

export type EnableResult = "ok" | "denied" | "unsupported" | "server-off" | "error";

/** Pide permiso (tiene que ser dentro de un toque) y se suscribe. */
export async function enablePush(data: AppData): Promise<EnableResult> {
  if (!pushSupported()) return "unsupported";
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return "denied";
  try {
    if (!(await serverPushEnabled())) return "server-off";
    const r = await post(data, true);
    localStorage.setItem(FLAG, "1");
    return r.test === "queued" ? "ok" : "error";
  } catch {
    return "error";
  }
}

/** Manda la lista actualizada de avisos (si están activados en este móvil). */
export async function syncPush(data: AppData) {
  if (!pushSupported() || !pushEnabledHere()) return;
  try {
    await post(data);
  } catch {
    // Sin conexión: se reintenta en el siguiente cambio
  }
}

export async function disablePush() {
  try {
    localStorage.removeItem(FLAG);
    const reg = await navigator.serviceWorker.getRegistration();
    await (await reg?.pushManager.getSubscription())?.unsubscribe();
  } catch {}
}
