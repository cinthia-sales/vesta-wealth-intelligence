import type { KnownProfileId, ProfileId } from "@/lib/profile-derive";

export type Status = "intocavel" | "urgente" | "monitorar" | "estrategico" | "planejar";

export type RFAtivo = {
  n: string;
  v: number;
  t: number | null;
  cdi: number | null;
  venc: string;
  s: Status;
  nota?: string;
};

export type LocalSnapshot = {
  profileId: string; // "paulo" | "cinthia" | UUID para membros externos
  data_referencia: string; // "YYYY-MM-DD"
  saved_at: string;        // ISO timestamp
  nome?: string;
  conta?: string;
  saudacao?: string;
  topbar_sub?: string;
  kpi4_label?: string;
  kpi4_val?: string;
  kpi4_value?: string;
  kpi4_sub?: string;
  donut_data?: number[];
  donut_labels?: string[];
  donut_colors?: string[];
  total: number;
  rf: number;
  rv: number;
  rf_ativos: RFAtivo[];
  rv_ativos?: UserData["rv_ativos"];
  alertas_list?: UserData["alertas_list"];
  vencimentos?: UserData["vencimentos"];
  resumo?: UserData["resumo"];
  proventos?: {
    ticker: string;
    classe: "Ação" | "FII" | "FI-Agro" | "ETF";
    valor_posicao: number;
    provento_mes: number;
    evento?: string;
    data_pagamento?: string;
  }[];
};

export const STORAGE_KEYS = {
  paulo: "vesta_posicao_paulo",
  cinthia: "vesta_posicao_cinthia",
} as const;

function importedRFStatus(a: RFAtivo): { badge: string; bc: string } {
  const nota = a.nota ?? "";
  const notaPct = Number(nota.replace(/[^\d,.-]/g, "").replace(",", "."));
  if (/taxa xp|taxa|administra/i.test(nota) && Number.isFinite(notaPct) && notaPct > 2) return { badge: "urgente", bc: "sb-r" };
  if (/FIF|FIC|FIDC|Fundo|Riza/i.test(a.n) && /taxa xp|taxa|administra/i.test(nota)) return { badge: "urgente", bc: "sb-r" };
  if (typeof a.cdi === "number") {
    if (a.cdi < 90) return { badge: "urgente", bc: "sb-r" };
    if (a.cdi < 95) return { badge: "monitorar", bc: "sb-w" };
    return { badge: "intocável", bc: "sb-a" };
  }
  if (/LFT|Tesouro|NTN-B|LTN/i.test(a.n)) return { badge: "monitorar", bc: "sb-w" };
  if (typeof a.t === "number") {
    if (a.t < 13.3) return { badge: "urgente", bc: "sb-r" };
    if (a.t < 14.5) return { badge: "monitorar", bc: "sb-w" };
    return { badge: "intocável", bc: "sb-a" };
  }
  if (a.s === "urgente") return { badge: "urgente", bc: "sb-r" };
  if (a.s === "monitorar" || a.s === "planejar") return { badge: "monitorar", bc: "sb-w" };
  return { badge: "intocável", bc: "sb-a" };
}

export type UserData = {
  nome: string;
  conta: string;
  total: number;
  rf: number;
  rv: number;
  rf_pct: number;
  rv_pct: number;
  saudacao: string;
  topbar_sub: string;
  kpi4_label: string;
  kpi4_val: string;
  kpi4_sub: string;
  donut_data: number[];
  donut_labels: string[];
  donut_colors: string[];
  rf_ativos: RFAtivo[];
  rv_ativos?: {
    n: string;
    v: string;
    pm: string;
    r: string;
    rc: string;
    cls: string;
    sb: string;
    retorno_posicao?: string;
    retorno_fundo_historico?: string;
    come_cotas_aviso?: string;
  }[];
  alertas_list: { cor: "r" | "w" | "g"; titulo: string; det: string }[];
  vencimentos: { icon: string; bg: string; nome: string; det: string; badge: string; bc: string }[];
  resumo: { dot: "r" | "w" | "g"; nome: string; det: string }[];
  data_referencia: string;
};

