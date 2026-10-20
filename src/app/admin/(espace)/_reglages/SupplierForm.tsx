"use client";

import { useActionState } from "react";
import { formatSenegalMobile } from "@/domain/phone";
import { removeSupplier, saveSupplier, type SettingsState } from "./actions";

type SupplierFormProps = {
  /** Absent : formulaire de création. */
  supplier?: { id: string; name: string; whatsapp: string | null; notes: string | null; productCount: number };
};

const INITIAL: SettingsState = { errors: {}, attempt: 0 };
const inputClass = "h-12 w-full rounded-lg border border-line px-3 text-base";

export function SupplierForm({ supplier }: SupplierFormProps) {
  const [state, formAction, pending] = useActionState(saveSupplier, INITIAL);
  const [removeState, removeAction, removing] = useActionState(removeSupplier, INITIAL);
  const errors = state.errors;
  const id = supplier?.id;
  const v = state.values;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
      <form key={state.attempt} action={formAction} className="flex flex-col gap-3">
        {id && <input type="hidden" name="id" value={id} />}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            Nom
            <input name="name" required defaultValue={v?.name ?? supplier?.name} placeholder="Ex : Fournisseur 1 · Beauté" className={`${inputClass} font-normal`} />
            {errors.name && <span className="font-semibold text-red-700">{errors.name}</span>}
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-semibold">
            WhatsApp (9 chiffres)
            <input
              name="whatsapp"
              type="tel"
              inputMode="tel"
              defaultValue={v?.whatsapp ?? (supplier?.whatsapp ? formatSenegalMobile(supplier.whatsapp) : "")}
              placeholder="77 123 45 67"
              className={`${inputClass} font-normal`}
            />
            {errors.whatsapp && <span className="font-semibold text-red-700">{errors.whatsapp}</span>}
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Notes (facultatif)
          <input name="notes" defaultValue={v?.notes ?? supplier?.notes ?? ""} placeholder="Ex : répond avant 17 h" className={`${inputClass} font-normal`} />
          {errors.notes && <span className="font-semibold text-red-700">{errors.notes}</span>}
        </label>
        {errors.form && (
          <p role="alert" className="text-sm font-semibold text-red-700">
            {errors.form}
          </p>
        )}
        {state.saved && (
          <p role="status" className="text-sm font-semibold text-whatsapp">
            Enregistré.
          </p>
        )}
        <button type="submit" disabled={pending} className="h-12 rounded-lg bg-ink font-semibold text-white disabled:opacity-60">
          {pending ? "Enregistrement…" : id ? "Enregistrer" : "Ajouter le fournisseur"}
        </button>
      </form>

      {id && (
        <form action={removeAction} className="flex flex-col gap-1.5 border-t border-line pt-3">
          <input type="hidden" name="id" value={id} />
          <p className="text-sm text-muted">
            {supplier.productCount} produit{supplier.productCount > 1 ? "s" : ""} rattaché{supplier.productCount > 1 ? "s" : ""}
          </p>
          {removeState.errors.form && (
            <p role="alert" className="text-sm font-semibold text-red-700">
              {removeState.errors.form}
            </p>
          )}
          <button type="submit" disabled={removing} className="h-11 self-start rounded-lg px-3 text-sm text-muted underline disabled:opacity-60">
            Supprimer ce fournisseur
          </button>
        </form>
      )}
    </div>
  );
}
