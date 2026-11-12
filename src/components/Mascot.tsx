import type { AppData } from "@/lib/types";
import { addDays, todayKey } from "@/lib/dates";

export type Mood = "eufórica" | "contenta" | "tranqui" | "aburrida";

/** El mono de June, nunca riñe: como mucho se aburre y te invita a jugar. */
export function mascotMood(d: AppData): { mood: Mood; line: string } {
  const n = d.settings.petName || "Blu";
  const t = todayKey();
  const todayActions =
    d.missionLog.filter((l) => l.date === t).length +
    d.sessions.filter((s) => s.date === t && s.completed).length +
    d.tasks.filter((x) => x.doneAt?.startsWith(t)).length;
  const active = new Set(d.activeDays);

  if (todayActions >= 3)
    return { mood: "eufórica", line: `¡${n} está dando volteretas de liana en liana! Hoy lo estás petando 🐒` };
  if (active.has(t)) return { mood: "contenta", line: `${n} está feliz de verte en acción. ¿Otro poquito?` };
  if (active.has(addDays(t, -1)))
    return { mood: "tranqui", line: `${n} te ha guardado un plátano 🍌 ¿Empezamos con algo mini?` };
  if (d.activeDays.length === 0)
    return { mood: "tranqui", line: `¡Hola! Soy ${n}, tu mono. Me pongo contentísimo cada vez que empiezas algo, aunque sea pequeñito.` };
  return {
    mood: "aburrida",
    line: `${n} se aburre un poquito sin ti… pero sin dramas: 5 minutitos y vuelve la fiesta.`,
  };
}

const FUR = "#8eabff";
const FACE = "#ffe2c6";
const INK = "#0d1440";

