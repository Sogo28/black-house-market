-- Données de test, chargées par `npm run db:reset`.
-- Les produits et prix reprennent ceux de la maquette. Les dates de vérification sont
-- relatives à maintenant pour montrer la péremption à 3 jours.

insert into public.categories (slug, name, hint, position) values
  ('beaute', 'Beauté', 'Soins, parfums, maquillage', 1),
  ('musculation', 'Musculation', 'Protéines, accessoires', 2),
  ('high-tech', 'High-tech', 'Audio, montres, accessoires', 3),
  ('cafe', 'Café', 'Grains, moulu, capsules', 4);

insert into public.suppliers (name, whatsapp, notes) values
  ('Fournisseur 1 · Beauté', '770000001', 'Fournisseur de test'),
  ('Fournisseur 2 · Sport', '770000002', 'Fournisseur de test'),
  ('Fournisseur 3 · High-tech', '770000003', 'Fournisseur de test'),
  ('Fournisseur 4 · Café', '770000004', 'Fournisseur de test');

insert into public.products (slug, name, category_id, supplier_id, price, old_price, status, last_checked_at)
select
  v.slug,
  v.name,
  c.id,
  s.id,
  v.price,
  v.old_price,
  v.status::public.product_status,
  now() - make_interval(days => v.checked_days_ago)
from (values
  ('serum-vitamine-c-30ml', 'Sérum éclat vitamine C – 30 ml', 'beaute', 'Fournisseur 1 · Beauté', 9900, 16500, 'available', 0),
  ('creme-hydratante-visage-50ml', 'Crème hydratante visage – 50 ml', 'beaute', 'Fournisseur 1 · Beauté', 7500, 12000, 'available', 5),
  ('eau-de-parfum-100ml', 'Eau de parfum – 100 ml', 'beaute', 'Fournisseur 1 · Beauté', 24000, 39000, 'on_order', 2),
  ('huile-capillaire-100ml', 'Huile capillaire nourrissante – 100 ml', 'beaute', 'Fournisseur 1 · Beauté', 5500, 8500, 'available', 7),
  ('palette-fards-12-teintes', 'Palette fards à paupières – 12 teintes', 'beaute', 'Fournisseur 1 · Beauté', 8000, 13500, 'sold_out', 1),
  ('ecran-solaire-spf50-50ml', 'Écran solaire SPF 50 – 50 ml', 'beaute', 'Fournisseur 1 · Beauté', 6500, 10000, 'available', 4),
  ('whey-isolat-2kg', 'Whey protéine isolat – 2 kg', 'musculation', 'Fournisseur 2 · Sport', 32000, 48000, 'on_order', 6),
  ('whey-proteine-2kg', 'Whey protéine – 2 kg', 'musculation', 'Fournisseur 2 · Sport', 30000, 45000, 'available', 0),
  ('kit-bandes-resistance', 'Kit bandes de résistance – 5 niveaux', 'musculation', 'Fournisseur 2 · Sport', 7000, 12000, 'available', 1),
  ('ecouteurs-reduction-bruit', 'Écouteurs sans fil à réduction de bruit', 'high-tech', 'Fournisseur 3 · High-tech', 18500, 29900, 'available', 4),
  ('montre-connectee-sport', 'Montre connectée sport', 'high-tech', 'Fournisseur 3 · High-tech', 22000, 35000, 'available', 0),
  ('cafe-grains-arabica-1kg', 'Café en grains arabica – 1 kg', 'cafe', 'Fournisseur 4 · Café', 11000, 15000, 'available', 0),
  ('capsules-espresso-x50', 'Capsules espresso intenso – x50', 'cafe', 'Fournisseur 4 · Café', 8500, 12500, 'sold_out', 3)
) as v (slug, name, category_slug, supplier_name, price, old_price, status, checked_days_ago)
join public.categories c on c.slug = v.category_slug
join public.suppliers s on s.name = v.supplier_name;

