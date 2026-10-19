-- Visuel de chaque catégorie (page d'accueil). Comme pour les produits, on stocke le chemin du
-- fichier dans le seau public `product-images` (dossier categories/). Sans image, le site
-- affiche un encart neutre.

alter table public.categories add column image text;
