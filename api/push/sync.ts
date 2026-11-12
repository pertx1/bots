import { isSubscription, json, pushConfigured, rpc, sendPush } from "./_shared";

interface Reminder {
  at: string;
  title: string;
  body: string;
  tag?: string;
}

/** GET: ¿están activados los avisos en el servidor? */
export function GET() {
  return json({ enabled: pushConfigured() });
}

/** POST: guarda la suscripción del móvil y su lista de próximos avisos. */
export async function POST(request: Request) {
  if (!pushConfigured()) return json({ enabled: false }, 503);

  let body: { subscription?: unknown; reminders?: unknown; test?: boolean };
  try {
    body = await request.json();
  } catch {
    return json({ error: "JSON no válido" }, 400);
  }
  if (!isSubscription(body.subscription)) return json({ error: "suscripción no válida" }, 400);

  const reminders = (Array.isArray(body.reminders) ? body.reminders : [])
    .filter(
      (r): r is Reminder =>
        !!r && typeof r.at === "string" && !Number.isNaN(Date.parse(r.at)) && typeof r.title === "string" && typeof r.body === "string",
    )
    .slice(0, 200)
    .map((r) => ({ at: r.at, title: r.title.slice(0, 120), body: r.body.slice(0, 300), tag: r.tag?.slice(0, 60) }));

  try {
    const saved = await rpc<number>("push_sync", { p_subscription: body.subscription, p_reminders: reminders });
    let test: string | undefined;
    if (body.test) {
      test = await sendPush(body.subscription, {
        title: "¡Funciona! 🎉",
        body: "Así te avisaré para estudiar. Tranqui, con cariño 🐒",
        tag: "test",
      });
    }
    return json({ enabled: true, saved, test });
  } catch (e) {
    console.error(e);
    return json({ error: "no se pudo guardar" }, 500);
  }
}
