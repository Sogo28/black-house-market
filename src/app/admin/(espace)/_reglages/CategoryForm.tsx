"use client";

import Image from "next/image";
import { useActionState, useState, useTransition } from "react";
import { shrinkImage } from "@/components/admin/shrinkImage";
import { removeCategory, saveCategory, uploadCategoryImage, deleteCategoryImage, type SettingsState } from "./actions";

type CategoryFormProps = {
  /** Absent : formulaire de création (l'image se règle après, depuis la catégorie créée). */
  category?: {
    id: string;
    name: string;
    hint: string | null;
    position: number;
    productCount: number;
    imageUrl: string | null;
  };
  nextPosition?: number;
};

const INITIAL: SettingsState = { errors: {}, attempt: 0 };
const inputClass = "h-12 w-full rounded-lg border border-line px-3 text-base";

export function CategoryForm({ category, nextPosition = 1 }: CategoryFormProps) {
  const [state, formAction, pending] = useActionState(saveCategory, INITIAL);
  const [removeState, removeAction, removing] = useActionState(removeCategory, INITIAL);
  const errors = state.errors;
  const id = category?.id;
  const v = state.values;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-4">
      {category && <CategoryImage id={category.id} name={category.name} imageUrl={category.imageUrl} />}

      <form key={state.attempt} action={formAction} className="flex flex-col gap-3">
        {id && <input type="hidden" name="id" value={id} />}
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Nom
          <input name="name" required defaultValue={v?.name ?? category?.name} placeholder="Ex : Beauté" className={`${inputClass} font-normal`} />
          {errors.name && <span className="font-semibold text-red-700">{errors.name}</span>}
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Texte d&apos;accueil
          <input name="hint" defaultValue={v?.hint ?? category?.hint ?? ""} placeholder="Ex : Soins, parfums, maquillage" className={`${inputClass} font-normal`} />
          {errors.hint && <span className="font-semibold text-red-700">{errors.hint}</span>}
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Place dans la barre (1 = en premier)
          <input
            name="position"
            inputMode="numeric"
            defaultValue={v?.position ?? (category ? category.position : nextPosition)}
            className={`${inputClass} font-normal sm:w-32`}
          />
          {errors.position && <span className="font-semibold text-red-700">{errors.position}</span>}
        </label>
        {errors.form && (
          <p role="alert" className="text-sm font-semibold text-red-700">
            {errors.form}
          </p>
        )}
        {state.saved && (
          <p role="status" className="text-sm font-semibold text-whatsapp">
            Enregistré. Le site est à jour.
          </p>
        )}
        <button type="submit" disabled={pending} className="h-12 rounded-lg bg-ink font-semibold text-white disabled:opacity-60">
          {pending ? "Enregistrement…" : id ? "Enregistrer" : "Ajouter la catégorie"}
        </button>
      </form>

      {id && category && (
        <form action={removeAction} className="flex flex-col gap-1.5 border-t border-line pt-3">
          <input type="hidden" name="id" value={id} />
          <p className="text-sm text-muted">
            {category.productCount} produit{category.productCount > 1 ? "s" : ""} dans cette catégorie
          </p>
          {removeState.errors.form && (
            <p role="alert" className="text-sm font-semibold text-red-700">
              {removeState.errors.form}
            </p>
          )}
          <button type="submit" disabled={removing} className="h-11 self-start rounded-lg px-3 text-sm text-muted underline disabled:opacity-60">
            Supprimer cette catégorie
          </button>
        </form>
      )}
    </div>
  );
}

/** Image d'accueil de la catégorie : réduite dans le navigateur, puis envoyée. */
function CategoryImage({ id, name, imageUrl }: { id: string; name: string; imageUrl: string | null }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputId = `category-image-${id}`;

  function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage(null);
    startTransition(async () => {
      try {
        const body = new FormData();
        body.set("id", id);
        body.set("image", new File([await shrinkImage(file)], "image.jpg", { type: "image/jpeg" }));
        const result = await uploadCategoryImage(body);
        if (result.error) setMessage(result.error);
      } catch {
        setMessage("Cette image n'a pas pu être lue. Essayez-en une autre.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-sand sm:aspect-[21/9]">
        {imageUrl ? (
          <Image src={imageUrl} alt={`Image de la catégorie ${name}`} fill sizes="(min-width: 640px) 560px, 100vw" className="object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-sm text-muted">Pas d&apos;image</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input id={inputId} type="file" accept="image/*" onChange={onChange} disabled={pending} className="sr-only" />
        <label htmlFor={inputId} className={`flex h-11 cursor-pointer items-center rounded-lg border-[1.5px] border-dashed border-ink px-4 text-sm font-semibold ${pending ? "opacity-60" : ""}`}>
          {pending ? "Envoi…" : imageUrl ? "Changer l'image" : "Ajouter une image"}
        </label>
        {imageUrl && (
          <form action={deleteCategoryImage}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" className="h-11 rounded-lg px-3 text-sm text-muted underline">
              Retirer
            </button>
          </form>
        )}
      </div>
      {message && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {message}
        </p>
      )}
    </div>
  );
}
