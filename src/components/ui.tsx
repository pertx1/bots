"use client";

import { Check, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { confettiFrom } from "@/lib/confetti";

type BtnVariant = "primary" | "sun" | "pink" | "mint" | "ghost" | "white";

const VARIANTS: Record<BtnVariant, string> = {
  primary: "bg-azul-600 text-white [--shadow:var(--color-azul-800)]",
  sun: "bg-sun text-ink [--shadow:#c99a12]",
  pink: "bg-pink text-ink [--shadow:#c93a78]",
  mint: "bg-mint text-ink [--shadow:#1f9a6e]",
  white: "bg-white text-ink [--shadow:var(--color-azul-200)]",
  ghost: "bg-azul-50 text-azul-700 [--shadow:var(--color-azul-100)]",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...rest
}: React.ComponentProps<"button"> & { variant?: BtnVariant }) {
  return (
    <button
      {...rest}
      className={`btn-3d inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 py-3 font-bold disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function IconButton({
  label,
  className = "",
  children,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition active:scale-90 ${className}`}
    >
      {children}
    </button>
  );
}

/** Check redondo que lanza confeti al marcar. */
export function DoneCheck({
  done,
  onToggle,
  label,
  size = "md",
}: {
  done: boolean;
  onToggle: () => void;
  label: string;
  size?: "md" | "lg";
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const dim = size === "lg" ? "h-12 w-12" : "h-11 w-11";
  return (
    <button
      ref={ref}
      role="checkbox"
      aria-checked={done}
      aria-label={label}
      onClick={() => {
        if (!done) confettiFrom(ref.current, 40);
        onToggle();
      }}
      className={`${dim} flex shrink-0 items-center justify-center rounded-full border-[3px] transition-all duration-300 active:scale-90 ${
        done ? "animate-pop border-mint bg-mint text-white" : "border-azul-200 bg-white text-transparent hover:border-azul-400"
      }`}
    >
      <Check strokeWidth={4} className="h-6 w-6" />
    </button>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  tone = "white",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  tone?: "white" | "azul";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="animate-fade-in absolute inset-0 bg-ink/45 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className={`animate-slide-up pb-safe relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[32px] px-5 pt-3 sm:rounded-[32px] ${
          tone === "azul" ? "bg-azul-600 text-white" : "bg-white"
        }`}
      >
        <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-current opacity-15" />
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? <h2 className="font-display text-2xl font-extrabold">{title}</h2> : <span />}
          <IconButton label="Cerrar" onClick={onClose} className={tone === "azul" ? "bg-white/15" : "bg-azul-50 text-azul-700"}>
            <X className="h-5 w-5" />
          </IconButton>
        </div>
        <div className="pb-4">{children}</div>
      </div>
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 mt-7 flex items-center justify-between gap-2 px-1">
      <h2 className="font-display text-xl font-extrabold tracking-tight">{children}</h2>
      {action}
    </div>
  );
}

export function Pill({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${className}`}>{children}</span>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-12 w-full items-center justify-between gap-3 py-1 text-left font-semibold"
    >
      <span>{label}</span>
      <span className={`relative h-8 w-14 shrink-0 rounded-full transition ${checked ? "bg-azul-600" : "bg-azul-100"}`}>
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${checked ? "left-7" : "left-1"}`}
        />
      </span>
    </button>
  );
}

export const inputCls =
  "w-full rounded-2xl border-2 border-azul-100 bg-azul-50/60 px-4 py-3 font-semibold text-ink placeholder:text-ink-soft/60 focus:border-azul-500 focus:bg-white focus:outline-none";
