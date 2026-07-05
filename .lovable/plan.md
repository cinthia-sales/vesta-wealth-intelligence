
## O que ficou para amanhã

Do que combinamos nas últimas rodadas, ainda em aberto:

1. **Badge "2 alertas ativos" travada** (este ajuste — ver abaixo).
2. **Confirmar LCD BRDE FEV/2036 (Cinthia)** — R$106.833 não apareceu no último `PosicaoDetalhada`, precisa checar na XP se aparece em "Posição" e a taxa exata.
3. **Come-cotas XPAG11 (Paulo)** — comparar rentabilidade líquida real vs LCA 92% CDI direta antes de novembro.
4. **BPAC11 (Paulo)** — definir stop loss ou prazo de revisão da tese (-37% sobre PM).
5. **NTN-B AGO/2026 (Paulo)** — decisão do reinvestimento (~R$95k liberam 15/08/2026).
6. **Aporte pontual (PLR/férias)** — já entregue em Breakeven e em Projeção. Se quiser propagar para outra tela, avisar.

Fora isso, Fase 4 (Domus / Personae com login e escopos por Vesta) segue documentada em `.lovable/plan.md`, aguardando decisão de partir para 4a (mock em memória) ou refinar mais o modelo.

## Ajuste desta rodada — badge de alertas dinâmica

**Problema:** em `src/components/vesta/shell.tsx` (linha 444) o texto `2 alertas ativos` está hardcoded. Não muda entre Paulo, Cinthia ou Familiar, nem quando a lista de alertas do usuário cresce ou encolhe.

**Fix:**
- Ler `u.alertas_list` do usuário ativo (`getUser(profileId)`, já disponível no shell).
- Contar quantos são "acionáveis" = severidade `r` (urgente) + `w` (atenção). Positivos (`g`) não somam no badge do header, para não gerar falso alarme.
- Renderizar `{n} alerta ativo` / `{n} alertas ativos` (plural correto). Se zero, mostrar `sem alertas ativos` e opcionalmente aplicar uma variante visual mais neutra (ou deixar o mesmo estilo, decidimos no build).
- Para o perfil `familiar`, `getUser("familiar")` já retorna a lista consolidada — então a mesma expressão funciona sem código extra.

**Escopo:** só o bloco `badge-alert` no header do shell. Não mexe nas páginas de Alertas nem no `alertas_list` de cada usuário.

### Detalhe técnico

```tsx
// dentro do render do shell, onde já temos meta / profileId
const u = getUser(profileId);
const alertasAtivos = u.alertas_list.filter((a) => a.cor === "r" || a.cor === "w").length;
const alertaLabel =
  alertasAtivos === 0 ? "sem alertas ativos"
  : alertasAtivos === 1 ? "1 alerta ativo"
  : `${alertasAtivos} alertas ativos`;
```

E trocar `2 alertas ativos` por `{alertaLabel}`. Se `getUser` ainda não estiver importado no shell, adicionar o import de `@/data/vesta-users`.
