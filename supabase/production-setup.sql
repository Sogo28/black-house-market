-- Installation initiale du projet Supabase EN LIGNE. À jouer une seule fois, à la main, dans
-- Studio > SQL Editor, après `npx supabase db push`. Ce fichier n'est PAS un seed : il n'est
-- jamais joué automatiquement, et ne contient ni produit, ni commande, ni compte de test.
--
-- Il peut être rejoué sans danger (aucun doublon créé).

-- 1. Les catégories du site (nom, texte d'accueil, ordre dans la barre de navigation).
insert into public.categories (slug, name, hint, position) values
  ('beaute', 'Beauté', 'Soins, parfums, maquillage', 1),
  ('musculation', 'Musculation', 'Protéines, accessoires', 2),
  ('high-tech', 'High-tech', 'Audio, montres, accessoires', 3),
  ('cafe', 'Café', 'Grains, moulu, capsules', 4)
on conflict (slug) do nothing;

-- 2. Les fournisseurs (visibles du back-office seulement). Un par ligne : nom + WhatsApp sur
--    9 chiffres, sans +221. Exemple à adapter, puis décommenter :
--
-- insert into public.suppliers (name, whatsapp) values
--   ('Fournisseur 1 · Beauté', '77XXXXXXX'),
--   ('Fournisseur 2 · Sport', '78XXXXXXX');

-- 3. Le compte de Babacar. Créer d'abord l'utilisateur dans Studio > Authentication > Users >
--    « Add user » (e-mail + mot de passe, cocher « Auto Confirm User »), puis remplacer
--    l'adresse ci-dessous et décommenter :
--
-- insert into public.admins (user_id)
-- select id from auth.users where email = 'babacar@exemple.com'
-- on conflict do nothing;
