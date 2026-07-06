CREATE TABLE public.domus_visibility_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domus_id uuid NOT NULL REFERENCES public.domus(id) ON DELETE CASCADE,
  member_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  can_see_consolidado boolean NOT NULL DEFAULT false,
  can_see_member_profile_ids uuid[] NOT NULL DEFAULT '{}'::uuid[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT domus_visibility_scopes_unique_member UNIQUE (domus_id, member_profile_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.domus_visibility_scopes TO authenticated;
GRANT ALL ON public.domus_visibility_scopes TO service_role;

ALTER TABLE public.domus_visibility_scopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vesta administra escopos do Domus"
ON public.domus_visibility_scopes
FOR ALL
TO authenticated
USING (public.is_vesta())
WITH CHECK (public.is_vesta());

CREATE POLICY "Membro ve proprio escopo do Domus"
ON public.domus_visibility_scopes
FOR SELECT
TO authenticated
USING (auth.uid() = member_profile_id);

CREATE TRIGGER set_domus_visibility_scopes_updated_at
BEFORE UPDATE ON public.domus_visibility_scopes
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();