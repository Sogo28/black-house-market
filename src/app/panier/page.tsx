import type { Metadata } from "next";
import { getCatalogue, productImageUrl } from "@/infra/catalogue";
import { CheckoutForm, type CartProduct } from "./CheckoutForm";

export const metadata: Metadata = { title: "Votre panier · Black House" };

export default async function CartPage() {
  // Le catalogue est petit et déjà en cache : on le transmet en entier au panier,
  // qui ne connaît que des slugs. Les prix seront relus en base à l'envoi.
  const products: CartProduct[] = (await getCatalogue()).map((p) => ({
    slug: p.slug,
    name: p.name,
    price: p.price,
    status: p.status,
    imageUrl: p.images[0] ? productImageUrl(p.images[0]) : null,
  }));

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 md:px-8">
      <CheckoutForm products={products} />
    </main>
  );
}
