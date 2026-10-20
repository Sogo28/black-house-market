import type { MetadataRoute } from "next";
import { getCatalogue, getCategories } from "@/infra/catalogue";
import { SITE_URL } from "@/site";

// Plan du site : accueil, catégories et produits publiés. Suit le catalogue (cache `catalogue`).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getCatalogue()]);
  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/livraison` },
    { url: `${SITE_URL}/echanges` },
    { url: `${SITE_URL}/conditions` },
    ...categories.map((c) => ({ url: `${SITE_URL}/categorie/${c.slug}` })),
    ...products.map((p) => ({ url: `${SITE_URL}/produit/${p.slug}` })),
  ];
}
