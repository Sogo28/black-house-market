# black-house

Boutique en ligne **Black House · Private room** (Babacar, Dakar) : grandes marques à prix cassés,
commande sans compte, paiement à la réception, confirmation sur WhatsApp. Clients surtout sur
mobile, souvent en 4G : pages légères, photos optimisées.

Maquette de référence (parcours mobile, version web, flux de commande, back-office) :
canvas « Black House – Maquette e-commerce », https://claude.ai/artifact/YHdEudBVEtyzCkhwJutLaz

## Règles métier à ne jamais casser

- **Babacar est revendeur, le client ne doit jamais le savoir.** Aucun texte côté client ne parle
  de grossiste, de fournisseur ou d'un service de livraison nommé : on dit « vérification »,
  « préparation », « livraison à domicile ». Les fournisseurs n'existent que dans le back-office.
- **Pas de stock.** Un produit n'est « disponible » que si Babacar l'a vérifié depuis moins de
  3 jours ; au-delà, il s'affiche « sur commande ». La règle existe deux fois : vue SQL `catalogue`
  et `src/domain/availability.ts` (`STALE_AFTER_DAYS`). Les changer ensemble.
- **Une commande est une demande.** Rien ne se paie en ligne. Babacar vérifie chaque article, puis
  envoie le total et les frais de livraison sur WhatsApp ; le client répond « OK ». Si un article
  manque, le client choisit (remplacer, retirer, annuler) sur sa page de suivi, ouverte par un
  jeton aléatoire — jamais par le numéro BH-xxxx, qui se devine.
- Prix en **FCFA, entiers**. Téléphones : 9 chiffres commençant par 7, stockés sans `+221`.
- Textes de l'interface **en français**.

## Structure

- `src/app/` — routes Next (App Router).
- `src/domain/` — règles métier pures (montants, téléphones, disponibilité). N'importe ni React,
  ni Next, ni Supabase : testable avec Vitest, tests à côté du fichier (`*.test.ts`).
- `src/infra/` — accès aux données. `supabase/public.ts` : client sans session (clé publique,
  soumis à la RLS). `catalogue.ts` : lectures mises en cache. `supabase/database.types.ts` est
  généré par `npm run db:types`, ne pas l'éditer.
- `src/components/` — composants d'interface.
- `supabase/migrations/` — schéma, une migration par changement (ne jamais modifier une migration
  déjà appliquée en ligne). `supabase/seed.sql` — données de test.

## Sécurité des données

- Les visiteurs lisent la vue `catalogue` et les catégories, rien d'autre (RLS).
- Les commandes sont écrites côté serveur avec `SUPABASE_SECRET_KEY`, qui ignore la RLS : ce
  client ne vit que dans des modules `import "server-only"`.
- Le back-office passe par un compte Supabase inscrit dans la table `admins` (`is_admin()`).
  Les inscriptions publiques sont désactivées.

## Next.js 16

- `cacheComponents` est actif : une lecture non mise en cache va sous `<Suspense>`. Les lectures
  du catalogue utilisent `"use cache"` + `cacheLife` + `cacheTag("catalogue")` ; le back-office
  invalidera ce tag après une modification.
- `output: "standalone"` : le build produit `.next/standalone/server.js`, destiné à l'image Docker
  du VPS.

## Commandes

- `npm run dev` — site en local (http://localhost:3000).
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` — à faire passer avant de livrer.
- `npm run db:start` / `db:reset` / `db:types` — Supabase local (Docker), réinitialisation avec
  les données de test, régénération des types.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
