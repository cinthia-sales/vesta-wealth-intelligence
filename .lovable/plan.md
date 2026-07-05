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

Tipografia: Playfair Display (títulos serif) + Source Sans 3 (texto), carregadas via `<link>` no `__root.tsx` head.

Símbolos (templo, deusa, fogo do lar, trigo, ânforas) como SVG line-art em `src/components/vesta/ornaments/`, usados em baixa opacidade como marca d'água.

## Fase 1 — Núcleo ✅ ENTREGUE

Perfis Cinthia/Paulo/Familiar, sidebar, header, Visão Geral, Alertas, Vencimentos, todos lendo de `profiles.ts` com Familiar derivado.

## Fase 2 — Carteira e Posições ✅ ENTREGUE

Posição Atual com filtros por classe e status.

## Fase 3 — Inteligência Financeira ✅ ENTREGUE

Breakeven, Aporte, Equivalência, Validador, Regras, Drivers.

---

# Fase 4 — Modelo de Usuários (Domus + Personae)

> Objetivo desta fase: desenhar como o Vesta se comporta como aplicativo real, com múltiplos usuários, permissões e um Domus (agrupamento familiar). **Sem código nesta rodada** — apenas o modelo conceitual e as telas necessárias. Implementação em fases posteriores.

## Conceitos

### Domus
A "casa" — o agrupamento patrimonial familiar. Existe quando há **2 ou mais Personae** vinculadas. Se houver apenas 1 pessoa, ela é soberana sobre a própria carteira e não há Domus (ou existe um Domus vazio de outros membros).

Cada Domus tem:
- Um nome (ex: "Família Furtado")
- Uma única **Vesta** (guardiã)
- N Personae membros

### Persona
Cada usuário do sistema. Tem:
- Identidade (nome, email/login)
- Patrimônio individual (carteira própria — o que hoje está em `profiles.ts`)
- Vínculo opcional a um Domus
- **Escopo de visão** definido pela Vesta (se for membro de Domus)

### Vesta
Papel especial dentro de um Domus. **Uma única Vesta por Domus**, soberana absoluta. É ela quem:
- Cria o Domus
- Convida/remove Personae
- Define livremente o escopo de visão de cada membro (incluindo escopos customizados por membro)
- Pode transferir o papel de Vesta para outra Persona (sucessão)

A Vesta sempre tem visão total (própria + todas as Personae + consolidado do Domus).

### Escopo de visão (Vesta define livremente por membro)

A Vesta escolhe, para cada membro, uma combinação livre de:
- ✅ Vê a **própria** carteira (sempre ligado — mínimo garantido)
- ✅ Vê o **consolidado do Domus** (números agregados, sem abrir individuais alheias)
- ✅ Vê a carteira de **Personae específicas** (checkbox por Persona: "pode ver Paulo", "pode ver João", etc.)

Combinações emergem naturalmente:
- Só própria → equivale ao antigo "self"
- Própria + consolidado → vê o total família sem detalhar os outros
- Própria + Paulo → casal simétrico
- Própria + consolidado + todos os membros → equivalente a "full" (co-guardião, mas ainda sem poder de gerenciar permissões — só a Vesta gerencia)

**A Vesta pode editar esse escopo a qualquer momento**, inclusive retroativamente. Não há "níveis fixos" — é sempre a Vesta desenhando o que cada um enxerga.

## Mapeamento no estado atual do app

Hoje o `ProfileSelector` mostra 3 cards fixos (Cinthia, Paulo, Familiar) e o usuário escolhe qual "olhar" quer usar. Isso simula o poder da Vesta (Cinthia), mas sem noção de login ou de que Paulo, se abrisse o app, não deveria ver os outros.

No modelo Domus:
- **Cinthia** = Vesta do Domus "Família Furtado"
- **Paulo** = Persona membro, escopo definido pela Cinthia
- **"Familiar"** = a visão consolidada do Domus (só quem tem escopo `consolidado` acessa)

## Fluxos principais

### Fluxo 1 — Login (mockado na fase de implementação inicial)
1. Tela de login pede identidade (ex: dropdown "Entrar como Cinthia / Paulo" enquanto for mock).
2. App resolve: qual Persona? tem Domus? qual escopo?
3. Redireciona para o `ProfileSelector` filtrado.

