/**
 * Notificaciones.
 * v1: avisos locales mientras la app está abierta (toast + Notification del
 *     sistema si hay permiso). En iPhone solo hay permiso con la app instalada
 *     en la pantalla de inicio (iOS 16.4+).
 * v2: push real desde servidor. Dejamos preparado `subscribeToPush` y el
 *     manejador `push` en /sw.js; solo falta un backend con claves VAPID.
 */

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

export async function askNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export async function systemNotify(title: string, body: string) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      await reg.showNotification(title, { body, icon: "/icons/icon-192.png", badge: "/icons/icon-192.png" });
      return;
    }
    new Notification(title, { body, icon: "/icons/icon-192.png" });
  } catch {}
}

/** v2: suscripción push. Necesita NEXT_PUBLIC_VAPID_KEY y un backend que guarde la suscripción. */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  const key = process.env.NEXT_PUBLIC_VAPID_KEY;
  if (!key || !("serviceWorker" in navigator) || !("PushManager" in window)) return null;
  const reg = await navigator.serviceWorker.ready;
  const padding = "=".repeat((4 - (key.length % 4)) % 4);
  const raw = atob((key + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const appKey = Uint8Array.from(raw, (ch) => ch.charCodeAt(0));
  const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: appKey });
  // TODO v2: enviar `sub` al backend (p. ej. una tabla de Supabase).
  return sub;
}