// Fonte: PosicaoDetalhada_02-07.xlsx (conta 5296823) · Total R$712.325,21 em 02/07/2026
const PAULO: UserData = {
  nome: "Paulo Henrique",
  conta: "XP 5296823",
  total: 845047, // Fonte: prints XP 21/07/2026 19h53 · 36 ativos R$843.280 + proventos R$1.488 + saldo conta R$279
  rf: 615199,
  rv: 228081,
  rf_pct: 72.8,
  rv_pct: 27.0,
  saudacao: "Cinthia, você está gerenciando a carteira do Paulo.",
  topbar_sub: "Carteira Paulo sob gestão · Conta XP 5296823",
  kpi4_label: "Breakeven do plano",
  kpi4_val: "mai/2028",
  kpi4_sub: "22 meses · +R$ 692/mês",
  data_referencia: "2026-07-21",
  // Donut por classe (prints XP 21/07): RF Inflação 244.519 · RF Pós-fix (LCAs) 275.158 · RF Prefixado (J&F) 95.523 · XPAG 61.754 · TGRE 43.529 · Ações 93.968 · ETFs/Global 28.830
  donut_data: [244519, 275158, 95523, 61754, 43529, 93968, 28830],
  donut_labels: [
    "RF Inflação (NTN-B + Jalles)",
    "RF Pós-fixado (LCAs)",
    "RF Prefixado (DEB J&F)",
    "XPAG11 Crédito Agro",
    "TGRE11 Real Estate",
    "Ações Brasil",
    "ETFs + Global + Ouro",
  ],
  donut_colors: ["#A11D3E", "#4E7A5C", "#D97706", "#3E5E7A", "#B8546E", "#7A1530", "#5C2B4E"],
  rf_ativos: [
    { n: "LCA ORIGINAL NOV/2027", v: 102566, t: 13.87, cdi: 108.4, venc: "11/2027", s: "intocavel", nota: "Taxa a confirmar no detalhe XP · maior posição RF" },
    { n: "NTN-B AGO/2026 (IPCA+9,45%)", v: 96967, t: 15.47, cdi: 120.7, venc: "15/08/2026", s: "urgente" },
    { n: "DEB ER ATIVO J&F FEV/2028 (+15,15%)", v: 91324, t: 15.15, cdi: 118.4, venc: "21/02/2028", s: "intocavel", nota: "Lote principal · 87 debêntures" },
    { n: "DEB JALLES MACHADO DEZ/2031 (IPCA+8,5%)", v: 70944, t: 14.47, cdi: 113.0, venc: "15/12/2031", s: "intocavel" },
    { n: "NTN-B AGO/2050 (IPCA+4,45%)", v: 53464, t: 8.55, cdi: 66.8, venc: "15/08/2050", s: "estrategico", nota: "Aplicada em 09/2021 · nunca vender com deságio" },
    { n: "LCA SICOOB MAR/2030 (92% CDI)", v: 37988, t: 13.57, cdi: 106.1, venc: "21/03/2030", s: "intocavel" },
    { n: "LCA SICOOB ABR/2030 (92% CDI · 24 títulos)", v: 28569, t: 13.57, cdi: 106.1, venc: "04/04/2030", s: "intocavel" },
    { n: "LCA ORIGINAL DEZ/2028 (92,5% CDI)", v: 26869, t: 13.61, cdi: 106.5, venc: "18/12/2028", s: "intocavel" },
    { n: "NTN-B AGO/2050 (IPCA+4,65%)", v: 23144, t: 8.74, cdi: 68.3, venc: "15/08/2050", s: "estrategico", nota: "Aplicada em 10/2021 · nunca vender com deságio" },
    { n: "LCA SICOOB MAI/2030 (92% CDI)", v: 22633, t: 13.57, cdi: 106.1, venc: "10/05/2030", s: "intocavel" },
    { n: "LCA ORIGINAL MAR/2030 (lote maior)", v: 17750, t: 13.87, cdi: 108.4, venc: "03/2030", s: "intocavel", nota: "Taxa a confirmar no detalhe XP" },
    { n: "LCA SICOOB ABR/2030 (92% CDI · 14 títulos)", v: 16948, t: 13.57, cdi: 106.1, venc: "15/04/2030", s: "intocavel" },
    { n: "LCA ORIGINAL MAR/2030 (94% CDI)", v: 10485, t: 13.87, cdi: 108.4, venc: "06/03/2030", s: "intocavel" },
    { n: "LCA ORIGINAL ABR/2030", v: 10309, t: 13.87, cdi: 108.4, venc: "04/2030", s: "intocavel", nota: "Taxa a confirmar no detalhe XP" },
    { n: "DEB ER ATIVO J&F FEV/2028 (+15,15% · lote 2)", v: 3149, t: 15.15, cdi: 118.4, venc: "21/02/2028", s: "intocavel" },
    { n: "DEB ER ATIVO J&F FEV/2028 (+15,15% · lote 3)", v: 1050, t: 15.15, cdi: 118.4, venc: "21/02/2028", s: "intocavel" },
    { n: "LCA ORIGINAL MAR/2030 (lote menor)", v: 1039, t: 13.87, cdi: 108.4, venc: "03/2030", s: "intocavel", nota: "Taxa a confirmar no detalhe XP" },
  ],
  rv_ativos: [
    // Ações Brasil — valores prints XP 21/07/2026; r recalculado mantendo a quantidade conhecida
    { n: "PSSA3", v: "R$ 29.093", pm: "R$26,95 · 544 ações", r: "+98,4%", rc: "good", cls: "ação", sb: "sb-g" },
    { n: "ITSA4", v: "R$ 21.465", pm: "R$8,87 · 1.576 ações", r: "+53,6%", rc: "good", cls: "ação", sb: "sb-g" },
    { n: "BPAC11", v: "R$ 18.937", pm: "R$86,85 · 342 ações", r: "-36,2% ⚠️", rc: "bad", cls: "ação", sb: "sb-r" },
    { n: "CXSE3", v: "R$ 4.466", pm: "R$19,50 · qtd a confirmar", r: "—", rc: "muted", cls: "ação", sb: "sb-n" },
    { n: "ITUB4", v: "R$ 3.360", pm: "R$40,81 · 70 ações", r: "+17,6%", rc: "good", cls: "ação", sb: "sb-g" },
    { n: "ABEV3", v: "R$ 3.207", pm: "R$16,29 · 170 ações", r: "+15,8%", rc: "good", cls: "ação", sb: "sb-g" },
    { n: "GGBR4", v: "R$ 3.171", pm: "R$21,80 · 132 ações", r: "+10,2%", rc: "good", cls: "ação", sb: "sb-g" },
    { n: "PRIO3", v: "R$ 2.560", pm: "R$56,67 · 40 ações", r: "+12,9%", rc: "good", cls: "ação", sb: "sb-g" },
    { n: "ORVR3", v: "R$ 2.471", pm: "R$75,71 · 37 ações", r: "-11,8%", rc: "bad", cls: "ação", sb: "sb-w" },
    { n: "RENT3", v: "R$ 2.010", pm: "R$40,89 · 42 ações", r: "+17,0%", rc: "good", cls: "ação", sb: "sb-g" },
    { n: "TEND3", v: "R$ 1.808", pm: "novo · PM a informar", r: "—", rc: "muted", cls: "ação", sb: "sb-n" },
    { n: "MDNE3", v: "R$ 1.419", pm: "novo · PM a informar", r: "—", rc: "muted", cls: "ação", sb: "sb-n" },
    // FII / Fundos listados
    { n: "TGRE11 (TG Real Estate)", v: "R$ 43.529", pm: "Aplicado R$50.000", r: "-12,9% capital", rc: "bad", cls: "FII", sb: "sb-w" },
    { n: "XPAG11 (XP Crédito Agro)", v: "R$ 61.754", pm: "Aplicado R$62.000", r: "-0,4%", rc: "bad", cls: "FI", sb: "sb-a", retorno_posicao: "-0,4%", retorno_fundo_historico: "+42,94%", come_cotas_aviso: "⚠️ Come-cotas novembro" },
    // ETFs
    { n: "LFTB11 (ETF Tesouro)", v: "R$ 16.989", pm: "posição reduzida · reimportar", r: "—", rc: "muted", cls: "ETF", sb: "sb-a" },
    { n: "IVVB11 (S&P 500)", v: "R$ 4.731", pm: "R$433,15 · 9 cotas", r: "+21,4%", rc: "good", cls: "ETF", sb: "sb-a" },
    { n: "GOLD11 (Ouro)", v: "R$ 3.859", pm: "R$22,33 · 178 cotas", r: "-2,9%", rc: "bad", cls: "ETF", sb: "sb-w" },
    { n: "NASD11 (Nasdaq)", v: "R$ 3.250", pm: "R$21,70 · 130 cotas", r: "+15,2%", rc: "good", cls: "ETF", sb: "sb-a" },
  ],
  alertas_list: [
    { cor: "r", titulo: "NTN-B AGO/2026 â€” vence em 45 dias", det: "R$96.967 liberam em 15/08. Decidir destino AGORA." },
    { cor: "w", titulo: "BPAC11 â€” -36,2% sobre preÃ§o médio", det: "R$18.937 · PM R$86,85 vs R$55,37. Revisar tese ou stop." },
    { cor: "w", titulo: "TGRE11 â€” -12,9% sobre capital aplicado", det: "Aplicou R$50.000 · vale R$43.529. Fundo listado sob pressão." },
    { cor: "g", titulo: "Proventos previstos julâ€“dez/2026", det: "R$1.520 provisionados (PSSA3, ITSA4, ABEV3, B3SA3 etc.)." },
  ],
  vencimentos: [
    { icon: "ðŸ”´", bg: "var(--danger-bg)", nome: "NTN-B AGO/2026", det: "R$96.967 · 15/08/2026 · 45 dias", badge: "urgente", bc: "sb-r" },
    { icon: "ðŸ”’", bg: "rgba(196,126,58,.1)", nome: "DEB J&F FEV/2028 (3 lotes)", det: "R$95.523 · 21/02/2028 · +15,15% isento", badge: "intocável", bc: "sb-a" },
    { icon: "ðŸ”’", bg: "rgba(196,126,58,.1)", nome: "LCA ORIGINAL DEZ/2028", det: "R$26.869 · 18/12/2028 · 92,5% CDI", badge: "intocável", bc: "sb-a" },
    { icon: "ðŸ”’", bg: "rgba(196,126,58,.1)", nome: "LCAs SICOOB 2030 (×4)", det: "R$106.139 · marâ€“mai/2030 · 92% CDI", badge: "intocável", bc: "sb-a" },
    { icon: "ðŸ”’", bg: "rgba(74,124,89,.12)", nome: "DEB JALLES DEZ/2031", det: "R$70.944 · 15/12/2031 · IPCA+8,5%", badge: "intocável", bc: "sb-a" },
  ],
  resumo: [
    { dot: "w", nome: "Reestruturação jun/26", det: "Custo R$14.698 · ganho +R$692/mês · recupera mai/2028" },
    { dot: "g", nome: "Taxa média subiu 11,81% â†’ 14,86%", det: "+3,05%/ano · R$285/mês das debêntures novas" },
    { dot: "g", nome: "5 blocos intocáveis (RF)", det: "J&F · Jalles · LCAs SICOOB · LCA Original · NTN-B 2050" },
    { dot: "w", nome: "RV concentrada em 3 posições", det: "PSSA3 + ITSA4 + BPAC11 = 60% das ações · rebalancear?" },
  ],
};

