-- El dominio principal ahora es blu-june.vercel.app
select cron.unschedule('june-push');
select cron.schedule(
  'june-push',
  '* * * * *',
  $cron$
    select net.http_post(
      url := 'https://blu-june.vercel.app/api/push/send',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select value from private.config where key = 'cron_secret')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 10000
    );
  $cron$
);
