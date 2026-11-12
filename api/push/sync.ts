import { isSubscription, json, pushConfigured, rpc } from "./_shared";

interface Reminder {
  at: string;
  title: string;
  body: string;
  tag?: string;
}

async function publicKey(): Promise<string | null> {
  return pushConfigured() ? rpc<string | null>("push_vapid_public").catch(() => null) : null;
}

/** GET: ¿están activados los avisos? Devuelve la clave pública para suscribirse. */
export async function GET() {
  const key = await publicKey();
  return json({ enabled: !!key, publicKey: key });
}

/** POST: guarda la suscripción del móvil y su lista de próximos avisos. */
export async function POST(request: Request) {
  if (!(await publicKey())) return json({ enabled: false }, 503);

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
    .slice(0, 199)
    .map((r) => ({ at: r.at, title: r.title.slice(0, 120), body: r.body.slice(0, 300), tag: r.tag?.slice(0, 60) }));

  // Aviso de prueba: sale en el siguiente minuto con el resto
  if (body.test) {
    reminders.unshift({
      at: new Date().toISOString(),
      title: "¡Funciona! 🎉",
      body: "Así te avisaré para estudiar. Con cariño y sin agobios 🐒",
      tag: "test",
    });
  }

  try {
    const saved = await rpc<number>("push_sync", { p_subscription: body.subscription, p_reminders: reminders });
    return json({ enabled: true, saved, test: body.test ? "queued" : undefined });
  } catch (e) {
    console.error(e);
    return json({ error: "no se pudo guardar" }, 500);
  }
}
