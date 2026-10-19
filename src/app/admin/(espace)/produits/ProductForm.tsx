"use client";

import { useActionState } from "react";
import { STATUS_OPTIONS, type ProductData, type ProductInput } from "@/domain/products";
import { saveProduct, type ProductFormState } from "./actions";

type Option = { id: string; name: string };

type ProductFormProps = {
  productId?: string;
  initial?: ProductData;
  categories: Option[];
  suppliers: Option[];
};

function toInput(product?: ProductData): ProductInput {
  return {
    name: product?.name ?? "",
    brand: product?.brand ?? "",
    description: product?.description ?? "",
    categoryId: product?.categoryId ?? "",
    supplierId: product?.supplierId ?? "",
    price: product ? String(product.price) : "",
    oldPrice: product?.oldPrice ? String(product.oldPrice) : "",
    status: product?.status ?? "on_order",
    published: product?.published ?? true,
  };
}

export function ProductForm({ productId, initial, categories, suppliers }: ProductFormProps) {
  const [state, formAction, pending] = useActionState<ProductFormState, FormData>(saveProduct, { errors: {}, attempt: 0 });
  const values = state.values ?? toInput(initial);
  const errors = state.errors;

  return (
    <form key={state.attempt} action={formAction} className="flex flex-col gap-4 rounded-xl border border-line bg-white p-4">
      {productId && <input type="hidden" name="productId" value={productId} />}

      <Field label="Nom du produit" htmlFor="name" error={errors.name}>
        <input id="name" name="name" required defaultValue={values.name} className={inputClass} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Catégorie" htmlFor="categoryId" error={errors.category}>
          <select id="categoryId" name="categoryId" required defaultValue={values.categoryId} className={`${inputClass} bg-white`}>
            <option value="" disabled>
              Choisir…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Marque (facultatif)" htmlFor="brand" error={errors.brand}>
          <input id="brand" name="brand" defaultValue={values.brand} className={inputClass} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Prix (FCFA)" htmlFor="price" error={errors.price}>
          <input id="price" name="price" inputMode="numeric" required defaultValue={values.price} placeholder="9900" className={inputClass} />
        </Field>
        <Field label="Ancien prix (FCFA)" htmlFor="oldPrice" error={errors.oldPrice} hint="Barré sur le site, pour montrer la remise.">
          <input id="oldPrice" name="oldPrice" inputMode="numeric" defaultValue={values.oldPrice} placeholder="16500" className={inputClass} />
        </Field>
      </div>

      {productId ? (
        // En modification, la disponibilité se règle dans la section « Disponibilité » de la fiche.
        // On renvoie la valeur actuelle (relue en base à chaque affichage) pour ne pas la modifier ici.
        <input type="hidden" name="status" value={initial?.status ?? values.status} />
      ) : (
        <Field label="Disponibilité" htmlFor="status" error={errors.status}>
          <select id="status" name="status" defaultValue={values.status} className={`${inputClass} bg-white`}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field
        label="Fournisseur"
        htmlFor="supplierId"
        hint="Visible par vous seulement. Sert à demander la disponibilité."
      >
        <select id="supplierId" name="supplierId" defaultValue={values.supplierId} className={`${inputClass} bg-white`}>
          <option value="">Aucun</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Description" htmlFor="description" error={errors.description} hint="Bienfaits, mode d'emploi, composition…">
        <textarea id="description" name="description" rows={4} defaultValue={values.description} className="rounded-lg border border-line px-3 py-2 text-base" />
      </Field>

      <label className="flex min-h-11 cursor-pointer items-center gap-3">
        <input type="checkbox" name="published" defaultChecked={values.published} className="size-5 accent-ink" />
        <span>
          Afficher sur le site
          <span className="block text-sm text-muted">Décochez pour masquer le produit sans le supprimer.</span>
        </span>
      </label>

      {errors.form && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {errors.form}
        </p>
      )}
      {state.saved && (
        <p role="status" className="text-sm font-semibold text-whatsapp">
          Produit enregistré. Le site est à jour.
        </p>
      )}
      <button type="submit" disabled={pending} className="h-13 rounded-lg bg-ink font-semibold text-white disabled:opacity-60">
        {pending ? "Enregistrement…" : productId ? "Enregistrer" : "Créer le produit"}
      </button>
    </form>
  );
}

const inputClass = "h-12 w-full rounded-lg border border-line px-3 text-base";

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold">
        {label}
      </label>
      {children}
      {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : hint && <p className="text-sm text-muted">{hint}</p>}
    </div>
  );
}
