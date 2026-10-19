# Black House · Private room

Boutique en ligne de Black House : les grandes marques à prix cassés, livrées à domicile à Dakar.
Le client commande sans créer de compte et paie à la réception ; la commande est confirmée sur
WhatsApp après vérification de chaque article.

Stack : **Next.js 16** (TypeScript, Tailwind CSS 4), **Supabase** (Postgres, Auth, Storage),
**Vitest**. Maquette :
[Black House – Maquette e-commerce](https://claude.ai/artifact/YHdEudBVEtyzCkhwJutLaz).

## Démarrer en local

Prérequis : Node 24 et Docker Desktop (lancé).

```bash
npm install
npm run db:start
```

Le premier `db:start` télécharge les images Docker de Supabase (plusieurs minutes). Il affiche
ensuite l'URL de l'API et les clés.

1. Copier `.env.example` en `.env.local` et y coller `Project URL`, la clé **Publishable** et la
   clé **Secret** affichées (on peut les revoir avec `npx supabase status`), ainsi que le numéro WhatsApp de la boutique.
2. Charger le schéma et les données de test :

   ```bash
   npm run db:reset
   ```

3. Lancer le site :

   ```bash
   npm run dev
   ```

   - Site : http://localhost:3000
   - Supabase Studio (tables, comptes, photos) : http://127.0.0.1:54323

## Créer le compte de Babacar

Les inscriptions sont fermées : le compte du back-office se crée à la main.

1. Studio > **Authentication** > **Add user** : e-mail et mot de passe.
2. Studio > **SQL Editor** :

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'adresse@exemple.com';
   ```

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Site en local |
| `npm test` | Tests des règles métier (`src/domain`) |
| `npm run lint` / `npm run typecheck` | Qualité du code |
| `npm run build` | Build de production (`.next/standalone`) |
| `npm run db:start` / `npm run db:stop` | Démarrer / arrêter Supabase en local |
| `npm run db:reset` | Recréer la base locale : migrations + données de test |
| `npm run db:types` | Régénérer `src/infra/supabase/database.types.ts` après une migration |

## Base de données

Schéma : `supabase/migrations/`. Données de test : `supabase/seed.sql`.

| Table | Contenu | Qui la lit |
|---|---|---|
| `categories` | Beauté, Musculation, High-tech, Café… | Tout le monde |
| `products` | Prix, ancien prix, photos, statut saisi, date de dernière vérification, fournisseur | Admin |
| `catalogue` (vue) | Produits publiés **sans fournisseur**, statut affiché au client | Tout le monde |
| `suppliers` | Fournisseurs et leur WhatsApp | Admin |
| `orders` | Commandes : numéro BH-xxxx, jeton de suivi, coordonnées, statut, frais de livraison | Admin, serveur |
| `order_items` | Articles, prix figé, vérification (en attente / dispo / indispo), choix du client | Admin, serveur |
| `order_events` | Historique d'une commande | Admin, serveur |
| `stock_alerts` | « Me prévenir du retour » | Admin, serveur |
| `admins` | Comptes autorisés au back-office | Admin |

Disponibilité : un produit « disponible » non revérifié depuis 3 jours s'affiche automatiquement
« sur commande » (calcul dans la vue, pas de tâche planifiée).

Photos : seau public `product-images` (lecture par URL, dépôt réservé aux admins).

## Feuille de route

1. ✅ Mise en place : projet, schéma, sécurité, données de test
2. ✅ Catalogue, catégories, recherche et fiche produit (mobile, tablette, ordinateur)
3. ✅ Panier, envoi de la commande, confirmation
4. ✅ Page de suivi et choix du client si un article manque (test : `/suivi/acacacacacacacacacacacacacacacacacac` après `npm run db:reset`)
5. Back-office : commandes, vérification, messages WhatsApp
6. Back-office : produits et stock, photos, notifications
7. Mise en ligne, tests sur téléphones, saisie du catalogue

## Mise en ligne (prévue à l'étape 7)

- **Supabase** en ligne, région Francfort : `npx supabase link`, puis `npx supabase db push`.
  L'offre gratuite ne sauvegarde pas la base : prévoir un `pg_dump` chaque nuit depuis le VPS.
- **VPS Contabo** avec **Coolify** : déploiement à chaque `git push`, HTTPS automatique. Le site
  tourne depuis `.next/standalone` (image Docker).
- **Cloudflare** devant le VPS : DNS, cache des photos et des fichiers statiques, protection.
