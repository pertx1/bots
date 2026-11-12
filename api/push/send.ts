import type { PushSubscription } from "web-push";
import { json, pushConfigured, rpc, sendPush } from "./_shared";

interface Due {
  reminder_id: number;
  subscription: PushSubscription;
  title: string;
  body: string;
  tag: string | null;
}

/** Lo llama pg_cron (Supabase) cada minuto: envía los avisos que ya tocan. */
export async function POST(request: Request) {
  if (!pushConfigured() || !process.env.CRON_SECRET) return json({ enabled: false }, 503);
  const secret = request.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) return json({ error: "forbidden" }, 403);

  const due = await rpc<Due[]>("push_claim_due", { p_secret: secret });
  const results = await Promise.all(
    (due ?? []).map(async (d) => {
      const r = await sendPush(d.subscription, { title: d.title, body: d.body, tag: d.tag });
      if (r === "gone") await rpc("push_forget", { p_secret: secret, p_endpoint: d.subscription.endpoint }).catch(() => {});
      return r;
    }),
  );
  return json({ sent: results.filter((r) => r === "ok").length, gone: results.filter((r) => r === "gone").length });
}
