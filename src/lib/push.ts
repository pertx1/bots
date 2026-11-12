import { buildReminders } from "./schedule";
import type { AppData } from "./types";

/** Clave pública VAPID (la privada solo vive en Vercel). */
export const VAPID_PUBLIC_KEY = "BKhmtKCcqyWF0wGph2kokvi1_8zIBuO9hh9sqlE4NlbTPVcOfS3hVFJTd06dFHiki6vBJLU8IiedfDGWcWqftNw";
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

export async function serverPushEnabled(): Promise<boolean> {
  try {
    const r = await fetch("/api/push/sync", { cache: "no-store" });
    return r.ok && ((await r.json()) as { enabled?: boolean }).enabled === true;
  } catch {
    return false;
  }
}

function keyBytes(key: string) {
  const pad = "=".repeat((4 - (key.length % 4)) % 4);
  const raw = atob((key + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function subscription(): Promise<PushSubscription> {
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;
  return (
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_PUBLIC_KEY) }))
  );
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
    return r.test === "ok" ? "ok" : "error";
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
