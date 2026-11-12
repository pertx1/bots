import type { Settings } from "./types";

/** Elige la palabra según cómo quiere que le hable la app. */
export const gx = (s: Pick<Settings, "gender">, fem: string, masc: string) => (s.gender === "m" ? masc : fem);
