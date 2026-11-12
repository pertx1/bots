/** Métodos de estudio: temporizadores (cómo repartir el tiempo) y técnicas (cómo estudiar). */

export type TimerId = "pomodoro" | "corto" | "52-17" | "90-20" | "libre";

export interface TimerMethod {
  id: Exclude<TimerId, "libre">;
  name: string;
  emoji: string;
  focus: number;
  brk: number;
  /** Descanso largo cada `every` bloques. */
  longBreak?: number;
  every?: number;
  desc: string;
}

export const TIMERS: TimerMethod[] = [
  {
    id: "pomodoro",
    name: "Pomodoro",
    emoji: "🍅",
    focus: 25,
    brk: 5,
    longBreak: 15,
    every: 4,
    desc: "25 min de foco y 5 de descanso. Cada 4 pomodoros, un descanso largo de 15. El clásico.",
  },
  {
    id: "corto",
    name: "Mini",
    emoji: "🐣",
    focus: 15,
    brk: 3,
    desc: "15 + 3. Para días flojos o cuando cuesta arrancar. Mejor poquito que nada.",
  },
  {
    id: "52-17",
    name: "52/17",
    emoji: "⚡",
    focus: 52,
    brk: 17,
    desc: "52 min a tope y 17 de desconexión total. Para cuando estás on fire.",
  },
  {
    id: "90-20",
    name: "Bloque 90",
    emoji: "🧘",
    focus: 90,
    brk: 20,
    desc: "Un bloque largo, al ritmo natural del cerebro, y 20 de descanso. Para repasos grandes.",
  },
];

export const timerById = (id: TimerId) => TIMERS.find((t) => t.id === id);

export interface Technique {
  id: string;
  name: string;
  emoji: string;
  what: string;
  best: string;
  steps: (topic: string) => { text: string; minutes: number }[];
  /** Repetición espaciada: además programa repasos en estos días. */
  reviewDays?: number[];
}

export const TECHNIQUES: Technique[] = [
  {
    id: "feynman",
    name: "Feynman",
    emoji: "🧑‍🏫",
    what: "Explicar el tema como si se lo contaras a alguien de 10 años. Donde te atascas, ahí está lo que no entiendes.",
    best: "Entender temas que se te atragantan",
    steps: (t) => [
      { text: `Escribe arriba de una hoja: «${t}»`, minutes: 1 },
      { text: "Lee el tema por encima (solo títulos y negritas)", minutes: 5 },
      { text: "Explícalo en voz alta o por escrito con palabras MUY fáciles, sin mirar", minutes: 7 },
      { text: "Marca dónde te has atascado o te has liado", minutes: 2 },
      { text: "Vuelve a los apuntes SOLO para esas partes", minutes: 7 },
      { text: "Explícalo otra vez entero. ¿Ya fluye?", minutes: 5 },
    ],
  },
  {
    id: "recuerdo",
    name: "Recuerdo activo",
    emoji: "🧠",
    what: "En vez de releer, te haces preguntas y las contestas sin mirar. Cuesta un poco más, pero se queda MUCHO mejor.",
    best: "Fijar conceptos, fechas y definiciones",
    steps: (t) => [
      { text: `Abre los apuntes de «${t}» por el primer apartado`, minutes: 1 },
      { text: "Escribe 5 preguntas sobre ese apartado (como si fueras la profe)", minutes: 7 },
      { text: "Cierra los apuntes y contéstalas", minutes: 7 },
      { text: "Corrige con los apuntes y marca las que fallaste", minutes: 4 },
      { text: "Repite solo las falladas", minutes: 5 },
    ],
  },
  {
    id: "blurting",
    name: "Blurting",
    emoji: "💥",
    what: "Lees un apartado, cierras el libro y escribes en un papel TODO lo que recuerdes, a lo loco. Luego comparas y completas en otro color.",
    best: "Historia y temas con mucho texto",
    steps: (t) => [
      { text: `Lee con calma el primer apartado de «${t}»`, minutes: 7 },
      { text: "Cierra el libro y escribe todo lo que recuerdes, sin orden ni vergüenza", minutes: 5 },
      { text: "Abre el libro y completa lo que faltaba en otro color", minutes: 5 },
      { text: "Siguiente apartado: leer, cerrar, escribir", minutes: 10 },
      { text: "Mira qué color hay más en tu hoja: eso es lo que tienes que repasar", minutes: 3 },
    ],
  },
  {
    id: "espaciada",
    name: "Repetición espaciada",
    emoji: "📆",
    what: "Repasar lo mismo al día siguiente, a los 3 días y a la semana. Así no se te olvida justo antes del examen.",
    best: "Exámenes con algo de tiempo por delante",
    reviewDays: [1, 3, 7],
    steps: (t) => [
      { text: `Estudia «${t}» hoy (con el método que quieras)`, minutes: 20 },
      { text: "Escribe en una hoja las 5 ideas más importantes", minutes: 5 },
    ],
  },
  {
    id: "cornell",
    name: "Apuntes Cornell",
    emoji: "📝",
    what: "Divide la hoja: notas a la derecha, preguntas clave a la izquierda y un resumen abajo. Te sirven para estudiar y para repasar.",
    best: "Tomar apuntes que luego sirvan",
    steps: (t) => [
      { text: "Dibuja en una hoja una línea vertical (a 1/3) y una horizontal abajo", minutes: 1 },
      { text: `Derecha: apuntes de «${t}» con tus palabras, cortitos`, minutes: 10 },
      { text: "Izquierda: una pregunta o palabra clave por cada bloque de notas", minutes: 5 },
      { text: "Abajo: resume la hoja en 3 frases", minutes: 4 },
      { text: "Tapa la derecha y contesta las preguntas de la izquierda", minutes: 5 },
    ],
  },
  {
    id: "mapa",
    name: "Mapa mental",
    emoji: "🕸️",
    what: "El tema en el centro y ramas con las ideas clave, colores y dibujitos. Ves el tema entero de un vistazo.",
    best: "Temas largos y relacionar cosas",
    steps: (t) => [
      { text: `Escribe «${t}» en el centro de una hoja en horizontal`, minutes: 1 },
      { text: "Saca una rama por cada apartado del tema", minutes: 4 },
      { text: "En cada rama, 2-3 palabras clave (no frases)", minutes: 8 },
      { text: "Añade colores, flechas entre ideas relacionadas y algún dibujito", minutes: 5 },
      { text: "Explica el mapa en voz alta de memoria", minutes: 4 },
    ],
  },
];
