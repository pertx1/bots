import webpush, { type PushSubscription } from "web-push";

/**
 * Configuración (variables de entorno en Vercel, ninguna es secreta):
 * - SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY: dónde se guardan los avisos.
 * Los secretos (claves VAPID y secreto del cron) viven solo en Supabase
 * (private.config) y se piden con el secreto que manda el propio cron.
 */
export function pushConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
}

export async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_PUBLISHABLE_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw Object.assign(new Error(`${fn}: ${res.status} ${await res.text()}`), { status: res.status });
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export interface VapidKeys {
  publicKey: string;
  privateKey: string;
}

export interface PushMessage {
  title: string;
  body: string;
  tag?: string | null;
}

/** Envía una notificación. Devuelve "gone" si el móvil ya no acepta avisos. */
export async function sendPush(subscription: PushSubscription, msg: PushMessage, keys: VapidKeys): Promise<"ok" | "gone" | "error"> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(msg), {
      TTL: 60 * 60,
      urgency: "high",
      vapidDetails: { subject: "https://june-empieza.vercel.app", ...keys },
    });
    return "ok";
  } catch (e) {
    const status = (e as { statusCode?: number }).statusCode;
    return status === 404 || status === 410 ? "gone" : "error";
  }
}

export const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export function isSubscription(x: unknown): x is PushSubscription {
  const s = x as PushSubscription;
  return (
    !!s &&
    typeof s.endpoint === "string" &&
    s.endpoint.startsWith("https://") &&
    typeof s.keys?.p256dh === "string" &&
    typeof s.keys?.auth === "string"
  );
}