const CINTHIA: UserData = {
  nome: "Cínthia",
  conta: "XP 6414212",
  total: 509718,
  rf: 509718,
  rv: 0,
  rf_pct: 100,
  rv_pct: 0,
  data_referencia: "2026-07-14",
  saudacao: "Esta é a sua carteira, Cínthia. Posição em 14/07/2026.",
  topbar_sub: "Carteira Cínthia · Conta XP 6414212",
  kpi4_label: "LCA Out/26 vence em",
  kpi4_val: "out/2026",
  kpi4_sub: "R$4.884 · ~3 meses · reinvestir",
  donut_data: [86733, 107482, 69199, 68593, 60279, 54663, 31906, 21407],
  donut_labels: [
    "LCA Bocom BBM out/30 (92,7% CDI)",
    "LCD BRDE fev/36 (92,5% CDI)",
    "DEB Tereos jun/27 (IPCA+11,55%)",
    "DEB J&F fev/28 lote 1 (15,15%)",
    "DEB J&F fev/28 lote 2 (15,15%)",
    "LCA Original mai-mar (93-95% CDI)",
    "LCA Original abr/30 lote 2 (95% CDI)",
    "LCA Original mai/29 lote 1 (93% CDI)",
  ],
  donut_colors: ["#A11D3E", "#C0392B", "#4E7A5C", "#B8546E", "#3E5E7A", "#7A4E3E", "#5C7A4E", "#7A7A3E"],
  rf_ativos: [
    { n: "LCA BANCO BOCOM BBM OUT/2030 (92,70% CDI)", v: 86733, t: 13.68, cdi: 92.7, venc: "21/10/2030", s: "monitorar", nota: "92,7% CDI isento · banco menor, checar rating" },
    { n: "LCD BRDE FEV/2036 lote 1 (92,50% CDI)", v: 57956, t: 13.64, cdi: 92.5, venc: "11/02/2036", s: "monitorar", nota: "⚠ Taxa flutuante trancada 10 anos" },
    { n: "LCD BRDE FEV/2036 lote 2 (92,50% CDI)", v: 49526, t: 13.64, cdi: 92.5, venc: "11/02/2036", s: "monitorar", nota: "⚠ Taxa flutuante trancada 10 anos" },
    { n: "DEB TEREOS JUN/2027 (IPCA+11,55%)", v: 69199, t: 16.19, cdi: null, venc: "30/06/2027", s: "intocavel", nota: "IPCA+11,55% · vence jun/2027" },
    { n: "DEB ER ATIVO J&F FEV/2028 lote 1 (15,15%)", v: 68593, t: 15.15, cdi: null, venc: "28/02/2028", s: "intocavel", nota: "Prefixado 15,15% · J&F" },
    { n: "DEB ER ATIVO J&F FEV/2028 lote 2 (15,15%)", v: 60279, t: 15.15, cdi: null, venc: "28/02/2028", s: "intocavel", nota: "Prefixado 15,15% · J&F" },
    { n: "LCA ORIGINAL ABR/2030 lote 1 (94,00% CDI)", v: 19649, t: 13.87, cdi: 94.0, venc: "08/04/2030", s: "intocavel", nota: "94% CDI isento" },
    { n: "LCA ORIGINAL ABR/2030 lote 2 (95,00% CDI)", v: 31906, t: 14.02, cdi: 95.0, venc: "08/04/2030", s: "intocavel", nota: "95% CDI isento" },
    { n: "LCA ORIGINAL ABR/2030 lote 3 (95,00% CDI)", v: 3080, t: 14.02, cdi: 95.0, venc: "08/04/2030", s: "intocavel", nota: "95% CDI isento" },
    { n: "LCA ORIGINAL MAI/2029 lote 1 (93,00% CDI)", v: 21407, t: 13.74, cdi: 93.0, venc: "23/05/2029", s: "intocavel", nota: "93% CDI isento" },
    { n: "LCA ORIGINAL MAI/2029 lote 2 (95,00% CDI)", v: 15274, t: 14.02, cdi: 95.0, venc: "23/05/2029", s: "intocavel", nota: "95% CDI isento" },
    { n: "LCA ORIGINAL MAR/2030 (94,00% CDI)", v: 16640, t: 13.87, cdi: 94.0, venc: "06/03/2030", s: "intocavel", nota: "94% CDI isento" },
    { n: "LCA ORIGINAL MAI/2028 (94,00% CDI)", v: 3074, t: 13.87, cdi: 94.0, venc: "23/05/2028", s: "intocavel", nota: "94% CDI isento" },
    { n: "LCA ORIGINAL OUT/2026 (94,00% CDI)", v: 4884, t: 13.87, cdi: 94.0, venc: "23/10/2026", s: "planejar", nota: "94% CDI isento · vence out/2026 · planejar reinvestimento" },
    { n: "LCD BRDE MAI/2030 (93,50% CDI)", v: 1158, t: 13.79, cdi: 93.5, venc: "23/05/2030", s: "monitorar", nota: "Resíduo · 1 título" },
  ],
  alertas_list: [
    { cor: "w", titulo: "LCA Original out/2026 — vence em outubro", det: "R$4.884 liberam em ~3 meses. Planejar reinvestimento urgente." },
    { cor: "r", titulo: "LCD BRDE FEV/2036 — taxa flutuante por 10 anos", det: "R$107.482 (2 lotes) a 92,5% CDI trancados até 2036. Quando Selic cair, rende menos sem saída." },
    { cor: "w", titulo: "LCA Bocom BBM — banco menor, checar rating", det: "R$86.733 a 92,7% CDI · confirmar rating do Bocom BBM." },
    { cor: "g", titulo: "DEB J&F fev/2028 — prefixado 15,15%", det: "R$128.872 (2 lotes) prefixados a 15,15% — excelente taxa trancada até 2028." },
  ],
  vencimentos: [
    { icon: "", bg: "var(--warning-bg)", nome: "LCA Original OUT/2026", det: "R$4.884 · 23/10/2026 · 94% CDI · reinvestir", badge: "planejar", bc: "sb-w" },
    { icon: "", bg: "rgba(74,124,89,.12)", nome: "DEB Tereos JUN/2027", det: "R$69.199 · 30/06/2027 · IPCA+11,55%", badge: "intocável", bc: "sb-a" },
    { icon: "", bg: "rgba(74,124,89,.12)", nome: "DEB J&F FEV/2028 (2 lotes)", det: "R$128.872 · 28/02/2028 · 15,15% pré", badge: "intocável", bc: "sb-a" },
    { icon: "", bg: "rgba(74,124,89,.12)", nome: "LCAs Original MAI/2029 (×2)", det: "R$36.681 · 23/05/2029 · 93-95% CDI", badge: "intocável", bc: "sb-a" },
    { icon: "", bg: "rgba(196,126,58,.1)", nome: "LCD BRDE FEV/2036 (×2)", det: "R$107.482 · 11/02/2036 · 92,5% CDI flutuante", badge: "monitorar", bc: "sb-r" },
  ],
  resumo: [
    { dot: "r", nome: "LCD BRDE FEV/2036 — risco de longo prazo", det: "R$107.482 (2 lotes) em taxa flutuante até 2036. Quando Selic cair, rende menos sem saída." },
    { dot: "g", nome: "DEB J&F FEV/2028 — prefixado 15,15%", det: "R$128.872 (2 lotes) prefixados a 15,15% — excelente taxa trancada até 2028." },
    { dot: "g", nome: "DEB Tereos — IPCA+11,55% com vencimento curto", det: "R$69.199 vence jun/2027 · alta taxa de inflação garantida por ~1 ano." },
    { dot: "w", nome: "LCA Original OUT/2026 vence em outubro", det: "R$4.884 liberam em ~3 meses — planejar reinvestimento urgente." },
  ],

};

