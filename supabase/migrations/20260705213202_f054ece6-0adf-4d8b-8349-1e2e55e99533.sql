INSERT INTO public.domus (nome, slug, descricao)
VALUES ('Família Malta Furtado', 'familia-malta-furtado', 'Gestão familiar de patrimônio, permissões e decisões.')
ON CONFLICT (slug) DO NOTHING;