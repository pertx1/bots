-- Secretos de las notificaciones, que nunca salen de la base de datos:
-- - cron_secret: se genera aquí; el cron lo manda a Vercel en cada llamada y Vercel lo usa
--   para pedir las claves VAPID y los avisos pendientes.
-- - vapid_public / vapid_private: las genera /api/push/send la primera vez y las guarda aquí.

insert into private.config (key, value)
values ('cron_secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;

-- Clave pública VAPID: la puede leer cualquiera (la necesita el móvil para suscribirse)
create or replace function public.push_vapid_public()
returns text
language sql
security definer
set search_path = ''
as $$
  select c.value from private.config c where c.key = 'vapid_public';
$$;

-- Claves VAPID completas: solo con el secreto del cron
create or replace function public.push_vapid_keys(p_secret text)
returns table (public_key text, private_key text)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_secret is null or p_secret is distinct from (select c.value from private.config c where c.key = 'cron_secret') then
    raise exception 'forbidden';
  end if;
  return query
  select
    (select c.value from private.config c where c.key = 'vapid_public'),
    (select c.value from private.config c where c.key = 'vapid_private');
end;
$$;

-- Guarda las claves VAPID la primera vez (no las sobrescribe nunca)
create or replace function public.push_set_vapid(p_secret text, p_public text, p_private text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_secret is null or p_secret is distinct from (select c.value from private.config c where c.key = 'cron_secret') then
    raise exception 'forbidden';
  end if;
  insert into private.config (key, value) values ('vapid_public', p_public) on conflict (key) do nothing;
  insert into private.config (key, value) values ('vapid_private', p_private) on conflict (key) do nothing;
end;
$$;

revoke all on function public.push_vapid_public() from public;
revoke all on function public.push_vapid_keys(text) from public;
revoke all on function public.push_set_vapid(text, text, text) from public;
grant execute on function public.push_vapid_public() to anon;
grant execute on function public.push_vapid_keys(text) to anon;
grant execute on function public.push_set_vapid(text, text, text) to anon;

-- Llamada cada minuto a Vercel para enviar los avisos que tocan
select cron.schedule(
  'june-push',
  '* * * * *',
  $cron$
    select net.http_post(
      url := 'https://june-empieza.vercel.app/api/push/send', -- cambiado a blu-june en 0004
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select value from private.config where key = 'cron_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 10000
    );
  $cron$
);
