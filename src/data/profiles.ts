// Central profile data source for Vesta.
// Individual profiles (cinthia, paulo) hold ALL of their own data.
// The "familiar" view is DERIVED from the two individuals — never duplicated.

export type Holding = {
  name: string;
  value: number;
  detail?: string;
  klass: "RF" | "RV" | "FII" | "ETF" | "NTN";
  tag?: string;
};

export type Alert = {
  level: "urgent" | "warn" | "ok";
  title: string;
  body: string;
  action?: string;
};

export type Maturity = {
  name: string;
  date: string; // ISO or dd/mm/aaaa (display)
  value: number;
  note?: string;
};

export type IndividualProfile = {
  id: "cinthia" | "paulo";
  name: string;
  subtitle: string;
  accent: string; // css color
  initial: string;
  uploadFolder: string;
  holdings: Holding[];
  alerts: Alert[];
  maturities: Maturity[];
};

export type FamilyProfile = {
  id: "familiar";
  name: "Família";
  subtitle: "Família · Visão consolidada";
  members: IndividualProfile[];
};

export type AnyProfile = IndividualProfile | FamilyProfile;

// ─── DADOS ────────────────────────────────────────────────────────────────

export const CINTHIA: IndividualProfile = {
  id: "cinthia",
  name: "Cinthia",
  subtitle: "Cinthia · Visão individual",
  accent: "#C09090",
  initial: "C",
  uploadFolder: "Cinthia",
  holdings: [
    { name: "LCA SICOOB 89% CDI", value: 222_000, detail: "vence 13/05/2026", klass: "RF" },
    { name: "LCD BRDE FEV/2036", value: 106_833, detail: "92,5% CDI · flutuante 10a", klass: "RF", tag: "verificar" },
    { name: "LCA ORIGINAL 92% CDI", value: 86_186, detail: "vence 25/06/2026", klass: "RF" },
    { name: "LCA SICOOB 92% CDI", value: 19_533, detail: "vence 26/06/2026", klass: "RF" },
  ],
  alerts: [
    {
      level: "warn",
      title: "LCD BRDE FEV/2036 — confirmar posição",
      body: "R$106.833 investidos em 2 tranches (25 e 26/06/2026). Ativo não apareceu no último PosicaoDetalhada — pode ser lag de liquidação.",
      action: "Acessar a XP e confirmar se aparece em 'Posição' e qual é a taxa exata contratada.",
    },
  ],
  maturities: [
    { name: "LCA SICOOB", date: "13/05/2026", value: 222_000 },
    { name: "LCA ORIGINAL", date: "25/06/2026", value: 86_186 },
    { name: "LCA SICOOB", date: "26/06/2026", value: 19_533 },
    { name: "LCD BRDE", date: "01/02/2036", value: 106_833, note: "flutuante" },
  ],
};

