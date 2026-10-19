import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Build autonome, pour l'image Docker déployée sur le VPS (voir README, « Mise en ligne »).
  output: "standalone",
  images: {
    // Seules les photos du stockage Supabase du projet passent par l'optimiseur.
    remotePatterns: supabaseUrl ? [new URL(`${supabaseUrl}/storage/v1/object/public/**`)] : [],
    // En local, Supabase répond sur 127.0.0.1, que Next refuse par défaut. Jamais en production.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
  },
  experimental: {
    // Les photos sont réduites dans le navigateur (~300 Ko) ; on garde de la marge.
    serverActions: { bodySizeLimit: "3mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
