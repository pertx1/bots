/** Confeti ligerito en canvas, sin dependencias. */
const COLORS = ["#2552ff", "#5ec8ff", "#ffcf3d", "#ff5fa2", "#35d39a", "#ff8a3d"];

export function confetti(originX?: number, originY?: number, amount = 70) {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) amount = 18;

  const canvas = document.createElement("canvas");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  Object.assign(canvas.style, {
    position: "fixed",
    inset: "0",
    width: `${w}px`,
    height: `${h}px`,
    pointerEvents: "none",
    zIndex: "100",
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas.remove();
  ctx.scale(dpr, dpr);

  const ox = originX ?? w / 2;
  const oy = originY ?? h / 2;
  const parts = Array.from({ length: amount }, () => {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
    const v = 6 + Math.random() * 8;
    return {
      x: ox,
      y: oy,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      r: 4 + Math.random() * 5,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      c: COLORS[Math.floor(Math.random() * COLORS.length)],
      round: Math.random() < 0.35,
    };
  });

  const start = performance.now();
  const tick = (t: number) => {
    const el = t - start;
    ctx.clearRect(0, 0, w, h);
    parts.forEach((p) => {
      p.vy += 0.32;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - el / 1600);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.r / 1.6, 0, Math.PI * 2);
        ctx.fill();
      } else ctx.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
      ctx.restore();
    });
    if (el < 1600) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);

  try {
    navigator.vibrate?.(30);
  } catch {}
}

export function confettiFrom(el: Element | null, amount?: number) {
  if (!el) return confetti(undefined, undefined, amount);
  const r = el.getBoundingClientRect();
  confetti(r.left + r.width / 2, r.top + r.height / 2, amount);
}