export function Mascot({
  mood = "contenta",
  size = 120,
  className = "",
  name = "tu mono",
}: {
  mood?: Mood;
  size?: number;
  className?: string;
  name?: string;
}) {
  const happy = mood === "eufórica" || mood === "contenta";
  const bored = mood === "aburrida";
  return (
    <svg
      viewBox="0 0 160 160"
      width={size}
      height={size}
      className={`${bored ? "" : "animate-float"} ${className}`}
      role="img"
      aria-label={`${name} está ${mood}`}
    >
      <ellipse cx="80" cy="152" rx="40" ry="6" fill={INK} opacity="0.12" />

      {/* cola */}
      <path d="M108 136 C140 140, 150 112, 136 102 C126 96, 118 108, 128 112" fill="none" stroke={INK} strokeWidth="11" strokeLinecap="round" />
      <path d="M108 136 C140 140, 150 112, 136 102 C126 96, 118 108, 128 112" fill="none" stroke={FUR} strokeWidth="5" strokeLinecap="round" />

      {/* bracitos */}
      <g strokeLinecap="round">
        {happy ? (
          <>
            <path d="M52 126 L28 100" stroke={INK} strokeWidth="16" />
            <path d="M108 126 L132 100" stroke={INK} strokeWidth="16" />
            <path d="M52 126 L28 100" stroke={FUR} strokeWidth="9" />
            <path d="M108 126 L132 100" stroke={FUR} strokeWidth="9" />
            <circle cx="27" cy="99" r="6.5" fill={FACE} stroke={INK} strokeWidth="3.5" />
            <circle cx="133" cy="99" r="6.5" fill={FACE} stroke={INK} strokeWidth="3.5" />
          </>
        ) : (
          <>
            <path d="M54 128 L40 144" stroke={INK} strokeWidth="16" />
            <path d="M106 128 L120 144" stroke={INK} strokeWidth="16" />
            <path d="M54 128 L40 144" stroke={FUR} strokeWidth="9" />
            <path d="M106 128 L120 144" stroke={FUR} strokeWidth="9" />
          </>
        )}
      </g>

      {/* cuerpo */}
      <ellipse cx="80" cy="132" rx="30" ry="18" fill={FUR} stroke={INK} strokeWidth="4" />
      <ellipse cx="80" cy="136" rx="16" ry="10" fill={FACE} />

      {/* orejas */}
      <circle cx="30" cy="76" r="18" fill={FUR} stroke={INK} strokeWidth="4" />
      <circle cx="130" cy="76" r="18" fill={FUR} stroke={INK} strokeWidth="4" />
      <circle cx="31" cy="77" r="9.5" fill={FACE} />
      <circle cx="129" cy="77" r="9.5" fill={FACE} />

      {/* cabeza */}
      <circle cx="80" cy="74" r="50" fill={FUR} stroke={INK} strokeWidth="4.5" />
      {/* tupé */}
      <path d="M72 26 C70 14, 80 10, 82 22 C84 12, 94 14, 90 27" fill={FUR} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      {/* brillo */}
      <ellipse cx="50" cy="48" rx="9" ry="5" fill="white" opacity="0.55" transform="rotate(-35 50 48)" />

      {/* careta */}
      <g fill={FACE}>
        <circle cx="64" cy="74" r="21" />
        <circle cx="96" cy="74" r="21" />
        <ellipse cx="80" cy="100" rx="32" ry="21" />
      </g>

      {/* ojos */}
      {mood === "eufórica" ? (
        <g fill="#ffcf3d" stroke={INK} strokeWidth="2.5" strokeLinejoin="round">
          <path d="M64 62 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1z" />
          <path d="M96 62 l4 8 9 1 -7 6 2 9 -8 -5 -8 5 2 -9 -7 -6 9 -1z" />
        </g>
      ) : mood === "contenta" ? (
        <g stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none">
          <path d="M56 76 Q64 66 72 76" />
          <path d="M88 76 Q96 66 104 76" />
        </g>
      ) : bored ? (
        <g>
          <circle cx="64" cy="76" r="9" fill="white" stroke={INK} strokeWidth="2" />
          <circle cx="96" cy="76" r="9" fill="white" stroke={INK} strokeWidth="2" />
          <circle cx="65" cy="79" r="4.5" fill={INK} />
          <circle cx="97" cy="79" r="4.5" fill={INK} />
          <rect x="53" y="64" width="22" height="11" rx="3" fill={FACE} />
          <rect x="85" y="64" width="22" height="11" rx="3" fill={FACE} />
          <path d="M55 75 H73 M87 75 H105" stroke={INK} strokeWidth="3" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          <circle cx="64" cy="74" r="10" fill="white" stroke={INK} strokeWidth="2" />
          <circle cx="96" cy="74" r="10" fill="white" stroke={INK} strokeWidth="2" />
          <circle cx="66" cy="76" r="5.5" fill={INK} />
          <circle cx="98" cy="76" r="5.5" fill={INK} />
          <circle cx="68" cy="73" r="2" fill="white" />
          <circle cx="100" cy="73" r="2" fill="white" />
        </g>
      )}

      {/* nariz */}
      <circle cx="75" cy="94" r="2.6" fill={INK} />
      <circle cx="85" cy="94" r="2.6" fill={INK} />

      {/* mofletes */}
      <ellipse cx="50" cy="96" rx="7" ry="4.5" fill="#ff5fa2" opacity={happy ? 0.7 : 0.35} />
      <ellipse cx="110" cy="96" rx="7" ry="4.5" fill="#ff5fa2" opacity={happy ? 0.7 : 0.35} />

      {/* boca */}
      {mood === "eufórica" ? (
        <path d="M64 102 Q80 124 96 102 Z" fill={INK} />
      ) : mood === "contenta" ? (
        <path d="M66 104 Q80 116 94 104" stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none" />
      ) : bored ? (
        <path d="M70 110 Q80 106 90 110" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
      ) : (
        <path d="M71 106 Q80 112 89 106" stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none" />
      )}

      {bored && (
        <text x="128" y="34" fontSize="18" fontWeight="800" fill="#8eabff" fontFamily="sans-serif">
          …
        </text>
      )}
    </svg>
  );
}
