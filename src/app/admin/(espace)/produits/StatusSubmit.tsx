"use client";

import { useFormStatus } from "react-dom";

/** Bouton d'envoi qui se désactive pendant l'action. */
export function StatusSubmit({
  children,
  className,
  pressed,
}: {
  children: React.ReactNode;
  className: string;
  pressed?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-pressed={pressed} className={`${className} disabled:opacity-60`}>
      {pending ? "…" : children}
    </button>
  );
}
