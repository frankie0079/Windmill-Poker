-- Pasten in: Supabase Dashboard → SQL Editor → Run
SELECT 'view moneylist'      AS objekt,
       EXISTS(SELECT 1 FROM information_schema.views
              WHERE table_schema='public' AND table_name='moneylist') AS exists
UNION ALL
SELECT 'bucket gallery-photos',
       EXISTS(SELECT 1 FROM storage.buckets WHERE id='gallery-photos');
