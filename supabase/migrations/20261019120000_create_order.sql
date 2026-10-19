-- Enregistrement d'une commande en une seule transaction.
--
-- Le navigateur n'envoie que des slugs et des quantités : le nom, le prix et la
-- disponibilité sont relus ici, dans la vue `catalogue`. Si un produit est introuvable
-- ou épuisé, rien n'est enregistré.
--
-- Réservée au serveur Next (clé secrète, rôle service_role) : les visiteurs ne peuvent
-- pas l'appeler directement.

create function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_commune text,
  p_address_details text,
  p_payment_method public.payment_method,
  p_items jsonb -- [{"slug": "serum-vitamine-c-30ml", "quantity": 2}, …]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_item jsonb;
  v_product record;
begin
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Panier vide';
  end if;

  insert into public.orders (customer_name, customer_phone, commune, address_details, payment_method)
  values (p_customer_name, p_customer_phone, p_commune, p_address_details, p_payment_method)
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    select c.id, c.name, c.price, c.status
    into v_product
    from public.catalogue c
    where c.slug = v_item ->> 'slug';

    if not found then
      raise exception 'Produit introuvable : %', v_item ->> 'slug';
    end if;
    if v_product.status = 'sold_out' then
      raise exception 'Produit épuisé : %', v_product.name;
    end if;

    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
    values (v_order.id, v_product.id, v_product.name, v_product.price, (v_item ->> 'quantity')::integer);
  end loop;

  insert into public.order_events (order_id, message)
  values (v_order.id, 'Commande reçue sur le site');

  return jsonb_build_object('code', v_order.code, 'tracking_token', v_order.tracking_token);
end;
$$;

revoke all on function public.create_order(text, text, text, text, public.payment_method, jsonb)
from public, anon, authenticated;

grant execute on function public.create_order(text, text, text, text, public.payment_method, jsonb)
to service_role;
