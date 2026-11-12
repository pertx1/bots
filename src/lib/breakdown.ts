import { uid } from "./dates";
import type { Step } from "./types";

/**
 * El desatascador: divide una tarea grande en pasos diminutos con reglas
 * locales (sin IA). El primer paso siempre es ridículamente fácil.
 */

type Kind = "estudiar" | "ejercicios" | "escribir" | "memorizar" | "generico";

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

function detectKind(t: string): Kind {
  if (/(ejercicio|problema|deberes|actividad|mates|matematicas|fisica|quimica|calcul)/.test(t)) return "ejercicios";
  if (/(trabajo|redaccion|comentario|presentacion|exposicion|entrega|ensayo|resumen de libro|escribir|disertacion)/.test(t)) return "escribir";
  if (/(memoriz|vocabulario|fechas|formulas|verbos|aprender(me)? de memoria|lista de)/.test(t)) return "memorizar";
  if (/(estudi|repas|tema|leccion|unidad|examen|apuntes|historia|lengua|biolog|geograf|filosof)/.test(t)) return "estudiar";
  return "generico";
}

/** Extrae lo que va después de "estudiar", "repasar"... para personalizar. */
function subjectOf(original: string): string {
  const cleaned = original
    .replace(/^\s*(estudiar|repasar|hacer|preparar|terminar|acabar|empezar|leer|memorizar)\s+(el|la|los|las|de)?\s*/i, "")
    .trim();
  return cleaned || original.trim();
}

const s = (text: string, minutes = 5): Step => ({ id: uid(), text, minutes, done: false });

export function breakDown(title: string): Step[] {
  const t = norm(title);
  const what = subjectOf(title);
  const isHistory = /historia/.test(t);
  const kind = detectKind(t);

  switch (kind) {
    case "estudiar": {
      const steps = [
        s(`Abre los apuntes o el libro por la primera página de «${what}». Solo ábrelo. Ya está, ya has empezado 🎉`, 1),
        s("Lee solo los títulos, subtítulos y negritas. Nada más. Como un tráiler.", 5),
        s("Lee el primer apartado con calma (solo ese)", 5),
        s("Escribe 3 palabras clave del primer apartado en un papel", 5),
        s("Lee el segundo apartado", 5),
        s("3 palabras clave del segundo apartado", 5),
      ];
      if (isHistory) {
        steps.push(
          s("Haz una línea del tiempo con las 5 fechas más importantes", 7),
          s("Personajes: apunta quién es quién y qué hizo, en una frase cada uno", 7),
          s("Causas y consecuencias: 2 de cada, en flechitas", 7),
        );
      } else {
        steps.push(s("Haz un mini-esquema juntando todas tus palabras clave", 7));
      }
      steps.push(
        s("Tapa todo y explícalo en voz alta como si fueras la profe (vale hacerlo al peluche)", 5),
        s("Apunta 3 preguntas que pondrías tú en el examen y contéstalas", 7),
      );
      return steps;
    }
    case "ejercicios":
      return [
        s(`Abre el libro o la hoja de «${what}» y busca el primer ejercicio. Solo búscalo.`, 1),
        s("Copia el enunciado del primer ejercicio. Sin resolverlo todavía.", 3),
        s("Subraya los datos y qué te piden", 3),
        s("Haz el primer ejercicio (si te atascas, mira un ejemplo resuelto)", 8),
        s("Haz el segundo ejercicio", 8),
        s("Haz el tercero", 8),
        s("Repasa los resultados y marca con ? lo que no entiendas para preguntarlo", 5),
      ];
    case "escribir":
      return [
        s(`Abre un documento o una hoja y escribe el título: «${what}». Fin del paso 1.`, 1),
        s("Escribe en sucio 5 ideas que se te ocurran, aunque sean malas", 5),
        s("Ordénalas: introducción, desarrollo, final", 5),
        s("Escribe la introducción en plan borrador feo (vale feo)", 8),
        s("Escribe el primer párrafo del desarrollo", 8),
        s("Escribe el resto del desarrollo", 10),
        s("Escribe el final en 3 frases", 5),
        s("Léelo en voz alta y corrige lo que suene raro", 7),
      ];
    case "memorizar":
      return [
        s(`Coge la lista de «${what}» y ponla delante. Ya está.`, 1),
        s("Divide la lista en grupitos de 5", 3),
        s("Lee el primer grupo 3 veces en voz alta", 5),
        s("Tápalo e intenta escribirlo de memoria", 5),
        s("Segundo grupo: leer, tapar, escribir", 7),
        s("Tercer grupo: leer, tapar, escribir", 7),
        s("Repaso relámpago de todo y marca lo que falla", 5),
      ];
    default:
      return [
        s(`Prepara lo que necesitas para «${what}» y déjalo delante. Solo eso.`, 1),
        s("Escribe en un papel cómo sabrás que has terminado", 3),
        s("Haz la primera parte, la más fácil", 5),
        s("Sigue con la siguiente parte", 5),
        s("Otra parte más", 5),
        s("Remata y revisa", 5),
      ];
  }
}

export const KIND_HINT =
  "Truco: escribe cosas como «estudiar tema 4 de historia», «ejercicios de mates pág. 52» o «trabajo de lengua».";