function buildFamiliar(paulo: UserData = PAULO, cinthia: UserData = CINTHIA): UserData {
  const total = paulo.total + cinthia.total;
  const rf = paulo.rf + cinthia.rf;
  const rv = paulo.rv + cinthia.rv;
  const donut_data = [
    paulo.rf_ativos.filter((x) => /LCA|LCI/i.test(x.n) && !/LCD/i.test(x.n)).reduce((s, x) => s + x.v, 0)
      + cinthia.rf_ativos.filter((x) => /LCI|LCA/i.test(x.n) && !/LCD/i.test(x.n)).reduce((s, x) => s + x.v, 0),
    paulo.rf_ativos.filter((x) => /NTN-B|IPCA|Jalles/i.test(x.n)).reduce((s, x) => s + x.v, 0),
    paulo.rf_ativos.filter((x) => /DEB|J&F/i.test(x.n) && !/Jalles/i.test(x.n)).reduce((s, x) => s + x.v, 0),
    cinthia.rf_ativos.filter((x) => /LCD/i.test(x.n)).reduce((s, x) => s + x.v, 0) + 61000,
    rv,
  ];
  const dataRef = paulo.data_referencia >= cinthia.data_referencia
    ? paulo.data_referencia
    : cinthia.data_referencia;
  return {
    nome: "Família Furtado",
    conta: "Consolidado Paulo + Cinthia",
    total,
    rf,
    rv,
    rf_pct: (rf / total) * 100,
    rv_pct: (rv / total) * 100,
    saudacao: "Vesta personificada, segue visão consolidada da família.",
    topbar_sub: "Visão familiar · Cínthia como gestora",
    kpi4_label: "Breakeven do plano",
    kpi4_val: "mai/2028",
    kpi4_sub: "22 meses · +R$ 692/mês",
    donut_data,
    donut_labels: ["LCA/LCI pós-fix.", "Inflação IPCA+", "Prefixado isento", "Agro + LCD flut.", "Renda variável"],
    donut_colors: ["#A11D3E", "#4E7A5C", "#B8546E", "#D97706", "#3E5E7A"],
    rf_ativos: [
      ...paulo.rf_ativos.map((x) => ({ ...x, n: `[Paulo] ${x.n}` })),
      ...cinthia.rf_ativos.map((x) => ({ ...x, n: `[Cinthia] ${x.n}` })),
    ],
    rv_ativos: paulo.rv_ativos,
    alertas_list: [
      ...paulo.alertas_list.map((a) => ({ ...a, titulo: `[Paulo] ${a.titulo}` })),
      ...cinthia.alertas_list.map((a) => ({ ...a, titulo: `[Cinthia] ${a.titulo}` })),
    ],
    vencimentos: [
      ...paulo.vencimentos.map((v) => ({ ...v, nome: `[Paulo] ${v.nome}` })),
      ...cinthia.vencimentos.map((v) => ({ ...v, nome: `[Cinthia] ${v.nome}` })),
    ],
    resumo: [
      { dot: "w", nome: "Reestruturação jun/26 (Paulo)", det: "Custo R$14.698 · ganho +R$692/mês · recupera mai/2028" },
      { dot: "g", nome: "Cinthia: LCI XP vence mai/2027", det: "R$222k livram em ~10 meses â€” travar IPCA+8%+ ou pré 14%+." },
      { dot: "r", nome: "Cinthia: LCD BRDE FEV/2036", det: "R$106k a taxa flutuante trancada por 10 anos." },
      { dot: "g", nome: "4 blocos intocáveis (Paulo)", det: "J&F · Jalles · LCAs · NTN-B 2050 até mai/2028." },
    ],
    data_referencia: dataRef,
  };
}

