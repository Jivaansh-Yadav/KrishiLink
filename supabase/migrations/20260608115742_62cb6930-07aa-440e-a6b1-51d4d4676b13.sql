ALTER TABLE public.crops ADD COLUMN IF NOT EXISTS photo_urls text[] NOT NULL DEFAULT '{}';
-- Backfill: move existing single photo_url into the array
UPDATE public.crops SET photo_urls = ARRAY[photo_url] WHERE photo_url IS NOT NULL AND (photo_urls IS NULL OR array_length(photo_urls,1) IS NULL);