### Fluxo 2 — ProfileSelector filtrado por escopo
- **Cinthia logada (Vesta)** → vê 3 cards: Própria, Paulo, Familiar (como hoje).
- **Paulo logado com escopo `só própria`** → vê 1 card só (própria) ou entra direto sem seletor.
- **Paulo logado com escopo `própria + consolidado`** → vê 2 cards: Própria, Familiar.
- **Paulo logado com escopo `própria + Cinthia`** → vê 2 cards: Própria, Cinthia.
- **Paulo logado com escopo `full`** → vê os 3 cards, igual à Cinthia (mas sem acesso à Gestão do Domus).

### Fluxo 3 — Gestão do Domus (só Vesta acessa)
Nova rota/tela `/domus` ou item no sidebar visível apenas para a Vesta:
- Lista de membros do Domus
- Para cada membro: nome, escopo atual, botão "editar escopo"
- Modal de edição de escopo com checkboxes livres:
  - ☑ Ver própria carteira (fixo, sempre ligado)
  - ☐ Ver consolidado do Domus
  - ☐ Ver carteira de Cinthia
  - ☐ Ver carteira de Paulo
  - ☐ Ver carteira de [outros membros]
- Botão "Convidar nova Persona" (email + nome inicial)
- Botão "Transferir papel de Vesta" (com confirmação forte)

### Fluxo 4 — Estado "soberana solo" (sem Domus)
Se a Persona não pertence a nenhum Domus, o app pula ProfileSelector e vai direto para a carteira própria. Nada de card "Familiar", nada de tela de Domus. Simples.

## Entidades (para modelagem futura de backend)

```
Persona
  id, nome, email, criado_em

Domus
  id, nome, vesta_persona_id, criado_em

DomusMembership          (Persona ↔ Domus, N:1 — Persona pode estar em 1 Domus por vez na v1)
  persona_id, domus_id, entrou_em

Scope                    (definido pela Vesta para cada membro)
  domus_id, persona_id (membro),
  ve_consolidado: bool,
  ve_personae: persona_id[]  (lista de Personae específicas que este membro pode ver)
  // "vê a própria" é implícito, sempre true
```

## Telas novas nesta fase (quando implementarmos)

1. **`/login`** (mock) — seletor de Persona ativa.
2. **`ProfileSelector` filtrado** — mesmo componente atual, mas recebe a lista de "carteiras acessíveis" como prop derivada do escopo.
3. **`/domus`** — Gestão do Domus, só visível para a Vesta.
4. **Modal "Editar escopo"** — checkboxes livres por Persona + consolidado.

## Implementação faseada (proposta)

### Fase 4a — Mock em memória (baixo custo, valida UX)
- Adicionar `src/state/session.ts` com Persona logada em memória + Domus mockado.
- Login rudimentar: dropdown no topo para trocar de Persona (Cinthia | Paulo).
- Filtrar `ProfileSelector` conforme escopo da Persona logada.
- Tela `/domus` só para Cinthia, com escopos editáveis in-memory (não persistem entre reloads).
- **Sem backend.** Só sentir o fluxo e validar o modelo.

### Fase 4b — Persistência local
- Salvar Domus + escopos em `localStorage` para sobreviver a reloads.
- Ainda sem auth real.

### Fase 4c — Backend real (Lovable Cloud)
- Auth de verdade (email/senha + Google).
- Tabelas: `personas`, `domus`, `domus_memberships`, `scopes`.
- RLS: cada Persona só lê dados permitidos pelo próprio Scope; Vesta lê tudo do seu Domus.
- Convite por email (magic link) para novas Personae.
- Fase mais pesada — só depois que 4a validar o fluxo.

## O que fica fora desta fase

- Não vamos implementar nada agora — só documentar.
- Não vamos criar auth real ainda.
- Não vamos mexer no `profiles.ts` — Cinthia/Paulo continuam como estão.
- Design da tela de Gestão do Domus fica pra fase de implementação (proponho paleta atual: cobre suave para botões de ação da Vesta, dourado para o selo "Vesta").

## Próximo passo após aprovação deste modelo

Escolher entre:
- (A) **Ir direto pra Fase 4a** (mock em memória) — recomendado, é onde a UX ganha forma sem gastar créditos com backend.
- (B) Refinar mais o modelo antes de implementar (ex: e se uma Persona pertencer a dois Domus? sucessão de Vesta em caso de ausência? auditoria de mudanças de escopo?).
- (C) Pular pra outro módulo (ex: melhorias nas páginas existentes) e deixar Domus pra depois.
