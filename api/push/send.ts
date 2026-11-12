import webpush, { type PushSubscription } from "web-push";
import { json, pushConfigured, rpc, sendPush, type VapidKeys } from "./_shared";

interface Due {
  reminder_id: number;
  subscription: PushSubscription;
  title: string;
  body: string;
  tag: string | null;
}

/** Claves VAPID guardadas en Supabase; la primera vez se generan aquí y se guardan. */
async function vapidKeys(secret: string): Promise<VapidKeys> {
  const [row] = await rpc<{ public_key: string | null; private_key: string | null }[]>("push_vapid_keys", { p_secret: secret });
  if (row?.public_key && row.private_key) return { publicKey: row.public_key, privateKey: row.private_key };
  const fresh = webpush.generateVAPIDKeys();
  await rpc("push_set_vapid", { p_secret: secret, p_public: fresh.publicKey, p_private: fresh.privateKey });
  // Releer por si otra llamada las guardó a la vez
  const [saved] = await rpc<{ public_key: string; private_key: string }[]>("push_vapid_keys", { p_secret: secret });
  return { publicKey: saved.public_key, privateKey: saved.private_key };
}

/** Lo llama pg_cron (Supabase) cada minuto: envía los avisos que ya tocan. */
export async function POST(request: Request) {
  if (!pushConfigured()) return json({ enabled: false }, 503);
  const secret = request.headers.get("x-cron-secret");
  if (!secret) return json({ error: "forbidden" }, 403);

  let keys: VapidKeys;
  try {
    keys = await vapidKeys(secret);
  } catch {
    // Secreto incorrecto: Supabase responde «forbidden»
    return json({ error: "forbidden" }, 403);
  }

  const due = await rpc<Due[]>("push_claim_due", { p_secret: secret });
  const results = await Promise.all(
    (due ?? []).map(async (d) => {
      const r = await sendPush(d.subscription, { title: d.title, body: d.body, tag: d.tag }, keys);
      if (r === "gone") await rpc("push_forget", { p_secret: secret, p_endpoint: d.subscription.endpoint }).catch(() => {});
      return r;
    }),
  );
  return json({ sent: results.filter((r) => r === "ok").length, gone: results.filter((r) => r === "gone").length });
}
