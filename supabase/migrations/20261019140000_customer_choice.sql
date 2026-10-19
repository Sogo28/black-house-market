-- Choix du client quand un article manque (page de suivi).
--
-- Babacar marque un article « indisponible » et peut proposer un remplacement ; la commande
-- passe alors en « action_required ». Le client choisit, pour tous les articles manquants :
-- - replace : prendre le remplacement proposé (sinon l'article est retiré) ;
-- - remove  : continuer sans ;
-- - cancel  : annuler toute la commande.
-- La commande repasse ensuite en vérification : Babacar envoie le nouveau total.
--
-- Réservée au serveur Next (rôle service_role), qui identifie la commande par son jeton.

create function public.apply_customer_choice(p_tracking_token text, p_choice public.customer_choice)
returns public.order_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_remaining integer;
begin
  select * into v_order
  from public.orders
  where tracking_token = p_tracking_token
  for update;

  if not found then
    raise exception 'Commande introuvable';
  end if;
  if v_order.status <> 'action_required' then
    raise exception 'Aucun choix attendu pour la commande %', v_order.code;
  end if;

  if p_choice = 'cancel' then
    update public.order_items
    set customer_choice = 'cancel'
    where order_id = v_order.id and check_status = 'unavailable';

    update public.orders set status = 'cancelled' where id = v_order.id;
    insert into public.order_events (order_id, message) values (v_order.id, 'Le client a annulé la commande');
    return 'cancelled';
  end if;

  -- Sans remplacement proposé, « remplacer » revient à retirer l'article.
  update public.order_items
  set customer_choice = case
    when p_choice = 'replace' and replacement_product_id is not null then 'replace'::public.customer_choice
    else 'remove'::public.customer_choice
  end
  where order_id = v_order.id and check_status = 'unavailable';

  select count(*) into v_remaining
  from public.order_items
  where order_id = v_order.id
    and (check_status <> 'unavailable' or customer_choice = 'replace');

  if v_remaining = 0 then
    update public.orders set status = 'cancelled' where id = v_order.id;
    insert into public.order_events (order_id, message)
    values (v_order.id, 'Le client a retiré tous les articles : commande annulée');
    return 'cancelled';
  end if;

  update public.orders set status = 'checking' where id = v_order.id;
  insert into public.order_events (order_id, message)
  values (
    v_order.id,
    case p_choice
      when 'replace' then 'Le client accepte le remplacement proposé'
      else 'Le client continue sans les articles manquants'
    end
  );
  return 'checking';
end;
$$;

revoke all on function public.apply_customer_choice(text, public.customer_choice) from public, anon, authenticated;
grant execute on function public.apply_customer_choice(text, public.customer_choice) to service_role;
