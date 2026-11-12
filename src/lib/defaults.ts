import type { AppData, FreeSlot, Mission, Zone } from "./types";

export const ZONES: { id: Zone; label: string; emoji: string; color: string }[] = [
  { id: "ropa", label: "La silla de la ropa", emoji: "👀", color: "bg-pink" },
  { id: "escritorio", label: "El escritorio", emoji: "🖊️", color: "bg-sun" },
  { id: "habitacion", label: "La habitación", emoji: "🛏️", color: "bg-mint" },
];

const m = (id: string, zone: Zone, text: string, minutes: number): Mission => ({
  id,
  zone,
  text,
  minutes,
});

export const DEFAULT_MISSIONS: Mission[] = [
  m("r1", "ropa", "Coge 5 prendas de la silla. Solo 5. Cuéntalas en voz alta.", 2),
  m("r2", "ropa", "Lo que esté sucio de la silla, al cesto. Sin pensar.", 2),
  m("r3", "ropa", "Dobla o cuelga 3 cosas que estén limpias", 3),
  m("r4", "ropa", "Empareja los calcetines huérfanos que veas", 3),
  m("r5", "ropa", "Prepara la ropa de mañana y déjala en un sitio fijo", 3),
  m("r6", "ropa", "Que se vea el asiento de la silla. Misión cumplida si se puede sentar alguien.", 5),
  m("e1", "escritorio", "Tira a la basura todos los papelitos y envoltorios", 2),
  m("e2", "escritorio", "Lleva tazas, vasos y platos a la cocina", 2),
  m("e3", "escritorio", "Vacía la mochila encima de la cama y guarda lo que no toca mañana", 4),
  m("e4", "escritorio", "Bolis y rotus al bote. Los que no pintan, adiós.", 3),
  m("e5", "escritorio", "Apila los apuntes por asignatura (aunque sea en montoncitos)", 4),
  m("e6", "escritorio", "Deja la mesa con SOLO lo de la próxima sesión de estudio", 5),
  m("h1", "habitacion", "Haz la cama. Versión rápida, no de hotel.", 2),
  m("h2", "habitacion", "Recoge 10 cosas del suelo y déjalas en su sitio", 4),
  m("h3", "habitacion", "Abre la ventana 5 minutos y ventila", 1),
  m("h4", "habitacion", "Mesilla: deja solo 3 cosas encima", 3),
  m("h5", "habitacion", "Pon una canción y recoge hasta que acabe", 4),
  m("h6", "habitacion", "Saca la basura de la papelera", 2),
];

// Domingo a sábado. Entre semana después de clase; el finde, a mediodía (su mejor hora).
export const DEFAULT_FREE_TIME: FreeSlot[] = [
  { start: "12:30", minutes: 90 },
  { start: "16:30", minutes: 90 },
  { start: "16:30", minutes: 90 },
  { start: "16:30", minutes: 90 },
  { start: "16:30", minutes: 90 },
  { start: "16:30", minutes: 60 },
  { start: "12:30", minutes: 60 },
];

export function createDefaultData(): AppData {
  return {
    version: 1,
    settings: {
      name: "June",
      petName: "Coco",
      freeTime: DEFAULT_FREE_TIME,
      studyTime: "13:30",
      tidyTime: "19:30",
      focusMinutes: 25,
      breakMinutes: 5,
      reminders: { study: true, tidy: true, exams: true, streak: true },
      reminderLevel: "muchos",
      sound: "none",
      onboarded: false,
      blocksInARow: 0,
    },
    tasks: [],
    plans: [],
    missions: DEFAULT_MISSIONS,
    missionLog: [],
    sessions: [],
    parked: [],
    activeDays: [],
    notified: {},
  };
}
