/** Frases de la app: tono amiga graciosa, en femenino, español de España. */

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export function greeting(name: string, hour = new Date().getHours()): { hello: string; line: string } {
  if (hour < 6)
    return { hello: `¿${name}? ¿Despierta a estas horas?`, line: "Lo mejor que puedes hacer ahora es dormir. En serio. Mañana arrasamos." };
  if (hour < 12)
    return {
      hello: `¡Buenos días, ${name}! ☀️`,
      line: pick([
        "Hoy no hace falta hacerlo todo. Solo empezar.",
        "Café, colacao o lo que sea. Y luego 5 minutitos.",
        "Tu yo de por la tarde te va a dar las gracias.",
      ]),
    };
  if (hour < 16)
    return {
      hello: `¡Hola, ${name}! 🌞`,
      line: pick([
        "Es mediodía: tu superpoder. Ahora rindes como nunca.",
        "Hora punta de tu cerebro. ¿La aprovechamos?",
        "Mediodía = tu momento. Lo dicen los datos (tus datos).",
      ]),
    };
  if (hour < 21)
    return {
      hello: `¡Buenas tardes, ${name}! 🌇`,
      line: pick([
        "¿Llegas cansada? Normal. 5 minutos y decides.",
        "Pequeñito y hecho > perfecto y sin empezar.",
        "La silla de la ropa te está mirando 👀",
      ]),
    };
  return {
    hello: `¡Buenas noches, ${name}! 🌙`,
    line: pick([
      "Un mini paso y a descansar. Trato hecho.",
      "Prepara la mesa para mañana y tu yo del futuro te hará una estatua.",
      "Hoy ya cuenta si haces UNA cosa.",
    ]),
  };
}

export const FIVE_MIN_PROMISES = [
  "Prometido: al acabar puedes parar.",
  "5 minutos. Ni uno más (salvo que quieras).",
  "Lo difícil es empezar. Lo demás va solo.",
];

export const DONE_CHEERS = [
  "¡Toma ya! 🎉",
  "¡Tachado! Qué gustito.",
  "Una menos. Eres una máquina.",
  "¡Bum! Hecho.",
  "Esto merece un bailecito.",
  "Blu está dando volteretas.",
];

export const COMEBACK = [
  "Te has ido un momentito… ¿volvemos?",
  "¡Ey! Te estaba esperando. ¿Seguimos?",
  "El móvil es muy pesado, lo sé. ¿Volvemos a lo nuestro?",
];

export const randomFrom = pick;