function mergeSnapshot(base: UserData, snap: LocalSnapshot): UserData {
  const { total, rf, rv } = snap;
  const topRF = snap.rf_ativos?.slice().sort((a, b) => b.v - a.v)[0];
  const parseValor = (value: string) => Number(String(value).replace(/[^\d,-]/g, "").replace(".", "").replace(",", ".")) || 0;
  const topRV = snap.rv_ativos?.slice().sort((a, b) => parseValor(b.v) - parseValor(a.v))[0];
  const proventosMes = Math.round(snap.proventos?.reduce((s, p) => s + p.provento_mes, 0) ?? 0);
  const snapKpiValue = snap.kpi4_val ?? snap.kpi4_value;
  const importedStatusLabel = proventosMes > 0 ? "Pingados/mês" : "Status";
  const importedStatusValue = proventosMes > 0 ? `R$ ${proventosMes.toLocaleString("pt-BR")}` : "em análise";
  const importedStatusSub = proventosMes > 0
    ? `${snap.proventos?.length ?? 0} pagadores recorrentes`
    : `${snap.rf_ativos?.length ?? 0} ativos RF · ${snap.rv_ativos?.length ?? 0} RV`;
  const alertasImportados: UserData["alertas_list"] = snap.alertas_list ?? [
    ...(topRF ? [{ cor: "w" as const, titulo: `${topRF.n} concentra a renda fixa`, det: `R$ ${Math.round(topRF.v).toLocaleString("pt-BR")} · revisar taxa, liquidez e alternativa de baixo risco.` }] : []),
    ...(topRV ? [{ cor: topRV.rc === "bad" ? "r" as const : "w" as const, titulo: `${topRV.n} pede raio-X`, det: `${topRV.v} · ${topRV.r} · comparar rendimento, risco de cota e custo de oportunidade.` }] : []),
    ...(proventosMes > 0 ? [{ cor: "g" as const, titulo: "Pingados identificados", det: `R$ ${proventosMes.toLocaleString("pt-BR")}/mês em ${snap.proventos?.length ?? 0} pagadores.` }] : []),
  ];
  const resumoImportado: UserData["resumo"] = [
    { nome: `Patrimônio total de R$ ${Math.round(total).toLocaleString("pt-BR")}`, det: `${total > 0 ? ((rf / total) * 100).toFixed(1) : "0.0"}% em renda fixa · ${total > 0 ? ((rv / total) * 100).toFixed(1) : "0.0"}% em FIIs/RV`, dot: "g" },
    ...(topRF ? [{ nome: `${topRF.n} é o maior bloco`, det: `R$ ${Math.round(topRF.v).toLocaleString("pt-BR")} · ${topRF.nota ?? topRF.venc ?? "monitorar oportunidade de troca"}`, dot: topRF.s === "urgente" ? "r" as const : "w" as const }] : []),
    ...(topRV ? [{ nome: `${topRV.n} lidera a parte listada`, det: `${topRV.v} · ${topRV.r} · ${topRV.cls}`, dot: topRV.rc === "bad" ? "r" as const : "w" as const }] : []),
    ...(proventosMes > 0 ? [{ nome: "Rendimentos recorrentes mapeados", det: `R$ ${proventosMes.toLocaleString("pt-BR")}/mês · ${snap.proventos?.length ?? 0} pagadores`, dot: "g" as const }] : []),
    ...(snap.alertas_list?.slice(0, 1).map((a) => ({ nome: a.titulo, det: a.det, dot: a.cor })) ?? []),
  ];
  const resumo = Array.isArray(snap.resumo) ? snap.resumo : resumoImportado;
  return {
    ...base,
    nome: snap.nome ?? base.nome,
    conta: snap.conta ?? base.conta,
    total,
    rf,
    rv,
    rf_pct: total > 0 ? (rf / total) * 100 : 0,
    rv_pct: total > 0 ? (rv / total) * 100 : 0,
    saudacao: snap.saudacao ?? base.saudacao,
    topbar_sub: snap.topbar_sub ?? base.topbar_sub,
    kpi4_label: snap.kpi4_label && snap.kpi4_label !== "Status" ? snap.kpi4_label : importedStatusLabel,
    kpi4_val: snapKpiValue && snapKpiValue !== "em branco" ? snapKpiValue : importedStatusValue,
    kpi4_sub: snap.kpi4_sub && !/aguardando/i.test(snap.kpi4_sub) ? snap.kpi4_sub : importedStatusSub,
    donut_data: (() => {
      // Se o snapshot só tem 2 blobs genéricos [rf, rv], ignora e regenera
      const snapIsGeneric2Blob = snap.donut_data?.length === 2;
      const useSnap = snap.donut_data && !snapIsGeneric2Blob;
      if (useSnap) return snap.donut_data!;
      if (total <= 0) return base.donut_data;
      const rvPct = total > 0 ? rv / total : 0;
      // RV domina (>70%): quebra por posições RV individuais + blob RF
      if (rvPct > 0.7 && (snap.rv_ativos?.length ?? 0) > 0) {
        const sorted = [...(snap.rv_ativos ?? [])].sort((a, b) => parseValor(String(b.v)) - parseValor(String(a.v)));
        const top = sorted.slice(0, 6);
        const restVal = sorted.slice(6).reduce((s, a) => s + parseValor(String(a.v)), 0);
        return [...top.map(a => parseValor(String(a.v))), ...(rf > 0 ? [rf] : []), ...(restVal > 0 ? [restVal] : [])];
      }
      // RF domina (>=50%): quebra por ativos RF individuais + blob RV
      if (rvPct < 0.5 && (snap.rf_ativos?.length ?? 0) > 0) {
        const sorted = [...(snap.rf_ativos ?? [])].sort((a, b) => b.v - a.v);
        const top = sorted.slice(0, 7);
        const restVal = sorted.slice(7).reduce((s, a) => s + a.v, 0);
        return [...top.map(a => a.v), ...(rv > 0 ? [rv] : []), ...(restVal > 0 ? [restVal] : [])];
      }
      return rv > 0 ? [rf, rv] : [rf];
    })(),
    donut_labels: (() => {
      const snapIsGeneric2Blob = snap.donut_labels?.length === 2;
      const useSnap = snap.donut_labels && !snapIsGeneric2Blob;
      if (useSnap) return snap.donut_labels!;
      if (total <= 0) return base.donut_labels;
      const rvPct = total > 0 ? rv / total : 0;
      if (rvPct > 0.7 && (snap.rv_ativos?.length ?? 0) > 0) {
        const sorted = [...(snap.rv_ativos ?? [])].sort((a, b) => parseValor(String(b.v)) - parseValor(String(a.v)));
        const top = sorted.slice(0, 6);
        const restVal = sorted.slice(6).reduce((s, a) => s + parseValor(String(a.v)), 0);
        return [...top.map(a => String(a.n ?? "").split(" ")[0].replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()), ...(rf > 0 ? ["RF"] : []), ...(restVal > 0 ? ["Demais"] : [])];
      }
      if (rvPct < 0.5 && (snap.rf_ativos?.length ?? 0) > 0) {
        const sorted = [...(snap.rf_ativos ?? [])].sort((a, b) => b.v - a.v);
        const top = sorted.slice(0, 7);
        const restVal = sorted.slice(7).reduce((s, a) => s + a.v, 0);
        // Label curto: pega a primeira palavra após qualificadores (LCA, LCD, DEB, CDB...)
        const shortLabel = (n: string) => {
          const parts = n.replace(/\[.*?\]/g, "").trim().split(/\s+/);
          // ex: "LCA Bocom BBM out/30" → "LCA Bocom"
          return parts.slice(0, 2).join(" ").slice(0, 12);
        };
        return [...top.map(a => shortLabel(String(a.n ?? ""))), ...(rv > 0 ? ["RV"] : []), ...(restVal > 0 ? ["Demais RF"] : [])];
      }
      return rv > 0 ? ["Renda fixa", "Renda variável"] : ["Renda fixa"];
    })(),
    donut_colors: (() => {
      const snapIsGeneric2Blob = snap.donut_colors?.length === 2;
      const useSnap = snap.donut_colors && !snapIsGeneric2Blob;
      if (useSnap) return snap.donut_colors!;
      if (total <= 0) return base.donut_colors;
      const rvPct = total > 0 ? rv / total : 0;
      if (rvPct > 0.7 && (snap.rv_ativos?.length ?? 0) > 0) {
        const sorted = [...(snap.rv_ativos ?? [])].sort((a, b) => parseValor(String(b.v)) - parseValor(String(a.v)));
        const top = sorted.slice(0, 6);
        const restVal = sorted.slice(6).reduce((s, a) => s + parseValor(String(a.v)), 0);
        const palette = ["#3E5E7A","#2A7A6B","#5E3E7A","#7A5E3E","#3E7A5E","#7A3E5E","#8BB8CC"];
        return [...top.map((_, i) => palette[i] ?? palette[palette.length - 1]), ...(rf > 0 ? ["#A11D3E"] : []), ...(restVal > 0 ? ["#A0B0C0"] : [])];
      }
      if (rvPct < 0.5 && (snap.rf_ativos?.length ?? 0) > 0) {
        const sorted = [...(snap.rf_ativos ?? [])].sort((a, b) => b.v - a.v);
        const top = sorted.slice(0, 7);
        const restVal = sorted.slice(7).reduce((s, a) => s + a.v, 0);
        const palette = ["#A11D3E","#C4783A","#7A3A5E","#5E3A7A","#3A5E7A","#2A7A6B","#7A5E3A","#8B6A4A","#4A6B8B"];
        return [...top.map((_, i) => palette[i] ?? palette[palette.length - 1]), ...(rv > 0 ? ["#3E5E7A"] : []), ...(restVal > 0 ? ["#A0B0C0"] : [])];
      }
      return rv > 0 ? ["#A11D3E", "#3E5E7A"] : ["#A11D3E"];
    })(),
    rf_ativos: snap.rf_ativos,
    rv_ativos: snap.rv_ativos ?? base.rv_ativos,
    alertas_list: alertasImportados.length > 0 ? alertasImportados : base.alertas_list,
    vencimentos: (snap.vencimentos?.map((v) => ({
      ...v,
      icon: v.icon === "??" || /ð|�/.test(v.icon) ? "" : v.icon,
    }))) ?? (snap.rf_ativos?.filter(a => a.venc).map(a => {
      const status = importedRFStatus(a);
      return {
        nome: a.n,
        det: `R$ ${Math.round(a.v).toLocaleString("pt-BR")} · vence ${a.venc}${a.nota ? ` · ${a.nota}` : ""}`,
        icon: "",
        bg: "#EEF5F0",
        badge: status.badge,
        bc: status.bc,
      };
    }) ?? base.vencimentos),
    resumo: total > 0 ? resumo : base.resumo,
    data_referencia: snap.data_referencia,
  };
}
function loadFromStorage(id: "paulo" | "cinthia", base: UserData): UserData {
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS[id]);
    if (!raw) return base;
    const snap: LocalSnapshot = JSON.parse(raw);
    if (!snap.data_referencia || snap.data_referencia < base.data_referencia) return base;
    return mergeSnapshot(base, snap);
  } catch {
    return base;
  }
}

