import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ChevronLeftIcon, WhatsAppIcon } from "@/components/icons";
import { backInStockNotice, checkedLabel, MAX_IMAGES, needsRecheck, STATUS_OPTIONS } from "@/domain/products";
import { formatSenegalMobile, whatsappLink } from "@/domain/phone";
import { requireAdmin } from "@/infra/auth";
import { getAdminProduct, listCategoryOptions, listPendingAlerts, listSupplierOptions } from "@/infra/adminProducts";
import { productImageUrl } from "@/infra/catalogue";
import { changeStatus, deleteImage, makeMainImageAction, notifyAlertsDone } from "../actions";
import { ProductForm } from "../ProductForm";
import { StatusSubmit } from "../StatusSubmit";
import { PhotoUploader } from "./PhotoUploader";

const STATUS_COLOR = { available: "bg-whatsapp border-whatsapp", on_order: "bg-amber border-amber", sold_out: "bg-muted border-muted" };
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function EditProductPage(props: PageProps<"/admin/produits/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted">Chargement…</p>}>
      <EditProduct {...props} />
    </Suspense>
  );
}

async function EditProduct({ params, searchParams }: PageProps<"/admin/produits/[id]">) {
  await connection();
  const { supabase } = await requireAdmin();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const product = await getAdminProduct(supabase, id);

  if (!product) {
    return (
      <>
        <h1 className="text-2xl font-semibold">Produit introuvable</h1>
        <Link href="/admin/produits" className="mt-3 inline-block underline">
          Retour aux produits
        </Link>
      </>
    );
  }

  const [categories, suppliers, alerts] = await Promise.all([
    listCategoryOptions(supabase),
    listSupplierOptions(supabase),
    product.status === "sold_out" ? Promise.resolve([]) : listPendingAlerts(supabase, product.id),
  ]);
  const productUrl = `${SITE_URL}/produit/${product.slug}`;
  const now = new Date();
  const recheck = needsRecheck(product.status, product.lastCheckedAt ? new Date(product.lastCheckedAt) : null, now);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2">
        <Link href="/admin/produits" aria-label="Retour aux produits" className="-ml-2 flex size-11 items-center justify-center">
          <ChevronLeftIcon />
        </Link>
        <h1 className="flex-1 text-2xl font-semibold leading-tight">{product.name}</h1>
      </div>

      {query.nouveau === "1" && (
        <p role="status" className="rounded-lg bg-[#E7F3EA] px-4 py-3 text-sm font-semibold">
          Produit créé. Ajoutez maintenant ses photos ci-dessous.
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2 lg:items-start lg:gap-6">
        <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4">
        <h2 className="text-lg font-semibold">Disponibilité</h2>
        <div role="group" aria-label={`Disponibilité : ${product.name}`} className="grid grid-cols-3 gap-2">
          {STATUS_OPTIONS.map((option) => {
            const active = option.value === product.status;
            return (
              <form key={option.value} action={changeStatus}>
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="status" value={option.value} />
                <StatusSubmit
                  pressed={active}
                  className={`h-12 w-full rounded-lg border text-sm font-semibold ${
                    active ? `${STATUS_COLOR[option.value]} text-white` : "border-line bg-white"
                  }`}
                >
                  {option.label}
                </StatusSubmit>
              </form>
            );
          })}
        </div>
        <p className={`text-sm ${recheck ? "font-semibold text-amber" : "text-muted"}`}>
          {checkedLabel(product.lastCheckedAt ? new Date(product.lastCheckedAt) : null, now)}
          {recheck && " · affiché « Sur commande » sur le site tant que vous ne l'avez pas revérifié"}
        </p>
        <p className="text-xs text-muted">Appuyer sur le statut actuel confirme qu&apos;il est toujours valable.</p>
      </section>

      {alerts.length > 0 && (
        <section className="flex flex-col gap-3 rounded-xl border border-[#E9D3A4] bg-[#FBF3E2] p-4">
          <h2 className="font-semibold">
            {alerts.length} client{alerts.length > 1 ? "s attendent" : " attend"} le retour de ce produit
          </h2>
          <ul className="flex flex-col gap-2">
            {alerts.map((alert) => (
              <li key={alert.id} className="flex items-center justify-between gap-3">
                <span>+221 {formatSenegalMobile(alert.phone)}</span>
                <a
                  href={whatsappLink(alert.phone, backInStockNotice(product.name, product.price, productUrl))}
                  className="flex h-11 items-center gap-1.5 rounded-lg border-[1.5px] border-whatsapp bg-white px-3 text-sm font-semibold text-whatsapp"
                >
                  <WhatsAppIcon className="size-5" />
                  Prévenir
                </a>
              </li>
            ))}
          </ul>
          <form action={notifyAlertsDone}>
            <input type="hidden" name="productId" value={product.id} />
            <StatusSubmit className="h-11 w-full rounded-lg bg-ink text-sm font-semibold text-white">
              Tous prévenus : fermer les alertes
            </StatusSubmit>
          </form>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-xl border border-line bg-white p-4">
        <h2 className="flex items-baseline justify-between text-lg font-semibold">
          Photos
          <span className="text-sm font-semibold text-muted">
            {product.images.length} / {MAX_IMAGES}
          </span>
        </h2>
        {product.images.length > 0 && (
          <ul className="grid grid-cols-3 gap-3">
            {product.images.map((path, index) => (
              <li key={path} className="flex flex-col gap-1.5">
                <div className="relative aspect-square overflow-hidden rounded-lg bg-sand">
                  <Image src={productImageUrl(path)} alt={`Photo ${index + 1} de ${product.name}`} fill sizes="120px" className="object-cover" />
                  {index === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-ink px-1.5 py-0.5 text-xs font-bold text-white">Principale</span>
                  )}
                </div>
                {index > 0 && (
                  <form action={makeMainImageAction}>
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="path" value={path} />
                    <StatusSubmit className="h-11 w-full rounded-lg border border-line text-xs font-semibold">Principale</StatusSubmit>
                  </form>
                )}
                <form action={deleteImage}>
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="path" value={path} />
                  <StatusSubmit className="h-11 w-full rounded-lg text-xs text-muted underline">Retirer</StatusSubmit>
                </form>
              </li>
            ))}
          </ul>
        )}
        <PhotoUploader productId={product.id} remaining={MAX_IMAGES - product.images.length} />
        <p className="text-sm text-muted">Fond clair, produit bien visible. La première photo est celle des listes.</p>
      </section>

        </div>
        <div className="flex flex-col gap-5">
      <ProductForm productId={product.id} initial={product} categories={categories} suppliers={suppliers} />

      <p className="text-center text-sm">
        <Link href={`/produit/${product.slug}`} className="underline">
          Voir la page du produit sur le site
        </Link>
      </p>
        </div>
      </div>
    </div>
  );
}
