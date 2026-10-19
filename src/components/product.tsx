// Éléments communs aux cartes et à la fiche produit.

import Image from "next/image";
import Link from "next/link";
import { AVAILABILITY_COPY, canBeOrdered, type ProductStatus } from "@/domain/availability";
import { discountPercent, formatFcfa } from "@/domain/money";
import { productImageUrl, type CatalogueProduct } from "@/infra/catalogue";
import { AddToCartButton } from "./cart/AddToCartButton";

const STATUS_COLOR: Record<ProductStatus, { text: string; dot: string }> = {
  available: { text: "text-whatsapp", dot: "bg-whatsapp" },
  on_order: { text: "text-amber", dot: "bg-amber" },
  sold_out: { text: "text-muted", dot: "bg-muted" },
};

/** Photo principale, ou un encart neutre tant que Babacar n'en a pas déposé. */
export function ProductImage({ product, sizes, index = 0 }: { product: CatalogueProduct; sizes: string; index?: number }) {
  const path = product.images[index];
  if (!path) {
    return <span className="flex size-full items-center justify-center text-sm text-muted">Photo à venir</span>;
  }
  return <Image src={productImageUrl(path)} alt={product.name} fill sizes={sizes} className="object-cover" />;
}

export function DiscountBadge({ price, oldPrice, className = "" }: { price: number; oldPrice: number | null; className?: string }) {
  const discount = discountPercent(price, oldPrice);
  if (discount === null) return null;
  return (
    <span className={`absolute left-3 top-3 rounded-md bg-ink px-2 py-1 text-xs font-bold text-white ${className}`}>
      -{discount}&nbsp;%
    </span>
  );
}

export function PriceTag({ price, oldPrice, size = "md" }: { price: number; oldPrice: number | null; size?: "md" | "lg" }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className={`whitespace-nowrap font-bold ${size === "lg" ? "text-3xl" : "text-lg"}`}>{formatFcfa(price)}</span>
      {oldPrice !== null && (
        <span className={`whitespace-nowrap text-muted line-through ${size === "lg" ? "text-base" : "text-sm"}`}>
          <span className="sr-only">au lieu de </span>
          {formatFcfa(oldPrice)}
        </span>
      )}
    </p>
  );
}

export function AvailabilityLine({ status }: { status: ProductStatus }) {
  const color = STATUS_COLOR[status];
  return (
    <span className={`flex items-center gap-1.5 text-sm font-semibold ${color.text}`}>
      <span className={`size-2 rounded-full ${color.dot}`} aria-hidden="true" />
      {AVAILABILITY_COPY[status].label}
    </span>
  );
}

export function AvailabilityBox({ status }: { status: ProductStatus }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-line px-4 py-3">
      <AvailabilityLine status={status} />
      <span className="text-sm text-muted">{AVAILABILITY_COPY[status].hint}</span>
    </div>
  );
}

export function ProductCard({ product }: { product: CatalogueProduct }) {
  const href = `/produit/${product.slug}`;
  return (
    <article className="flex flex-col gap-2">
      <Link href={href} className="relative block aspect-square overflow-hidden rounded-2xl bg-sand" tabIndex={-1}>
        <ProductImage product={product} sizes="(min-width: 1024px) 270px, (min-width: 640px) 33vw, 50vw" />
        <DiscountBadge price={product.price} oldPrice={product.oldPrice} />
      </Link>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted">{product.categoryName}</span>
      <Link href={href} className="min-h-14 font-medium leading-snug hover:underline">
        {product.name}
      </Link>
      <PriceTag price={product.price} oldPrice={product.oldPrice} />
      <AvailabilityLine status={product.status} />
      {canBeOrdered(product.status) && <AddToCartButton slug={product.slug} />}
    </article>
  );
}

export function ProductGrid({ products }: { products: CatalogueProduct[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4">
      {products.map((product) => (
        <li key={product.id}>
          <ProductCard product={product} />
        </li>
      ))}
    </ul>
  );
}
