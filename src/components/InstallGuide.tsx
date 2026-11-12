import { Compass, Share, SquarePlus, Smartphone } from "lucide-react";

const STEPS = [
  { icon: Compass, title: "Ábrela en Safari", text: "Tiene que ser Safari (la brújula azul), no Instagram ni WhatsApp." },
  { icon: Share, title: "Toca Compartir", text: "El cuadrado con la flecha hacia arriba, abajo en el centro (o arriba a la derecha)." },
  { icon: SquarePlus, title: "«Añadir a pantalla de inicio»", text: "Baja un poco en el menú hasta encontrarlo. Luego toca «Añadir»." },
  { icon: Smartphone, title: "¡Ábrela desde el icono!", text: "A partir de ahora es una app más: pantalla completa y avisos." },
];

export function InstallGuide({ dark = false }: { dark?: boolean }) {
  return (
    <ol className="space-y-3">
      {STEPS.map((s, i) => (
        <li key={s.title} className={`flex items-start gap-3 rounded-2xl p-3 ${dark ? "bg-white/12" : "bg-azul-50"}`}>
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              dark ? "bg-white text-azul-700" : "bg-azul-600 text-white"
            }`}
          >
            <s.icon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-bold">
              {i + 1}. {s.title}
            </p>
            <p className={`text-sm ${dark ? "text-azul-50" : "text-ink-soft"}`}>{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
