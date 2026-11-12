-- Notificaciones push de June.
-- El móvil manda sus próximos avisos a /api/push/sync (Vercel) y se guardan aquí.
-- pg_cron llama cada minuto a /api/push/send, que reclama los avisos pendientes y los envía.
--
-- Tras aplicar esta migración hay que guardar el secreto del cron (el mismo que CRON_SECRET en Vercel):
--   insert into private.config (key, value) values ('cron_secret', '<secreto>')
--     on conflict (key) do update set value = excluded.value;
-- y programar el cron (cambia la URL si el dominio es otro):
--   select cron.schedule('june-push', '* * * * *', $$
--     select net.http_post(
--       url := 'https://june-empieza.vercel.app/api/push/send',
--       headers := jsonb_build_object('x-cron-secret', (select value from private.config where key = 'cron_secret'))
--     )
--   $$);

create extension if not exists pg_cron;
create extension if not exists pg_net;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.config (
  key text primary key,
  value text not null
);

create table if not exists public.push_subscriptions (
  endpoint text primary key,
  subscription jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.push_reminders (
  id bigserial primary key,
  endpoint text not null references public.push_subscriptions (endpoint) on delete cascade,
  send_at timestamptz not null,
  title text not null,
  body text not null,
  tag text,
  sent_at timestamptz
);

create index if not exists push_reminders_due on public.push_reminders (send_at) where sent_at is null;
create index if not exists push_reminders_endpoint on public.push_reminders (endpoint);

-- Sin políticas: nadie puede leer ni escribir las tablas directamente desde la API pública.
alter table public.push_subscriptions enable row level security;
alter table public.push_reminders enable row level security;

-- Sustituye los avisos pendientes de un móvil por la lista nueva.
create or replace function public.push_sync(p_subscription jsonb, p_reminders jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_endpoint text := p_subscription ->> 'endpoint';
  v_count integer;
begin
  if v_endpoint is null or v_endpoint !~ '^https://' or length(v_endpoint) > 1000 then
    raise exception 'endpoint no válido';
  end if;
  if jsonb_typeof(p_reminders) <> 'array' or jsonb_array_length(p_reminders) > 200 then
    raise exception 'lista de avisos no válida';
  end if;

  insert into public.push_subscriptions (endpoint, subscription, updated_at)
  values (v_endpoint, p_subscription, now())
  on conflict (endpoint) do update set subscription = excluded.subscription, updated_at = now();

  delete from public.push_reminders where endpoint = v_endpoint and sent_at is null;

  insert into public.push_reminders (endpoint, send_at, title, body, tag)
  select v_endpoint, (r ->> 'at')::timestamptz, left(r ->> 'title', 120), left(r ->> 'body', 300), left(r ->> 'tag', 60)
  from jsonb_array_elements(p_reminders) as r
  where (r ->> 'at')::timestamptz > now() - interval '5 minutes'
    and (r ->> 'at')::timestamptz < now() + interval '15 days';

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- Marca como enviados y devuelve los avisos que ya tocan. Solo con el secreto del cron.
create or replace function public.push_claim_due(p_secret text)
returns table (reminder_id bigint, subscription jsonb, title text, body text, tag text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if p_secret is null or p_secret is distinct from (select c.value from private.config c where c.key = 'cron_secret') then
    raise exception 'forbidden';
  end if;

  return query
  with due as (
    update public.push_reminders r
    set sent_at = now()
    where r.id in (
      select r2.id from public.push_reminders r2
      where r2.sent_at is null
        and r2.send_at <= now()
        and r2.send_at > now() - interval '30 minutes'
      order by r2.send_at
      limit 200
      for update skip locked
    )
    returning r.id, r.endpoint, r.title, r.body, r.tag
  )
  select due.id, s.subscription, due.title, due.body, due.tag
  from due
  join public.push_subscriptions s on s.endpoint = due.endpoint;

  -- Limpieza de avisos viejos
  delete from public.push_reminders r3 where r3.send_at < now() - interval '2 days';
end;
$$;

-- Borra un móvil que ya no acepta avisos (desinstaló la app o quitó el permiso).
create or replace function public.push_forget(p_secret text, p_endpoint text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_secret is null or p_secret is distinct from (select c.value from private.config c where c.key = 'cron_secret') then
    raise exception 'forbidden';
  end if;
  delete from public.push_subscriptions where endpoint = p_endpoint;
end;
$$;

revoke all on function public.push_sync(jsonb, jsonb) from public;
revoke all on function public.push_claim_due(text) from public;
revoke all on function public.push_forget(text, text) from public;
grant execute on function public.push_sync(jsonb, jsonb) to anon;
grant execute on function public.push_claim_due(text) to anon;
grant execute on function public.push_forget(text, text) to anon;
