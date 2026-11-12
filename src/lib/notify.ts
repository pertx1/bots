/**
 * Notificaciones.
 * - Con la app abierta: toast + notificación del sistema si hay permiso.
 * - Con la app cerrada: push desde el servidor (ver src/lib/push.ts y api/push).
 * En iPhone solo hay permiso con la app instalada en la pantalla de inicio (iOS 16.4+).
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