const EMPTY_MEMBER: UserData = {
  nome: "Novo membro",
  conta: "Dados a importar",
  total: 0,
  rf: 0,
  rv: 0,
  rf_pct: 0,
  rv_pct: 0,
  saudacao: "Acesso concedido. A carteira fica em branco até os extratos ou dados serem importados.",
  topbar_sub: "Persona aprovada · aguardando dados",
  kpi4_label: "Status",
  kpi4_val: "em branco",
  kpi4_sub: "aguardando importação",
  donut_data: [1],
  donut_labels: ["Sem dados importados"],
  donut_colors: ["#C8BFB0"],
  rf_ativos: [],
  rv_ativos: [],
  alertas_list: [],
  vencimentos: [],
  resumo: [
    {
      dot: "w",
      nome: "Carteira ainda sem dados",
      det: "A Vesta já aprovou esta persona. Importe extratos XP ou cadastre dados para materializar a carteira.",
    },
  ],
  data_referencia: "",
};

const LUIZA_ABRANTES: UserData = {
  ...EMPTY_MEMBER,
  nome: "Luiza",
  conta: "BTG/Menthor · C6 Bank · Brasilprev",
  total: 1193145,
  rf: 1094395,
  rv: 98750,
  rf_pct: 91.7,
  rv_pct: 8.3,
  saudacao: "Carteira da Luiza · posição em 30/06/2026.",
  topbar_sub: "Carteira Luiza · Domus Abrantes · posição 30/06/2026",
  kpi4_label: "Ação prioritária",
  kpi4_val: "Brasilprev",
  kpi4_sub: "portabilidade urgente · TAF 1,8%",
  donut_data: [671042, 167357, 255996, 98750],
  donut_labels: ["Crédito privado e CDBs", "Tesouro direto", "Previdência", "Renda variável"],
  donut_colors: ["#A11D3E", "#4E7A5C", "#D97706", "#3E5E7A"],
  rf_ativos: [
    { n: "Multiagro FIDC Mezanino", v: 402964, t: 19.18, cdi: 130, venc: "â€”", s: "urgente", nota: "BTG/Menthor · orientação: sair" },
    { n: "Multiplica FIDC Sênior", v: 128003, t: 18.14, cdi: 123, venc: "â€”", s: "urgente", nota: "BTG/Menthor · orientação: sair" },
    { n: "CDB Daycoval", v: 68629, t: 13, cdi: null, venc: "11/2027", s: "monitorar", nota: "BTG/Menthor · 13% pré · orientação: manter" },
    { n: "NTN-B-P 2045", v: 48641, t: 11.63, cdi: null, venc: "05/2045", s: "estrategico", nota: "BTG/Menthor · IPCA+6,13% · estratégico" },
    { n: "BTG Tesouro Selic", v: 98414, t: 14.75, cdi: 100, venc: "â€”", s: "intocavel", nota: "BTG/Menthor · 100% CDI · ok" },
    { n: "BTG Digital Tesouro Selic", v: 10189, t: 14.75, cdi: 100, venc: "â€”", s: "intocavel", nota: "BTG/Menthor · 100% CDI · ok" },
    { n: "LTN Pré 2032", v: 10113, t: 13.53, cdi: null, venc: "01/2032", s: "intocavel", nota: "BTG/Menthor · 13,53% pré · ok" },
    { n: "Previdência BTG 7 fundos", v: 152588, t: null, cdi: null, venc: "â€”", s: "monitorar", nota: "BTG/Menthor · TAF ~1% · auditar" },
    { n: "CDB C6 Comodidade", v: 71446, t: 14.75, cdi: 100, venc: "â€”", s: "intocavel", nota: "C6 Bank · 100% CDI · ok" },
    { n: "Brasilprev PGBL FIX X", v: 103408, t: null, cdi: null, venc: "â€”", s: "urgente", nota: "Brasilprev · TAF 1,8% · portabilidade urgente" },
  ],
  rv_ativos: [
    { n: "Western Asset US500 BTG", v: "R$ 26.661", pm: "BTG/Menthor", r: "+13,1% em 2026", rc: "good", cls: "RV", sb: "sb-g" },
    { n: "Alpha Key FICFIA", v: "R$ 15.086", pm: "BTG/Menthor", r: "+0,57% em 2026", rc: "muted", cls: "RV", sb: "sb-w" },
    { n: "Western Asset US500 C6", v: "R$ 57.003", pm: "C6 Bank", r: "+13,1% em 2026", rc: "good", cls: "RV", sb: "sb-g" },
  ],
  alertas_list: [
    { cor: "r", titulo: "Brasilprev PGBL FIX X â€” portabilidade urgente", det: "R$ 103.408 com TAF 1,8%. Priorizar análise de portabilidade." },
    { cor: "r", titulo: "FIDCs marcados para saída", det: "Multiagro Mezanino + Multiplica Sênior somam R$ 530.967." },
    { cor: "w", titulo: "Previdência BTG precisa auditoria", det: "R$ 152.588 em 7 fundos com TAF aproximada de 1%." },
    { cor: "w", titulo: "Alpha Key FICFIA â€” sair", det: "R$ 15.086 com retorno de apenas +0,57% em 2026." },
  ],
  vencimentos: [
    { icon: "ðŸ”´", bg: "var(--danger-bg)", nome: "CDB Daycoval", det: "R$ 68.629 · 11/2027 · 13% pré", badge: "manter", bc: "sb-w" },
    { icon: "ðŸ“…", bg: "rgba(74,124,89,.12)", nome: "LTN Pré 2032", det: "R$ 10.113 · 01/2032 · 13,53% pré", badge: "ok", bc: "sb-g" },
    { icon: "ðŸ›", bg: "rgba(74,124,89,.12)", nome: "NTN-B-P 2045", det: "R$ 48.641 · 05/2045 · IPCA+6,13%", badge: "estratégico", bc: "sb-g" },
  ],
  resumo: [
    { dot: "g", nome: "Posição importada em 30/06/2026", det: "Patrimônio total de R$ 1.193.145 distribuído entre BTG/Menthor, C6 Bank e Brasilprev." },
    { dot: "w", nome: "Carteira majoritariamente defensiva", det: "91,7% em renda fixa/previdência e 8,3% em renda variável." },
    { dot: "r", nome: "Saídas priorizadas", det: "Multiagro FIDC, Multiplica FIDC, Alpha Key e Brasilprev exigem decisão." },
    { dot: "g", nome: "US500 segue preservado", det: "Western Asset US500 soma R$ 83.664 entre BTG/Menthor e C6, ambos +13,1% em 2026." },
  ],
  data_referencia: "2026-06-30",
};

