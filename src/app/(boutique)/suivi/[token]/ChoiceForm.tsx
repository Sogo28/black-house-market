"use client";

import { useActionState } from "react";
import { formatFcfa } from "@/domain/money";
import type { ChoiceState } from "./actions";

type ChoiceFormProps = {
  action: (previous: ChoiceState, formData: FormData) => Promise<ChoiceState>;
  missingNames: string[];
  replacementNames: string[];
  totals: { withReplacement: number | null; without: number };
};

export function ChoiceForm({ action, missingNames, replacementNames, totals }: ChoiceFormProps) {
  const [state, formAction, pending] = useActionState(action, { error: null });

  const options = [
    ...(totals.withReplacement !== null
      ? [
          {
            value: "replace",
            label: "Le remplacer",
            hint: `${replacementNames.join(", ")} · nouveau total ${formatFcfa(totals.withReplacement)}`,
          },
        ]
      : []),
    { value: "remove", label: "Continuer sans", hint: `Nouveau total : ${formatFcfa(totals.without)}` },
    { value: "cancel", label: "Annuler la commande", hint: "Vous n'avez rien à payer." },
  ];

  return (
    <section aria-labelledby="choice-title" className="flex flex-col gap-3 rounded-2xl border border-[#E9D3A4] bg-[#FBF3E2] p-5">
      <h2 id="choice-title" className="text-lg font-semibold">
        {missingNames.length > 1 ? "Des articles ne sont plus disponibles" : "Un article n'est plus disponible"}
      </h2>
      <p className="text-sm">
        {missingNames.map((name) => `« ${name} »`).join(", ")}{" "}
        {missingNames.length > 1 ? "sont épuisés" : "est épuisé"} pour le moment. Que préférez-vous ?
      </p>
      <form action={formAction} className="flex flex-col gap-2">
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Votre choix</legend>
          {options.map((option, index) => (
            <label
              key={option.value}
              className="flex min-h-15 cursor-pointer items-center gap-3 rounded-xl border-2 border-line bg-white px-4 py-2 has-checked:border-ink"
            >
              <input
                type="radio"
                name="choice"
                value={option.value}
                defaultChecked={index === 0}
                className="size-5 shrink-0 accent-ink"
              />
              <span className="flex flex-col">
                <strong className="font-semibold">{option.label}</strong>
                <span className="text-sm text-muted">{option.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {state.error && (
          <p role="alert" className="text-sm font-semibold text-red-800">
            {state.error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-1 h-13 rounded-lg bg-ink font-semibold text-white disabled:bg-line disabled:text-muted"
        >
          {pending ? "Enregistrement…" : "Valider mon choix"}
        </button>
      </form>
      <p className="text-sm text-muted">Sans réponse sous 24 h, nous continuons sans cet article.</p>
    </section>
  );
}
