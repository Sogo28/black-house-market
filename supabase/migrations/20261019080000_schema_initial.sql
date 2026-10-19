-- Schéma initial de Black House.
--
-- Principes :
-- - Les prix sont des entiers en FCFA (pas de centimes).
-- - Les fournisseurs ne sortent JAMAIS côté client : les visiteurs lisent uniquement
--   la vue `catalogue`, qui ne contient ni le fournisseur ni la date de vérification.
-- - Les commandes sont écrites par le serveur Next avec la clé secrète (qui ignore la RLS).
--   Aucune politique ne permet à un visiteur de lire ou d'écrire une commande.
-- - Le back-office (Babacar) passe par un compte Supabase Auth inscrit dans `admins`.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.product_status as enum ('available', 'on_order', 'sold_out');

create type public.order_status as enum (
  'received',         -- commande envoyée par le client
  'checking',         -- Babacar vérifie la disponibilité chez ses fournisseurs
  'action_required',  -- un article manque : le client doit choisir sur sa page de suivi
  'confirmed',        -- total et frais de livraison envoyés au client
  'shipping',         -- remis au livreur
  'delivered',        -- livré et payé
  'cancelled'
);

create type public.item_check as enum ('pending', 'available', 'unavailable');

create type public.customer_choice as enum ('replace', 'remove', 'cancel');

create type public.payment_method as enum ('cash', 'wave', 'orange_money');

-- ---------------------------------------------------------------------------
-- Outils
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Administrateurs
-- ---------------------------------------------------------------------------

create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Security definer : lit `admins` sans passer par sa propre RLS.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = (select auth.uid()));
$$;

-- ---------------------------------------------------------------------------
-- Catalogue
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  hint text,
  position integer not null default 0
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text,
  notes text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  brand text,
  description text,
  category_id uuid not null references public.categories (id),
  supplier_id uuid references public.suppliers (id) on delete set null,
  price integer not null check (price > 0),
  old_price integer check (old_price is null or old_price > price),
  images text[] not null default '{}',
  -- Statut saisi par Babacar. Le statut affiché aux clients est calculé par la vue `catalogue`.
  status public.product_status not null default 'on_order',
  last_checked_at timestamptz,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on public.products (category_id);
create index products_supplier_id_idx on public.products (supplier_id);

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- Vue lue par les visiteurs. Elle s'exécute avec les droits de son propriétaire (pas de
-- security_invoker) : c'est voulu, elle expose une sélection de colonnes de `products`
-- sans ouvrir la table elle-même.
--
-- Péremption : un produit « disponible » qui n'a pas été revérifié depuis 3 jours
-- s'affiche « sur commande ». Le même seuil existe côté code dans
-- src/domain/availability.ts (STALE_AFTER_DAYS) : changer les deux ensemble.
create view public.catalogue as
select
  p.id,
  p.slug,
  p.name,
  p.brand,
  p.description,
  p.price,
  p.old_price,
  p.images,
  c.slug as category_slug,
  c.name as category_name,
  case
    when p.status = 'available'
      and (p.last_checked_at is null or p.last_checked_at < now() - interval '3 days')
      then 'on_order'::public.product_status
    else p.status
  end as status,
  p.created_at
from public.products p
join public.categories c on c.id = p.category_id
where p.is_published;

-- ---------------------------------------------------------------------------
-- Commandes
-- ---------------------------------------------------------------------------

create sequence public.order_number_seq start with 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  -- Numéro lisible, donné au client et à Babacar.
  code text not null unique default ('BH-' || nextval('public.order_number_seq')),
  -- Jeton de la page de suivi : impossible à deviner, contrairement au numéro.
  tracking_token text not null unique default encode(extensions.gen_random_bytes(18), 'hex'),
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  -- 9 chiffres sans l'indicatif, ex. 771234567.
  customer_phone text not null check (customer_phone ~ '^7[0-9]{8}$'),
  commune text not null,
  address_details text not null,
  payment_method public.payment_method not null default 'cash',
  status public.order_status not null default 'received',
  delivery_fee integer check (delivery_fee is null or delivery_fee >= 0),
  confirm_before timestamptz not null default (now() + interval '2 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_status_idx on public.orders (status);

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  -- Nom et prix copiés au moment de la commande : ils ne bougent plus ensuite.
  product_name text not null,
  unit_price integer not null check (unit_price > 0),
  quantity integer not null check (quantity between 1 and 20),
  check_status public.item_check not null default 'pending',
  replacement_product_id uuid references public.products (id) on delete set null,
  customer_choice public.customer_choice,
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);
create index order_items_replacement_product_id_idx on public.order_items (replacement_product_id);

-- Historique affiché dans le back-office.
create table public.order_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create index order_events_order_id_idx on public.order_events (order_id);

-- « Me prévenir du retour » sur un produit épuisé.
create table public.stock_alerts (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  phone text not null check (phone ~ '^7[0-9]{8}$'),
  created_at timestamptz not null default now(),
  notified_at timestamptz,
  unique (product_id, phone)
);

-- ---------------------------------------------------------------------------
-- Sécurité (RLS)
-- ---------------------------------------------------------------------------

alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_events enable row level security;
alter table public.stock_alerts enable row level security;

create policy "Les admins voient la liste des admins"
on public.admins for select to authenticated
using ((select public.is_admin()));

create policy "Tout le monde voit les catégories"
on public.categories for select to anon, authenticated
using (true);

create policy "Les admins gèrent les catégories"
on public.categories for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Les admins gèrent les fournisseurs"
on public.suppliers for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Les admins gèrent les produits"
on public.products for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Les admins gèrent les commandes"
on public.orders for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Les admins gèrent les articles des commandes"
on public.order_items for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Les admins gèrent l'historique des commandes"
on public.order_events for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Les admins gèrent les alertes de retour en stock"
on public.stock_alerts for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

revoke all on public.catalogue from anon, authenticated;
grant select on public.catalogue to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Photos des produits
-- ---------------------------------------------------------------------------

-- Seau public : les photos se lisent par leur URL, seuls les admins en déposent.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Les admins déposent des photos produits"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images' and (select public.is_admin()));

create policy "Les admins modifient les photos produits"
on storage.objects for update to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()));

create policy "Les admins suppriment des photos produits"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()));