// Portfólios inteiramente fictícios para demonstrações do Domus Exemplum.
const CORNELIA_DEMO: UserData = {
  ...EMPTY_MEMBER,
  nome: "Cornelia",
  conta: "Carteira demonstrativa",
  total: 835000,
  rf: 610000,
  rv: 225000,
  rf_pct: 73.1,
  rv_pct: 26.9,
  saudacao: "Carteira demonstrativa de Cornelia · nenhum dado pertence a uma pessoa real.",
  topbar_sub: "Demonstração · Domus Exemplum",
  kpi4_label: "Breakeven do plano",
  kpi4_val: "out/2027",
  kpi4_sub: "16 meses · ganho estimado de R$ 940/mês",
  donut_data: [260000, 190000, 160000, 125000, 100000],
  donut_labels: ["Crédito privado", "Pós-fixados", "Inflação", "Ações Brasil", "ETFs globais"],
  donut_colors: ["#A11D3E", "#4E7A5C", "#D97706", "#3E5E7A", "#5C2B4E"],
  rf_ativos: [
    { n: "DEB EXEMPLAR ENERGIA 2030 (IPCA+7,8%)", v: 210000, t: 13.4, cdi: 105, venc: "15/09/2030", s: "intocavel", nota: "Ativo fictício para demonstração" },
    { n: "LCA BANCO AURORA 2029 (94% CDI)", v: 190000, t: 13.8, cdi: 108, venc: "21/11/2029", s: "monitorar" },
    { n: "NTN-B 2035 (IPCA+6,2%)", v: 160000, t: 11.7, cdi: 92, venc: "15/05/2035", s: "estrategico" },
    { n: "CDB BANCO EXEMPLUM 2027 (112% CDI)", v: 50000, t: 16.5, cdi: 112, venc: "10/10/2027", s: "planejar" },
  ],
  rv_ativos: [
    { n: "AÇÃ•ES BRASIL â€” cesta demonstrativa", v: "R$ 125.000", pm: "diversificada", r: "+12,4%", rc: "good", cls: "ações", sb: "sb-g" },
    { n: "ETF GLOBAL EXEMPLUM", v: "R$ 100.000", pm: "exposição internacional", r: "+8,1%", rc: "good", cls: "ETF", sb: "sb-a" },
  ],
  alertas_list: [
    { cor: "w", titulo: "CDB demonstrativo vence em out/2027", det: "R$ 50.000 · planejar o reinvestimento com antecedência." },
    { cor: "g", titulo: "Diversificação internacional dentro da meta", det: "ETF global representa 12% do patrimônio demonstrativo." },
  ],
  vencimentos: [
    { icon: "ðŸ“…", bg: "var(--warning-bg)", nome: "CDB BANCO EXEMPLUM 2027", det: "R$ 50.000 · 10/10/2027 · 112% CDI", badge: "planejar", bc: "sb-w" },
    { icon: "ðŸ”’", bg: "rgba(74,124,89,.12)", nome: "LCA BANCO AURORA 2029", det: "R$ 190.000 · 21/11/2029 · 94% CDI", badge: "monitorar", bc: "sb-g" },
  ],
  resumo: [
    { dot: "g", nome: "Patrimônio demonstrativo equilibrado", det: "73,1% em renda fixa e 26,9% em renda variável." },
    { dot: "w", nome: "Breakeven projetado para out/2027", det: "Custo fictício de R$ 14.100 compensado por ganho estimado de R$ 940/mês." },
  ],
  data_referencia: "2026-06-30",
};

