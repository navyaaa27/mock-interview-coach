-- 1. Add email_unsubscribed column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_unsubscribed boolean DEFAULT false;

-- 2. Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Note: Replace YOUR_ANON_KEY below with your actual Supabase Anon Key

-- 3. EMAIL 1: Weekly Progress Digest (Sunday at 09:00 IST / 03:30 UTC)
SELECT cron.schedule(
  'weekly-digest',
  '30 3 * * 0',
  $$
    SELECT net.http_post(
      url := 'https://oymtdxfzsccgczlqluud.supabase.co/functions/v1/send-email',
      headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body := '{"email_type": "weekly_digest", "batch": true}'::jsonb
    )
  $$
);

-- 4. EMAIL 2: Streak At Risk Alert (Daily at 20:00 IST / 14:30 UTC)
SELECT cron.schedule(
  'streak-alert',
  '30 14 * * *',
  $$
    SELECT net.http_post(
      url := 'https://oymtdxfzsccgczlqluud.supabase.co/functions/v1/send-email',
      headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body := '{"email_type": "streak_alert", "batch": true}'::jsonb
    )
  $$
);