export const PAULO: IndividualProfile = {
  id: "paulo",
  name: "Paulo",
  subtitle: "Paulo · Visão individual",
  accent: "#C47050",
  initial: "P",
  uploadFolder: "paulo",
  holdings: [
    // Renda fixa
    { name: "LCA 92% CDI (bloco 1)", value: 37_531, detail: "vence 16/06/2026", klass: "RF" },
    { name: "LCA 92% CDI (bloco 2)", value: 28_225, detail: "vence 16/06/2026", klass: "RF" },
    { name: "LCA 92,5% CDI", value: 26_635, detail: "vence 25/06/2026", klass: "RF" },
    { name: "LCA 92% CDI (bloco 3)", value: 22_361, detail: "vence 16/06/2026", klass: "RF" },
    { name: "LCA 92% CDI (bloco 4)", value: 16_744, detail: "vence 16/06/2026", klass: "RF" },
    { name: "LCA 94% CDI", value: 10_392, detail: "vence 25/06/2026", klass: "RF" },
    { name: "DEB J&F FEV/2028", value: 94_620, detail: "15,15% isento · AAA", klass: "RF", tag: "intocavel" },
    { name: "DEB JALLES DEZ/2031", value: 70_508, detail: "IPCA+8,5% isento", klass: "RF", tag: "intocavel" },
    { name: "NTN-B AGO/2026", value: 95_277, detail: "IPCA+9,45% · vence 15/08/2026", klass: "RF", tag: "urgente" },
    { name: "XPAG11 (FI Crédito Agro)", value: 61_373, detail: "come-cotas mai/nov", klass: "RF", tag: "monitorar" },
    { name: "LCD BRDE (Paulo)", value: 57_646, detail: "valor fixo · vence 29/06/2026", klass: "RF" },
    // NTN Mercado (não projeta)
    { name: "NTN-B 2050 (bloco A)", value: 35_524, detail: "IPCA+4,45% · duration 18a", klass: "NTN", tag: "intocavel" },
    { name: "NTN-B 2050 (bloco B)", value: 15_405, detail: "mercado", klass: "NTN", tag: "intocavel" },
    // Renda variável
    { name: "PSSA3", value: 28_995, detail: "544 ações · PM R$26,95", klass: "RV" },
    { name: "ITSA4", value: 21_149, detail: "1.576 ações · PM R$8,87", klass: "RV" },
    { name: "BPAC11", value: 18_632, detail: "342 ações · PM R$86,85", klass: "RV", tag: "monitorar" },
    { name: "TGRE11", value: 44_155, detail: "aplicado R$50.000", klass: "FII" },
    { name: "LFTB11", value: 20_301, detail: "165 cotas", klass: "ETF" },
    { name: "GOLD11", value: 3_976, detail: "178 cotas", klass: "ETF" },
    { name: "Outras ações", value: 9_392, detail: "ITUB4 + outros", klass: "RV" },
  ],
  alerts: [
    {
      level: "urgent",
      title: "NTN-B AGO/2026 — vence em ~45 dias",
      body: "R$95.277 liberam em 15/08/2026. Maior vencimento próximo da carteira. Deixar em conta corrente é perder CDI todo dia.",
      action: "IPCA+ longo (se taxa > 8,0%/ano), LCA nova 92%+ CDI isenta, ou debênture incentivada nova com risco ≤ 20.",
    },
    {
      level: "warn",
      title: "BPAC11 — −37,27% sobre preço médio",
      body: "Preço médio R$86,85 · Posição atual R$18.632 (342 ações). Ação financeira com alto beta, sofreu com ciclo de alta de juros.",
      action: "Definir um nível de stop loss ou prazo para revisão da tese.",
    },
    {
      level: "warn",
      title: "Come-cotas XPAG11 — verificar antes de novembro",
      body: "XPAG11 tem come-cotas em mai/nov. R$61.373 em posição. Come-cotas corrói o rendimento líquido do fundo.",
      action: "Comparar rentabilidade líquida real vs LCA 92% CDI direta. Se diferença < 1%, vender na oportunidade.",
    },
    {
      level: "ok",
      title: "Debêntures J&F e Jalles — no plano, nada a fazer",
      body: "J&F: 15,15% isento · Fitch AAA · vence fev/2028. Jalles: IPCA+8,5% isento · vence dez/2031.",
      action: "Manter até vencimento (ou até aparecer ágio relevante).",
    },
  ],
  maturities: [
    { name: "LCA 92% CDI (4 blocos)", date: "16/06/2026", value: 37_531 + 28_225 + 22_361 + 16_744 },
    { name: "LCA 92,5% CDI", date: "25/06/2026", value: 26_635 },
    { name: "LCA 94% CDI", date: "25/06/2026", value: 10_392 },
    { name: "LCD BRDE", date: "29/06/2026", value: 57_646 },
    { name: "NTN-B AGO/2026", date: "15/08/2026", value: 95_277, note: "urgente" },
    { name: "DEB J&F", date: "01/02/2028", value: 94_620, note: "intocável" },
    { name: "DEB JALLES", date: "01/12/2031", value: 70_508, note: "intocável" },
  ],
};

export const FAMILIAR: FamilyProfile = {
  id: "familiar",
  name: "Família",
  subtitle: "Família · Visão consolidada",
  members: [CINTHIA, PAULO],
};

export const PROFILES = { cinthia: CINTHIA, paulo: PAULO, familiar: FAMILIAR };
export type ProfileId = keyof typeof PROFILES;

// ─── DERIVADOS ────────────────────────────────────────────────────────────

export function totalsOf(p: IndividualProfile) {
  const rf = p.holdings.filter((h) => h.klass === "RF" || h.klass === "NTN").reduce((s, h) => s + h.value, 0);
  const rv = p.holdings.filter((h) => h.klass !== "RF" && h.klass !== "NTN").reduce((s, h) => s + h.value, 0);
  return { rf, rv, total: rf + rv };
}

export function familyTotals(f: FamilyProfile) {
  return f.members.reduce(
    (acc, m) => {
      const t = totalsOf(m);
      return { rf: acc.rf + t.rf, rv: acc.rv + t.rv, total: acc.total + t.total };
    },
    { rf: 0, rv: 0, total: 0 },
  );
}

export function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}
