# Plano de Migração — Vesta para React nativo

## Princípio geral

O `public/vesta.html` continua sendo a referência funcional e fallback. Vamos migrar em blocos, sem redesenhar, sem placeholders, sem perder módulos. Toda a UI React lê exclusivamente de `src/data/profiles.ts`.

## Identidade visual (aplicada já na Fase 1)

Tokens em `src/styles.css` (oklch equivalentes dos hex da referência):

- Areia clara `#F7F4EF` → `--background`
- Marfim `#F2EDE3` → `--card`, `--muted`
- Azul noite `#1F3A52` → `--sidebar`
- Azul petróleo `#2D4B63` → `--sidebar-accent`, `--primary`
- Cobre suave `#B8734A` → `--accent`
- Dourado suave `#D8B36A` → `--ring`, detalhes
- Rosa pó `#E7CCD3` / Rosa queimado `#C88FA0` → destaques femininos

Tipografia: Playfair Display (títulos serif) + Source Sans 3 (texto), carregadas via `<link>` no `__root.tsx` head (não `@import` em CSS por causa do Tailwind v4).

Símbolos (templo, deusa, fogo do lar, trigo, ânforas) como SVG line-art em `src/components/vesta/ornaments/`, usados em baixa opacidade como marca d'água / decoração de cards.

## Fase 1 — Núcleo (esta entrega)

Arquivos novos:

```
src/components/vesta/
  profile-selector.tsx      → Cinthia (1º), Paulo, Familiar
  vesta-sidebar.tsx         → azul noite, itens de navegação do HTML
  vesta-header.tsx          → "VESTA · Guardiã do Patrimônio" + subtítulo do perfil
  visao-geral.tsx           → cards: Patrimônio Total, RF %, RV %, Evolução
  alertas-recentes.tsx      → lê alerts do perfil (com prefixo [Cinthia]/[Paulo] no familiar)
  proximos-vencimentos.tsx  → lê maturities do perfil
  ornaments/                → templo.svg, deusa.svg, trigo.svg, anfora.svg, fogo.svg
src/state/
  profile-context.tsx       → Context + hook useActiveProfile()
src/lib/
  profile-derive.ts         → derivedFamily(cinthia, paulo), totals, alertas prefixados
```

Rota `/` substitui o iframe por: `<ProfileSelector>` se nenhum perfil ativo → senão `<VestaShell>` (sidebar + header + `<VisaoGeral>`).

Regras de perfil (endurecidas em `profile-derive.ts` — nunca hardcoded em componente):
- Cinthia: apenas dados de Cinthia, upload folder `Cinthia`, subtítulo `Cinthia · Visão individual`.
- Paulo: apenas dados de Paulo, upload folder `paulo`, subtítulo `Paulo · Visão individual`.
- Familiar: derivado — `alerts` e `maturities` concatenados com prefixo `[Cinthia] ` / `[Paulo] `, totais somados, subtítulo `Família · Visão consolidada`.

Header nunca mostra corretora nem nome de pessoa física — sempre `VESTA / Guardiã do Patrimônio` + subtítulo.

## Fase 2 — Carteira e Posições (próxima entrega)

- `posicao-atual.tsx` — tabela RF/RV/FII/ETF/NTN a partir de `profile.holdings`
- Filtros por classe e por status (`urgente` / `monitorar` / `intocavel` via `tag`)
- Totais derivados via `totalsOf(profile)`
- Módulos ainda não migrados abrem via iframe apontando para âncoras específicas de `public/vesta.html` (sem "Em breve").

## Fase 3 — Inteligência Financeira

Migrar Breakeven, Acelerar Breakeven, Equivalência de Taxas, Validador de Troca, Regras — não mexer, Drivers macro. Cada um como componente React lendo de `profiles.ts`.

## Fallback

Enquanto um módulo não estiver migrado, rota `/legacy/*` ou seção interna renderiza `<iframe src="/vesta.html#modulo" />`. Nunca "Em breve".

## Entrega desta rodada

Executar Fase 1 completa: tokens visuais, tipografia serif, ornaments SVG, sidebar azul noite, header Vesta, seletor de perfis (Cinthia primeiro), Visão Geral com Patrimônio Total (com templo em marca d'água), Alertas Recentes, Próximos Vencimentos — todos lendo de `src/data/profiles.ts` e derivando Familiar automaticamente. `public/vesta.html` permanece como fallback para os módulos das fases 2 e 3.

Ao final relato o que ficou React nativo, o que segue via fallback, e proponho Posição Atual como próximo módulo.
