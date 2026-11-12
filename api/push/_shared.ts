import webpush, { type PushSubscription } from "web-push";

/**
 * Configuración (variables de entorno en Vercel):
 * - VAPID_PRIVATE_KEY: clave privada (la pública está en src/lib/push.ts)
 * - SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY: dónde se guardan los avisos
 * - CRON_SECRET: el mismo secreto guardado en private.config de Supabase
 */
export const VAPID_PUBLIC_KEY = "BKhmtKCcqyWF0wGph2kokvi1_8zIBuO9hh9sqlE4NlbTPVcOfS3hVFJTd06dFHiki6vBJLU8IiedfDGWcWqftNw";

export function pushConfigured(): boolean {
  return !!(process.env.VAPID_PRIVATE_KEY && process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY);
}

export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_PUBLISHABLE_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`${fn}: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export interface PushMessage {
  title: string;
  body: string;
  tag?: string | null;
}

/** Envía una notificación. Devuelve "gone" si el móvil ya no acepta avisos. */
export async function sendPush(subscription: PushSubscription, msg: PushMessage): Promise<"ok" | "gone" | "error"> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(msg), {
      TTL: 60 * 60,
      urgency: "high",
      vapidDetails: {
        subject: "https://june-empieza.vercel.app",
        publicKey: VAPID_PUBLIC_KEY,
        privateKey: process.env.VAPID_PRIVATE_KEY!,
      },
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
