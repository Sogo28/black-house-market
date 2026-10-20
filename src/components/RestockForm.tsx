"use client";

import { useActionState } from "react";
import { CheckCircleIcon } from "./icons";

type RestockFormProps = {
  action: (
    previous: { status: "idle" | "done" | "error"; message: string | null },
    formData: FormData,
  ) => Promise<{ status: "idle" | "done" | "error"; message: string | null }>;
};

/** « Me prévenir du retour » : le client laisse son numéro, Babacar le prévient sur WhatsApp. */
export function RestockForm({ action }: RestockFormProps) {
  const [state, formAction, pending] = useActionState(action, { status: "idle", message: null });

  if (state.status === "done") {
    return (
      <p role="status" className="flex items-start gap-2 rounded-xl bg-sand p-4 text-sm font-semibold">
        <CheckCircleIcon className="size-5 shrink-0 text-whatsapp" />
        C&apos;est noté : nous vous écrivons sur WhatsApp dès que ce produit revient.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-xl bg-sand p-4">
      <label htmlFor="restock-phone" className="font-semibold">
        Prévenez-moi dès son retour
      </label>
      <div className="flex h-12 overflow-hidden rounded-lg border border-line bg-white">
        <span className="flex items-center border-r border-line bg-sand px-3 font-semibold">+221</span>
        <input
          id="restock-phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          required
          placeholder="77 123 45 67"
          aria-invalid={state.status === "error"}
          className="min-w-0 flex-1 px-3 text-base outline-none"
        />
      </div>
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label>
          Ne pas remplir
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className="h-12 rounded-lg bg-ink font-semibold text-white disabled:opacity-60">
        {pending ? "Enregistrement…" : "Me prévenir sur WhatsApp"}
      </button>
    </form>
  );
}
