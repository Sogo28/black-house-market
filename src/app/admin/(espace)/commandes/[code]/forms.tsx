"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { confirmOrder, type ConfirmState } from "./actions";

/** Bouton d'envoi qui se désactive pendant l'action. */
export function SubmitButton({ children, className }: { children: React.ReactNode; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:opacity-60`}>
      {pending ? "…" : children}
    </button>
  );
}

export function ConfirmForm({ code, commune }: { code: string; commune: string }) {
  const [state, formAction, pending] = useActionState<ConfirmState, FormData>(confirmOrder, { error: null });
  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4">
      <input type="hidden" name="code" value={code} />
      <label htmlFor="deliveryFee" className="font-semibold">
        Frais de livraison
      </label>
      <div className="flex h-12 overflow-hidden rounded-lg border border-line">
        <input
          id="deliveryFee"
          name="deliveryFee"
          inputMode="numeric"
          placeholder="2000"
          required
          className="min-w-0 flex-1 px-3 text-base outline-none"
        />
        <span className="flex items-center border-l border-line bg-sand px-3 font-semibold">FCFA</span>
      </div>
      <p className="text-sm text-muted">Selon le devis du livreur pour {commune}.</p>
      {state.error && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-13 rounded-lg bg-ink font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Confirmer la commande"}
      </button>
    </form>
  );
}
