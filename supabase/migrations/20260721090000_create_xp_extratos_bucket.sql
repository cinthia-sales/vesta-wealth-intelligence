-- Storage privado para extratos e posicoes mensais importadas no Vesta.
-- Estrutura esperada:
-- xp-extratos/{profile_id ou account_id}/YYYY-MM/arquivo.xlsx

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'xp-extratos',
  'xp-extratos',
  false,
  10485760,
  ARRAY[
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
    'text/plain',
    'application/csv'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS xp_owner_access ON storage.objects;
DROP POLICY IF EXISTS xp_vesta_access ON storage.objects;
DROP POLICY IF EXISTS xp_local_vesta_access ON storage.objects;

CREATE POLICY xp_owner_access
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'xp-extratos'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'xp-extratos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY xp_vesta_access
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'xp-extratos'
  AND public.is_vesta()
)
WITH CHECK (
  bucket_id = 'xp-extratos'
  AND public.is_vesta()
);

CREATE POLICY xp_local_vesta_access
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'xp-extratos'
  AND EXISTS (
    SELECT 1
    FROM public.domus_members vesta_member
    JOIN public.domus_members target_member
      ON target_member.domus_id = vesta_member.domus_id
    WHERE vesta_member.profile_id = auth.uid()
      AND vesta_member.papel = 'vesta'
      AND target_member.profile_id::text = (storage.foldername(name))[1]
  )
);