-- Commandes à différents stades, pour le back-office.
with new_orders as (
  insert into public.orders (code, customer_name, customer_phone, commune, address_details, payment_method, status, delivery_fee, created_at, confirm_before)
  values
    ('BH-1036', 'Ibrahima Ndiaye', '770000106', 'Pikine', 'Cité Sotiba, près de la mosquée', 'wave', 'shipping', 2500, now() - interval '5 hours', now() - interval '3 hours'),
    ('BH-1038', 'Khady Fall', '770000108', 'Almadies – Ngor', 'Route de Ngor, immeuble blanc, 2e étage', 'cash', 'confirmed', 3000, now() - interval '3 hours', now() - interval '1 hour'),
    ('BH-1039', 'Fatou Sarr', '770000109', 'Ouakam', 'Derrière le marché, portail vert', 'orange_money', 'checking', null, now() - interval '130 minutes', now() - interval '10 minutes'),
    ('BH-1041', 'Moussa Diop', '770000111', 'Parcelles Assainies', 'Unité 15, en face de la boulangerie', 'cash', 'received', null, now() - interval '47 minutes', now() + interval '73 minutes'),
    ('BH-1042', 'Awa Ndiaye', '770000112', 'Mermoz – Sacré-Cœur', 'Rue 10, maison verte, en face de la pharmacie', 'cash', 'checking', null, now() - interval '12 minutes', now() + interval '108 minutes')
  returning id, code
)
insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, check_status)
select o.id, p.id, p.name, p.price, v.quantity, v.check_status::public.item_check
from (values
  ('BH-1036', 'cafe-grains-arabica-1kg', 2, 'available'),
  ('BH-1038', 'kit-bandes-resistance', 2, 'available'),
  ('BH-1038', 'montre-connectee-sport', 1, 'available'),
  ('BH-1039', 'creme-hydratante-visage-50ml', 1, 'available'),
  ('BH-1039', 'ecran-solaire-spf50-50ml', 1, 'available'),
  ('BH-1039', 'cafe-grains-arabica-1kg', 1, 'pending'),
  ('BH-1041', 'ecouteurs-reduction-bruit', 1, 'pending'),
  ('BH-1042', 'serum-vitamine-c-30ml', 2, 'available'),
  ('BH-1042', 'whey-isolat-2kg', 1, 'pending')
) as v (code, slug, quantity, check_status)
join new_orders o on o.code = v.code
join public.products p on p.slug = v.slug;

insert into public.order_events (order_id, message, created_at)
select o.id, v.message, now() - make_interval(mins => v.minutes_ago)
from (values
  ('BH-1042', 'Commande reçue sur le site', 12),
  ('BH-1042', 'Disponibilité demandée à Fournisseur 1 · Beauté', 10),
  ('BH-1042', 'Sérum éclat vitamine C : disponible', 3),
  ('BH-1042', 'Disponibilité demandée à Fournisseur 2 · Sport', 2)
) as v (code, message, minutes_ago)
join public.orders o on o.code = v.code;

insert into public.stock_alerts (product_id, phone)
select id, '770000201' from public.products where slug = 'palette-fards-12-teintes';

-- Commande en attente du choix du client : la whey est épuisée, une autre est proposée.
-- Jeton fixe pour tester la page : http://localhost:3000/suivi/acacacacacacacacacacacacacacacacacac
with o as (
  insert into public.orders (code, tracking_token, customer_name, customer_phone, commune, address_details, status, created_at)
  values ('BH-1040', 'acacacacacacacacacacacacacacacacacac', 'Mariama Ba', '770000110', 'Médina', 'Rue 22, près du marché Tilène', 'action_required', now() - interval '90 minutes')
  returning id
)
insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, check_status, replacement_product_id)
select o.id, p.id, p.name, p.price, v.quantity, v.check_status::public.item_check, r.id
from o
cross join (values
  ('kit-bandes-resistance', 1, 'available', null),
  ('whey-isolat-2kg', 1, 'unavailable', 'whey-proteine-2kg')
) as v (slug, quantity, check_status, replacement_slug)
join public.products p on p.slug = v.slug
left join public.products r on r.slug = v.replacement_slug;

-- Compte admin de test, en LOCAL uniquement (le seed n'est jamais envoyé en ligne) :
-- admin@blackhouse.test / blackhouse-local  →  http://localhost:3000/admin
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000', 'a0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
  'admin@blackhouse.test', extensions.crypt('blackhouse-local', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), '', '', '', ''
);
insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values (
  gen_random_uuid(), 'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
  '{"sub": "a0000000-0000-4000-8000-000000000001", "email": "admin@blackhouse.test", "email_verified": true}',
  'email', now(), now(), now()
);
insert into public.admins (user_id) values ('a0000000-0000-4000-8000-000000000001');

-- Les numéros des commandes de test sont fixés à la main : la prochaine sera BH-1043.
select setval('public.order_number_seq', 1042);
