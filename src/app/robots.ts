import type { MetadataRoute } from "next";
import { SITE_URL } from "@/site";

// Les pages privées (back-office, suivi et remerciement d'une commande, panier) ne doivent
// jamais apparaître dans un moteur de recherche.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/suivi/", "/merci/", "/panier", "/api/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