const MARCUS_DEMO: UserData = {
  ...EMPTY_MEMBER,
  nome: "Marcus",
  conta: "Carteira demonstrativa",
  total: 560000,
  rf: 310000,
  rv: 250000,
  rf_pct: 55.4,
  rv_pct: 44.6,
  saudacao: "Carteira demonstrativa de Marcus · nenhum dado pertence a uma pessoa real.",
  topbar_sub: "Demonstração · Domus Exemplum",
  kpi4_label: "Breakeven do plano",
  kpi4_val: "fev/2028",
  kpi4_sub: "20 meses · ganho estimado de R$ 710/mês",
  donut_data: [140000, 100000, 70000, 150000, 100000],
  donut_labels: ["Pós-fixados", "Prefixados", "Inflação", "Ações Brasil", "Fundos imobiliários"],
  donut_colors: ["#4E7A5C", "#A11D3E", "#D97706", "#3E5E7A", "#B8546E"],
  rf_ativos: [
    { n: "CDB BANCO ROMA 2028 (115% CDI)", v: 140000, t: 16.9, cdi: 115, venc: "18/02/2028", s: "monitorar" },
    { n: "TESOURO PREFIXADO 2031 (13,2%)", v: 100000, t: 13.2, cdi: 103, venc: "01/01/2031", s: "estrategico" },
    { n: "NTN-B 2040 (IPCA+6,0%)", v: 70000, t: 11.5, cdi: 90, venc: "15/08/2040", s: "intocavel" },
  ],
  rv_ativos: [
    { n: "AÇÃ•ES DIVIDENDOS â€” cesta demonstrativa", v: "R$ 150.000", pm: "8 empresas", r: "+10,8%", rc: "good", cls: "ações", sb: "sb-g" },
    { n: "FIIs â€” cesta demonstrativa", v: "R$ 100.000", pm: "5 fundos", r: "+5,6%", rc: "good", cls: "FII", sb: "sb-a" },
  ],
  alertas_list: [
    { cor: "w", titulo: "Renda variável acima do perfil-base", det: "44,6% do patrimônio demonstrativo; avaliar rebalanceamento gradual." },
    { cor: "g", titulo: "Fluxo de dividendos diversificado", det: "Cesta fictícia distribuída entre ações e fundos imobiliários." },
  ],
  vencimentos: [
    { icon: "ðŸ“…", bg: "var(--warning-bg)", nome: "CDB BANCO ROMA 2028", det: "R$ 140.000 · 18/02/2028 · 115% CDI", badge: "monitorar", bc: "sb-w" },
    { icon: "ðŸ”’", bg: "rgba(74,124,89,.12)", nome: "TESOURO PREFIXADO 2031", det: "R$ 100.000 · 01/01/2031 · 13,2%", badge: "estratégico", bc: "sb-g" },
  ],
  resumo: [
    { dot: "w", nome: "Carteira demonstrativa mais arrojada", det: "44,6% em renda variável, com foco em dividendos." },
    { dot: "g", nome: "Breakeven projetado para fev/2028", det: "Custo fictício de R$ 13.500 compensado por ganho estimado de R$ 710/mês." },
  ],
  data_referencia: "2026-06-30",
};

export function isKnownProfileId(id: ProfileId): id is KnownProfileId {
  return id === "paulo" || id === "cinthia" || id === "familiar";
}

function loadMemberFromStorage(uuid: string, base: UserData = EMPTY_MEMBER): UserData {
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem("vesta_posicao_" + uuid);
    if (!raw) return base;
    const snap: LocalSnapshot = JSON.parse(raw);
    return mergeSnapshot(base, snap);
  } catch {
    return base;
  }
}

const DOMUS_PROFILES = new Map<string, { name: string; profiles: ProfileId[] }>();

export function registerDomusProfiles(domusId: string, name: string, profiles: ProfileId[]) {
  DOMUS_PROFILES.set(domusId, { name, profiles: profiles.filter((id) => !id.startsWith("domus:")) });
}

function buildDomusConsolidated(domusId: string): UserData {
  const registered = DOMUS_PROFILES.get(domusId);
  if (!registered) return EMPTY_MEMBER;
  const users = registered.profiles.map(getUser);
  const total = users.reduce((sum, user) => sum + user.total, 0);
  const rf = users.reduce((sum, user) => sum + user.rf, 0);
  const rv = users.reduce((sum, user) => sum + user.rv, 0);
  const labels = users.map((user) => user.nome || "Membro");
  return {
    ...EMPTY_MEMBER,
    nome: registered.name,
    conta: "Consolidado do Domus",
    total,
    rf,
    rv,
    rf_pct: total > 0 ? (rf / total) * 100 : 0,
    rv_pct: total > 0 ? (rv / total) * 100 : 0,
    saudacao: `Visão consolidada do ${registered.name}.`,
    topbar_sub: `Consolidado · ${registered.name}`,
    kpi4_label: "Membros com dados",
    kpi4_val: String(users.filter((user) => user.total > 0).length),
    kpi4_sub: `${users.length} perfis autorizados`,
    donut_data: total > 0 ? [rf, rv] : [1],
    donut_labels: total > 0 ? ["Renda fixa", "Renda variável"] : ["Sem dados importados"],
    donut_colors: total > 0 ? ["#A11D3E", "#3E5E7A"] : ["#C8BFB0"],
    rf_ativos: users.flatMap((user, index) =>
      user.rf_ativos.map((asset) => ({ ...asset, n: `[${labels[index]}] ${asset.n}` })),
    ),
    rv_ativos: users.flatMap((user) => user.rv_ativos ?? []),
    alertas_list: users.flatMap((user, index) =>
      user.alertas_list.map((alert) => ({ ...alert, titulo: `[${labels[index]}] ${alert.titulo}` })),
    ),
    vencimentos: users.flatMap((user, index) =>
      user.vencimentos.map((item) => ({ ...item, nome: `[${labels[index]}] ${item.nome}` })),
    ),
    resumo: total > 0
      ? users.flatMap((user, index) => user.resumo.map((item) => ({ ...item, nome: `[${labels[index]}] ${item.nome}` })))
      : EMPTY_MEMBER.resumo,
    data_referencia: users.reduce((latest, user) => user.data_referencia > latest ? user.data_referencia : latest, ""),
  };
}

export function getUser(id: ProfileId): UserData {
  if (id === "member:luiza-abrantes") return LUIZA_ABRANTES;
  if (id === "member:demo-cornelia") return loadMemberFromStorage("demo-cornelia", CORNELIA_DEMO);
  if (id === "member:demo-marcus") return loadMemberFromStorage("demo-marcus", MARCUS_DEMO);
  if (id === "paulo") return loadFromStorage("paulo", PAULO);
  if (id === "cinthia") return loadFromStorage("cinthia", CINTHIA);
  if (id === "familiar") return buildFamiliar(
    loadFromStorage("paulo", PAULO),
    loadFromStorage("cinthia", CINTHIA),
  );
  if (id.startsWith("member:")) return loadMemberFromStorage(id.slice("member:".length));
  if (id.startsWith("domus:")) return buildDomusConsolidated(id.slice("domus:".length));
  // IDs não reconhecidos (ex: "simple-murilo") são membros externos — retorna dados próprios, não o consolidado familiar
  return loadMemberFromStorage(id);
}



