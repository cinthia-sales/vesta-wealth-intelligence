CREATE TABLE public.domus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  descricao TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT domus_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
GRANT SELECT ON public.domus TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domus TO authenticated;
GRANT ALL ON public.domus TO service_role;
ALTER TABLE public.domus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Todos veem domus" ON public.domus
  FOR SELECT TO anon, authenticated
  USING (true);
CREATE POLICY "Vesta administra domus" ON public.domus
  FOR ALL TO authenticated
  USING (public.is_vesta())
  WITH CHECK (public.is_vesta());

CREATE TABLE public.domus_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domus_id UUID NOT NULL REFERENCES public.domus(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  papel TEXT NOT NULL DEFAULT 'membro' CHECK (papel IN ('vesta', 'guardiao', 'membro')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (domus_id, profile_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domus_members TO authenticated;
GRANT ALL ON public.domus_members TO service_role;
ALTER TABLE public.domus_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Membro ve propria participacao" ON public.domus_members
  FOR SELECT TO authenticated
  USING (auth.uid() = profile_id);
CREATE POLICY "Vesta administra membros do domus" ON public.domus_members
  FOR ALL TO authenticated
  USING (public.is_vesta())
  WITH CHECK (public.is_vesta());

CREATE TABLE public.domus_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domus_id UUID REFERENCES public.domus(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  mensagem TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'recusado')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.domus_join_requests TO authenticated;
GRANT INSERT ON public.domus_join_requests TO anon;
GRANT ALL ON public.domus_join_requests TO service_role;
ALTER TABLE public.domus_join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Qualquer pessoa pede entrada" ON public.domus_join_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pendente' AND reviewed_by IS NULL AND reviewed_at IS NULL);
CREATE POLICY "Vesta ve pedidos" ON public.domus_join_requests
  FOR SELECT TO authenticated
  USING (public.is_vesta());
CREATE POLICY "Vesta decide pedidos" ON public.domus_join_requests
  FOR UPDATE TO authenticated
  USING (public.is_vesta())
  WITH CHECK (public.is_vesta());
CREATE POLICY "Vesta remove pedidos" ON public.domus_join_requests
  FOR DELETE TO authenticated
  USING (public.is_vesta());

CREATE TRIGGER domus_set_updated_at
  BEFORE UPDATE ON public.domus
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER domus_members_set_updated_at
  BEFORE UPDATE ON public.domus_members
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER domus_join_requests_set_updated_at
  BEFORE UPDATE ON public.domus_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();