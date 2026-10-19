-- L'API de stockage retrouve l'objet avec les droits de l'utilisateur avant de le supprimer
-- ou de le remplacer : sans politique de lecture, elle ne le voit pas et ne supprime rien,
-- sans renvoyer d'erreur. Les photos restent lisibles par tous via leur URL publique
-- (seau public) ; cette politique ne concerne que l'API, réservée aux admins.

create policy "Les admins lisent les photos produits"
on storage.objects for select to authenticated
using (bucket_id = 'product-images' and (select public.is_admin()));
