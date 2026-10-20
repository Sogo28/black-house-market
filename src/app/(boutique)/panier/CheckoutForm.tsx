"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { cart, useCart, useCartReady } from "@/components/cart/cartStore";
import { CartPageSkeleton } from "@/components/skeletons";
import { CheckCircleIcon, ClockIcon, MinusIcon, PlusIcon } from "@/components/icons";
import { AVAILABILITY_COPY, canBeOrdered, type ProductStatus } from "@/domain/availability";
import { formatFcfa } from "@/domain/money";
import { COMMUNES, MAX_QUANTITY, PAYMENT_METHODS } from "@/domain/order";
import { placeOrder, type CheckoutState } from "./actions";

export type CartProduct = {
  slug: string;
  name: string;
  price: number;
  status: ProductStatus;
  imageUrl: string | null;
};

const STATUS_TEXT: Record<ProductStatus, string> = {
  available: "text-whatsapp",
  on_order: "text-amber",
  sold_out: "text-muted",
};

const INITIAL_STATE: CheckoutState = { errors: {}, attempt: 0 };

export function CheckoutForm({ products }: { products: CartProduct[] }) {
  const lines = useCart();
  const ready = useCartReady();
  const [state, formAction, pending] = useActionState(placeOrder, INITIAL_STATE);

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const items = lines.map((line) => ({ line, product: bySlug.get(line.slug) ?? null }));
  const orderable = items.filter(
    (i): i is { line: typeof i.line; product: CartProduct } => i.product !== null && canBeOrdered(i.product.status),
  );
  const blocked = items.length - orderable.length; // retirés de la vente ou épuisés
  const count = orderable.reduce((sum, i) => sum + i.line.quantity, 0);
  const subtotal = orderable.reduce((sum, i) => sum + i.product.price * i.line.quantity, 0);

  // Le panier vit dans le navigateur : avant l'hydratation il paraît vide, d'où le squelette (sinon « panier vide » clignote).
  if (!ready) return <CartPageSkeleton />;

  if (items.length === 0) {
    return (
      <div className="py-10">
        <h1 className="text-3xl font-semibold">Votre panier est vide</h1>
        <p className="mt-2 text-muted">Ajoutez des articles depuis le catalogue, ils vous attendront ici.</p>
        <Link href="/" className="mt-6 inline-flex h-12 items-center rounded-lg bg-ink px-6 font-semibold text-white">
          Voir les offres
        </Link>
      </div>
    );
  }

  const errors = state.errors;
  const values = state.values;

  return (
    <form key={state.attempt} action={formAction} className="flex flex-wrap items-start gap-x-10 gap-y-8">
      <div className="flex flex-[1.4_1_340px] flex-col gap-8">
        <p className="flex items-center gap-2 rounded-lg bg-sand px-4 py-3 text-sm font-semibold">
          <CheckCircleIcon className="size-5 shrink-0 text-whatsapp" />
          Aucun compte à créer. Vous ne payez qu&apos;à la réception.
        </p>

        <section aria-labelledby="cart-title">
          <h1 id="cart-title" className="text-2xl font-semibold">
            Votre panier ({count})
          </h1>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {items.map(({ line, product }) => (
              <li key={line.slug} className="flex gap-3 py-4">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-sand">
                  {product?.imageUrl && <Image src={product.imageUrl} alt="" fill sizes="80px" className="object-cover" />}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  {product ? (
                    <>
                      <Link href={`/produit/${product.slug}`} className="font-medium leading-snug hover:underline">
                        {product.name}
                      </Link>
                      <span className={`text-xs font-semibold ${STATUS_TEXT[product.status]}`}>
                        {product.status === "sold_out"
                          ? "Épuisé : retirez-le pour continuer"
                          : AVAILABILITY_COPY[product.status].label}
                      </span>
                      <span className="font-bold">{formatFcfa(product.price * line.quantity)}</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted">Cet article n&apos;est plus en vente.</span>
                  )}
                  <div className="mt-1 flex items-center justify-between gap-3">
                    {product && canBeOrdered(product.status) ? (
                      <div className="flex items-center rounded-lg border border-line">
                        <button
                          type="button"
                          aria-label={`Retirer un ${product.name}`}
                          onClick={() => cart.setQuantity(line.slug, line.quantity - 1)}
                          disabled={line.quantity === 1}
                          className="flex size-11 items-center justify-center disabled:text-line"
                        >
                          <MinusIcon className="size-4" />
                        </button>
                        <span className="min-w-6 text-center font-bold">{line.quantity}</span>
                        <button
                          type="button"
                          aria-label={`Ajouter un ${product.name}`}
                          onClick={() => cart.setQuantity(line.slug, line.quantity + 1)}
                          disabled={line.quantity === MAX_QUANTITY}
                          className="flex size-11 items-center justify-center disabled:text-line"
                        >
                          <PlusIcon className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => cart.remove(line.slug)}
                      className="h-11 px-1 text-sm text-muted underline"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-4 text-2xl font-semibold">Vos coordonnées</legend>
          <Field label="Prénom et nom" error={errors.name} htmlFor="name">
            <input
              id="name"
              name="name"
              autoComplete="name"
              required
              defaultValue={values?.name}
              placeholder="Ex : Awa Ndiaye"
              aria-invalid={!!errors.name}
              className="h-12 rounded-lg border border-line px-3 text-base"
            />
          </Field>
          <Field
            label="Numéro WhatsApp"
            error={errors.phone}
            htmlFor="phone"
            hint="Nous vous écrivons sur ce numéro pour confirmer la commande."
          >
            <div className="flex h-12 overflow-hidden rounded-lg border border-line">
              <span className="flex items-center border-r border-line bg-sand px-3 font-semibold">+221</span>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                required
                defaultValue={values?.phone}
                placeholder="77 123 45 67"
                aria-invalid={!!errors.phone}
                className="min-w-0 flex-1 px-3 text-base outline-none"
              />
            </div>
          </Field>
          <Field label="Commune ou quartier" error={errors.commune} htmlFor="commune">
            <select
              id="commune"
              name="commune"
              required
              defaultValue={values?.commune ?? ""}
              aria-invalid={!!errors.commune}
              className="h-12 rounded-lg border border-line bg-white px-3 text-base"
            >
              <option value="" disabled>
                Choisir…
              </option>
              {COMMUNES.map((commune) => (
                <option key={commune}>{commune}</option>
              ))}
            </select>
          </Field>
          <Field label="Adresse et point de repère" error={errors.address} htmlFor="address">
            <textarea
              id="address"
              name="address"
              rows={3}
              required
              defaultValue={values?.address}
              placeholder="Ex : rue 10, maison verte, en face de la pharmacie"
              aria-invalid={!!errors.address}
              className="rounded-lg border border-line px-3 py-2 text-base"
            />
          </Field>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-4 text-2xl font-semibold">Paiement à la réception</legend>
          {PAYMENT_METHODS.map((method) => (
            <label
              key={method.id}
              className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border-2 border-line px-4 py-2 has-checked:border-ink"
            >
              <input
                type="radio"
                name="payment"
                value={method.id}
                defaultChecked={(values?.payment ?? "cash") === method.id}
                className="size-5 accent-ink"
              />
              <span className="flex flex-col">
                <strong className="font-semibold">{method.label}</strong>
                <span className="text-sm text-muted">{method.hint}</span>
              </span>
            </label>
          ))}
          {errors.payment && <p className="text-sm font-semibold text-red-700">{errors.payment}</p>}
        </fieldset>
      </div>

      <aside className="flex w-full flex-[1_1_300px] flex-col gap-4 md:sticky md:top-4">
        <section aria-label="Récapitulatif" className="flex flex-col gap-3 rounded-xl bg-sand p-5">
          <p className="flex justify-between">
            <span>Articles ({count})</span>
            <span className="whitespace-nowrap">{formatFcfa(subtotal)}</span>
          </p>
          <p className="flex justify-between">
            <span>Livraison</span>
            <span className="text-muted">Payée au livreur</span>
          </p>
          <hr className="border-line" />
          <p className="flex justify-between text-lg font-bold">
            <span>À payer à la réception</span>
            <span className="whitespace-nowrap">{formatFcfa(subtotal)}</span>
          </p>
          <p className="text-sm text-muted">+ frais de livraison, annoncés lors de la confirmation.</p>
        </section>

        <p className="flex gap-2 rounded-lg bg-[#FBF3E2] px-4 py-3 text-sm">
          <ClockIcon className="mt-0.5 size-5 shrink-0 text-amber" />
          Nous vérifions chaque article, puis nous vous confirmons la commande sur WhatsApp sous 2 h (de 9 h à 21 h).
        </p>

        {(errors.form || errors.cart || blocked > 0) && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
            {errors.form ?? errors.cart ?? "Retirez les articles épuisés ou retirés de la vente pour continuer."}
          </p>
        )}

        {/* Seuls les articles commandables partent ; le serveur relit tout en base. */}
        <input
          type="hidden"
          name="cart"
          value={JSON.stringify(orderable.map((i) => ({ slug: i.line.slug, quantity: i.line.quantity })))}
        />
        <div aria-hidden="true" className="absolute -left-[9999px]">
          <label>
            Ne pas remplir
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <button
          type="submit"
          disabled={pending || blocked > 0 || orderable.length === 0}
          className="h-14 rounded-lg bg-ink text-lg font-semibold text-white disabled:bg-line disabled:text-muted"
        >
          {pending ? "Envoi en cours…" : "Envoyer ma commande"}
        </button>
        <p className="text-center text-sm text-muted">
          Aucun paiement n&apos;est demandé maintenant. En envoyant votre commande, vous acceptez nos{" "}
          <Link href="/conditions" className="underline">
            conditions de vente
          </Link>
          .
        </p>
      </aside>
    </form>
  );
}

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
      {error ? (
        <p className="text-sm font-semibold text-red-700">{error}</p>
      ) : (
        hint && <p className="text-sm text-muted">{hint}</p>
      )}
    </div>
  );
}
