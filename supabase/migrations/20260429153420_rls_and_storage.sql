-- =============================================================================
-- RLS-Policies + Storage Bucket
--
-- Modell: Leser dürfen alles sehen (anon-Role), nur Admin (authenticated-Role)
-- darf schreiben. Es gibt nur einen Admin-User (Frank), daher keine
-- per-User-Verfeinerung nötig.
-- =============================================================================

-- ---------- RLS auf allen Tabellen aktivieren ----------
ALTER TABLE public.players             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_days           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendances         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.round_results       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.next_game_planning  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos      ENABLE ROW LEVEL SECURITY;

-- ---------- SELECT für alle (anon + authenticated) ----------
CREATE POLICY "select_all_players"            ON public.players            FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "select_all_game_days"          ON public.game_days          FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "select_all_attendances"        ON public.attendances        FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "select_all_round_results"      ON public.round_results      FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "select_all_next_game_planning" ON public.next_game_planning FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "select_all_gallery_photos"     ON public.gallery_photos     FOR SELECT TO anon, authenticated USING (true);

-- ---------- INSERT/UPDATE/DELETE nur für authenticated (Admin) ----------
CREATE POLICY "admin_write_players"            ON public.players            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_write_game_days"          ON public.game_days          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_write_attendances"        ON public.attendances        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_write_round_results"      ON public.round_results      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_write_next_game_planning" ON public.next_game_planning FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_write_gallery_photos"     ON public.gallery_photos     FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =============================================================================
-- Storage Bucket: gallery-photos
-- Public-Read, Upload/Edit/Delete nur für Admin (authenticated)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-photos', 'gallery-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_read_gallery_photos"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'gallery-photos');

CREATE POLICY "admin_upload_gallery_photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'gallery-photos');

CREATE POLICY "admin_update_gallery_photos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'gallery-photos')
    WITH CHECK (bucket_id = 'gallery-photos');

CREATE POLICY "admin_delete_gallery_photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'gallery-photos');
