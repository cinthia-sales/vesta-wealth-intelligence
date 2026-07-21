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
    classe: "AÃ§Ã£o" | "FII" | "FI-Agro" | "ETF";
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

// Fonte: PosicaoDetalhada_02-07.xlsx (conta 5296823) Â· Total R$712.325,21 em 02/07/2026
const PAULO: UserData = {
  nome: "Paulo Henrique",
  conta: "XP 5296823",
  total: 717856, // Fonte: print XP 04/07/2026 20:30 Â· saldo R$2.122 + investido R$715.734
  rf: 484415,
  rv: 231319,
  rf_pct: 67.8,
  rv_pct: 32.2,
  saudacao: "Cinthia, vocÃª estÃ¡ gerenciando a carteira do Paulo.",
  topbar_sub: "Carteira Paulo sob gestÃ£o Â· Conta XP 5296823",
  kpi4_label: "Breakeven do plano",
  kpi4_val: "mai/2028",
  kpi4_sub: "22 meses Â· +R$ 692/mÃªs",
  data_referencia: "2026-07-02",
  // Donut por classe (fonte XP): AÃ§Ãµes 122.980 Â· ETFs/Global/Alt 30.975 Â· XPAG 61.373 Â· TGRE 44.156 Â· RF InflaÃ§Ã£o 243.584 Â· RF PÃ³s-fix 142.592 Â· RF Prefixado 94.830
  donut_data: [243584, 142592, 94830, 61373, 44156, 122980, 30975],
  donut_labels: [
    "RF InflaÃ§Ã£o (NTN-B + Jalles)",
    "RF PÃ³s-fixado (LCAs)",
    "RF Prefixado (DEB J&F)",
    "XPAG11 CrÃ©dito Agro",
    "TGRE11 Real Estate",
    "AÃ§Ãµes Brasil",
    "ETFs + Global + Ouro",
  ],
  donut_colors: ["#A11D3E", "#4E7A5C", "#D97706", "#3E5E7A", "#B8546E", "#7A1530", "#5C2B4E"],
  rf_ativos: [
    { n: "NTN-B AGO/2026 (IPCA+9,45%)", v: 96512, t: 15.47, cdi: 120.7, venc: "15/08/2026", s: "urgente" },
    { n: "DEB ER ATIVO J&F FEV/2028 (+15,15%)", v: 90662, t: 15.15, cdi: 118.4, venc: "21/02/2028", s: "intocavel", nota: "Lote principal Â· 87 debÃªntures" },
    { n: "DEB JALLES MACHADO DEZ/2031 (IPCA+8,5%)", v: 70642, t: 14.47, cdi: 113.0, venc: "15/12/2031", s: "intocavel" },
    { n: "NTN-B AGO/2050 (IPCA+4,45%)", v: 53341, t: 8.55, cdi: 66.8, venc: "15/08/2050", s: "estrategico", nota: "Aplicada em 09/2021 Â· nunca vender com desÃ¡gio" },
    { n: "LCA SICOOB MAR/2030 (92% CDI)", v: 37750, t: 13.57, cdi: 106.1, venc: "21/03/2030", s: "intocavel" },
    { n: "LCA SICOOB ABR/2030 (92% CDI Â· 24 tÃ­tulos)", v: 28390, t: 13.57, cdi: 106.1, venc: "04/04/2030", s: "intocavel" },
    { n: "LCA ORIGINAL DEZ/2028 (92,5% CDI)", v: 26700, t: 13.61, cdi: 106.5, venc: "18/12/2028", s: "intocavel" },
    { n: "NTN-B AGO/2050 (IPCA+4,65%)", v: 23089, t: 8.74, cdi: 68.3, venc: "15/08/2050", s: "estrategico", nota: "Aplicada em 10/2021 Â· nunca vender com desÃ¡gio" },
    { n: "LCA SICOOB MAI/2030 (92% CDI)", v: 22492, t: 13.57, cdi: 106.1, venc: "10/05/2030", s: "intocavel" },
    { n: "LCA SICOOB ABR/2030 (92% CDI Â· 14 tÃ­tulos)", v: 16842, t: 13.57, cdi: 106.1, venc: "15/04/2030", s: "intocavel" },
    { n: "LCA ORIGINAL MAR/2030 (94% CDI)", v: 10418, t: 13.87, cdi: 108.4, venc: "06/03/2030", s: "intocavel" },
    { n: "DEB ER ATIVO J&F FEV/2028 (+15,15% Â· lote 2)", v: 3126, t: 15.15, cdi: 118.4, venc: "21/02/2028", s: "intocavel" },
    { n: "DEB ER ATIVO J&F FEV/2028 (+15,15% Â· lote 3)", v: 1042, t: 15.15, cdi: 118.4, venc: "21/02/2028", s: "intocavel" },
  ],
  rv_ativos: [
    // AÃ§Ãµes Brasil
    { n: "PSSA3", v: "R$ 28.995", pm: "R$26,95 Â· 544 aÃ§Ãµes", r: "+97,75%", rc: "good", cls: "aÃ§Ã£o", sb: "sb-g" },
    { n: "ITSA4", v: "R$ 21.150", pm: "R$8,87 Â· 1.576 aÃ§Ãµes", r: "+51,28%", rc: "good", cls: "aÃ§Ã£o", sb: "sb-g" },
    { n: "BPAC11", v: "R$ 18.632", pm: "R$86,85 Â· 342 aÃ§Ãµes", r: "-37,27% âš ï¸", rc: "bad", cls: "aÃ§Ã£o", sb: "sb-r" },
    { n: "ITUB4", v: "R$ 2.971", pm: "R$40,81 Â· 70 aÃ§Ãµes", r: "+4,00%", rc: "good", cls: "aÃ§Ã£o", sb: "sb-g" },
    { n: "CXSE3", v: "R$ 2.959", pm: "R$19,50 Â· 147 aÃ§Ãµes", r: "+3,21%", rc: "good", cls: "aÃ§Ã£o", sb: "sb-g" },
    { n: "ORVR3", v: "R$ 2.919", pm: "R$75,71 Â· 37 aÃ§Ãµes", r: "+4,22%", rc: "good", cls: "aÃ§Ã£o", sb: "sb-g" },
    { n: "CPFE3", v: "R$ 2.831", pm: "R$44,48 Â· 63 aÃ§Ãµes", r: "+1,03%", rc: "good", cls: "aÃ§Ã£o", sb: "sb-g" },
    { n: "GGBR4", v: "R$ 2.781", pm: "R$21,80 Â· 132 aÃ§Ãµes", r: "-3,34%", rc: "bad", cls: "aÃ§Ã£o", sb: "sb-w" },
    { n: "ABEV3", v: "R$ 2.766", pm: "R$16,29 Â· 170 aÃ§Ãµes", r: "-0,15%", rc: "muted", cls: "aÃ§Ã£o", sb: "sb-n" },
    { n: "B3SA3", v: "R$ 2.165", pm: "R$14,71 Â· 149 aÃ§Ãµes", r: "-1,20%", rc: "muted", cls: "aÃ§Ã£o", sb: "sb-n" },
    { n: "PRIO3", v: "R$ 2.100", pm: "R$56,67 Â· 40 aÃ§Ãµes", r: "-7,34%", rc: "bad", cls: "aÃ§Ã£o", sb: "sb-w" },
    { n: "RENT3", v: "R$ 1.735", pm: "R$40,89 Â· 42 aÃ§Ãµes", r: "+1,01%", rc: "good", cls: "aÃ§Ã£o", sb: "sb-g" },
    // FII / Fundos listados
    { n: "TGRE11 (TG Real Estate)", v: "R$ 44.156", pm: "Aplicado R$50.000", r: "-11,69% capital", rc: "bad", cls: "FII", sb: "sb-w" },
    { n: "XPAG11 (XP CrÃ©dito Agro)", v: "R$ 61.373", pm: "Aplicado R$62.000", r: "-1,01%", rc: "bad", cls: "FI", sb: "sb-a", retorno_posicao: "-1,01%", retorno_fundo_historico: "+42,94%", come_cotas_aviso: "âš ï¸ Come-cotas novembro" },
    // ETFs
    { n: "LFTB11 (ETF Tesouro)", v: "R$ 20.302", pm: "R$122,75 Â· 165 cotas", r: "+0,24%", rc: "good", cls: "ETF", sb: "sb-a" },
    { n: "IVVB11 (S&P 500)", v: "R$ 3.943", pm: "R$433,15 Â· 9 cotas", r: "+1,16%", rc: "good", cls: "ETF", sb: "sb-a" },
    { n: "GOLD11 (Ouro)", v: "R$ 3.977", pm: "R$22,33 Â· 178 cotas", r: "+0,05%", rc: "muted", cls: "ETF", sb: "sb-a" },
    { n: "NASD11 (Nasdaq)", v: "R$ 2.753", pm: "R$21,70 Â· 130 cotas", r: "-2,40%", rc: "bad", cls: "ETF", sb: "sb-w" },
  ],
  alertas_list: [
    { cor: "r", titulo: "NTN-B AGO/2026 â€” vence em 45 dias", det: "R$96.512 liberam em 15/08. Decidir destino AGORA." },
    { cor: "w", titulo: "BPAC11 â€” -37,27% sobre preÃ§o mÃ©dio", det: "R$18.632 Â· PM R$86,85 vs R$54,48. Revisar tese ou stop." },
    { cor: "w", titulo: "TGRE11 â€” -11,69% sobre capital aplicado", det: "Aplicou R$50.000 Â· vale R$44.156. Fundo listado sob pressÃ£o." },
    { cor: "g", titulo: "Proventos previstos julâ€“dez/2026", det: "R$1.520 provisionados (PSSA3, ITSA4, ABEV3, B3SA3 etc.)." },
  ],
  vencimentos: [
    { icon: "ðŸ”´", bg: "var(--danger-bg)", nome: "NTN-B AGO/2026", det: "R$96.512 Â· 15/08/2026 Â· 45 dias", badge: "urgente", bc: "sb-r" },
    { icon: "ðŸ”’", bg: "rgba(196,126,58,.1)", nome: "DEB J&F FEV/2028 (3 lotes)", det: "R$94.830 Â· 21/02/2028 Â· +15,15% isento", badge: "intocÃ¡vel", bc: "sb-a" },
    { icon: "ðŸ”’", bg: "rgba(196,126,58,.1)", nome: "LCA ORIGINAL DEZ/2028", det: "R$26.700 Â· 18/12/2028 Â· 92,5% CDI", badge: "intocÃ¡vel", bc: "sb-a" },
    { icon: "ðŸ”’", bg: "rgba(196,126,58,.1)", nome: "LCAs SICOOB 2030 (Ã—4)", det: "R$105.474 Â· marâ€“mai/2030 Â· 92% CDI", badge: "intocÃ¡vel", bc: "sb-a" },
    { icon: "ðŸ”’", bg: "rgba(74,124,89,.12)", nome: "DEB JALLES DEZ/2031", det: "R$70.642 Â· 15/12/2031 Â· IPCA+8,5%", badge: "intocÃ¡vel", bc: "sb-a" },
  ],
  resumo: [
    { dot: "w", nome: "ReestruturaÃ§Ã£o jun/26", det: "Custo R$14.698 Â· ganho +R$692/mÃªs Â· recupera mai/2028" },
    { dot: "g", nome: "Taxa mÃ©dia subiu 11,81% â†’ 14,86%", det: "+3,05%/ano Â· R$285/mÃªs das debÃªntures novas" },
    { dot: "g", nome: "5 blocos intocÃ¡veis (RF)", det: "J&F Â· Jalles Â· LCAs SICOOB Â· LCA Original Â· NTN-B 2050" },
    { dot: "w", nome: "RV concentrada em 3 posiÃ§Ãµes", det: "PSSA3 + ITSA4 + BPAC11 = 60% das aÃ§Ãµes Â· rebalancear?" },
  ],
};

const CINTHIA: UserData = {
  nome: "CÃ­nthia",
  conta: "XP 6414212",
  total: 440301,
  rf: 439472,
  rv: 0,
  rf_pct: 100,
  rv_pct: 0,
  data_referencia: "2026-06-30",
  saudacao: "Esta Ã© a sua carteira, CÃ­nthia. PosiÃ§Ã£o em 30/06/2026.",
  topbar_sub: "Carteira CÃ­nthia Â· Conta XP 6414212",
  kpi4_label: "LCI vence em",
  kpi4_val: "mai/2027",
  kpi4_sub: "R$225k Â· ~10 meses Â· oportunidade",
  donut_data: [225494, 106961, 86312, 19553, 1152],
  donut_labels: [
    "LCI XP mai/27 (89% CDI)",
    "LCD BRDE fev/36 (92,5% CDI)",
    "LCA Bocom out/30 (92,7% CDI)",
    "LCA Original abr/30 (94% CDI)",
    "LCD BRDE mai/30 (93,5% CDI)",
  ],
  donut_colors: ["#A11D3E", "#C0392B", "#4E7A5C", "#B8546E", "#3E5E7A"],
  rf_ativos: [
    { n: "LCI BANCO XP S.A. MAI/2027", v: 225494, t: 13.13, cdi: 89.0, venc: "13/05/2027", s: "planejar", nota: "89% CDI isento Â· vence mai/2027 Â· planejar reinvestimento nov/2026 Â· meta IPCA+8%+ ou prÃ© 14%+ isento" },
    { n: "LCA BANCO BOCOM BBM OUT/2030", v: 86312, t: 13.68, cdi: 92.7, venc: "21/10/2030", s: "monitorar", nota: "92,7% CDI isento Â· banco menor, checar rating" },
    { n: "LCD BRDE FEV/2036 (lote 1 Â· 55 tÃ­tulos)", v: 57675, t: 13.64, cdi: 92.5, venc: "11/02/2036", s: "monitorar", nota: "âš ï¸ Taxa flutuante trancada 10 anos" },
    { n: "LCD BRDE FEV/2036 (lote 2 Â· 47 tÃ­tulos)", v: 49286, t: 13.64, cdi: 92.5, venc: "11/02/2036", s: "monitorar", nota: "âš ï¸ Taxa flutuante trancada 10 anos" },
    { n: "LCA ORIGINAL ABR/2030", v: 19553, t: 13.87, cdi: 94.0, venc: "08/04/2030", s: "intocavel", nota: "94% CDI isento" },
    { n: "LCD BRDE MAI/2030", v: 1152, t: 13.79, cdi: 93.5, venc: "23/05/2030", s: "monitorar", nota: "ResÃ­duo Â· 1 tÃ­tulo" },
  ],
  alertas_list: [
    { cor: "w", titulo: "LCI XP vence em 13/05/2027 â€” planejar reinvestimento", det: "R$225.494 liberam em ~10 meses. Estudar IPCA+8%+ ou prefixado 14%+." },
    { cor: "r", titulo: "LCD BRDE FEV/2036 â€” taxa flutuante por 10 anos", det: "R$106.961 (2 lotes) a 92,5% CDI trancados atÃ© 2036. Quando Selic cair, rende menos sem saÃ­da." },
    { cor: "w", titulo: "LCA Bocom BBM â€” banco menor, checar rating", det: "R$86.312 a 92,7% CDI Â· confirmar rating do Bocom BBM." },
    { cor: "g", titulo: "LCA ORIGINAL ABR/2030 â€” 94% CDI isento", det: "R$19.553 travado atÃ© 04/2030, taxa boa." },
  ],
  vencimentos: [
    { icon: "ðŸ“…", bg: "var(--warning-bg)", nome: "LCI BANCO XP MAI/2027", det: "R$225.494 Â· 13/05/2027 Â· 89% CDI Â· planejar jÃ¡", badge: "prÃ³ximo", bc: "sb-w" },
    { icon: "ðŸ”’", bg: "rgba(196,126,58,.1)", nome: "LCA ORIGINAL ABR/2030", det: "R$19.553 Â· 08/04/2030 Â· 94% CDI", badge: "intocÃ¡vel", bc: "sb-a" },
    { icon: "ðŸ“…", bg: "rgba(74,124,89,.12)", nome: "LCA Bocom BBM OUT/2030", det: "R$86.312 Â· 21/10/2030 Â· 92,7% CDI", badge: "ok", bc: "sb-n" },
    { icon: "âš ï¸", bg: "var(--danger-bg)", nome: "LCD BRDE FEV/2036 (Ã—2)", det: "R$106.961 Â· 11/02/2036 Â· 92,5% CDI flutuante", badge: "monitorar", bc: "sb-r" },
  ],
  resumo: [
    { dot: "r", nome: "LCD BRDE FEV/2036 â€” risco de longo prazo", det: "R$106.961 em taxa flutuante atÃ© 2036. Quando Selic cair, rende menos sem saÃ­da." },
    { dot: "g", nome: "LCI XP vence 13/05/2027 â€” oportunidade", det: "R$225.494 livram em ~10 meses. Travar IPCA+8%+ ou prÃ© 14%+ compensa o LCD BRDE." },
    { dot: "g", nome: "Carteira 100% pÃ³s-fixado isento", det: "5 emissores Â· 6 tÃ­tulos Â· mÃ©dia ~92% CDI Â· sem IR/IOF relevante." },
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
    nome: "FamÃ­lia Furtado",
    conta: "Consolidado Paulo + Cinthia",
    total,
    rf,
    rv,
    rf_pct: (rf / total) * 100,
    rv_pct: (rv / total) * 100,
    saudacao: "Vesta personificada, segue visÃ£o consolidada da famÃ­lia.",
    topbar_sub: "VisÃ£o familiar Â· CÃ­nthia como gestora",
    kpi4_label: "Breakeven do plano",
    kpi4_val: "mai/2028",
    kpi4_sub: "22 meses Â· +R$ 692/mÃªs",
    donut_data,
    donut_labels: ["LCA/LCI pÃ³s-fix.", "InflaÃ§Ã£o IPCA+", "Prefixado isento", "Agro + LCD flut.", "Renda variÃ¡vel"],
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
      { dot: "w", nome: "ReestruturaÃ§Ã£o jun/26 (Paulo)", det: "Custo R$14.698 Â· ganho +R$692/mÃªs Â· recupera mai/2028" },
      { dot: "g", nome: "Cinthia: LCI XP vence mai/2027", det: "R$222k livram em ~10 meses â€” travar IPCA+8%+ ou prÃ© 14%+." },
      { dot: "r", nome: "Cinthia: LCD BRDE FEV/2036", det: "R$106k a taxa flutuante trancada por 10 anos." },
      { dot: "g", nome: "4 blocos intocÃ¡veis (Paulo)", det: "J&F Â· Jalles Â· LCAs Â· NTN-B 2050 atÃ© mai/2028." },
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
    donut_data: snap.donut_data ?? (total > 0 ? (rv > 0 ? [rf, rv] : [rf]) : base.donut_data),
    donut_labels: snap.donut_labels ?? (total > 0 ? (rv > 0 ? ["Renda fixa", "Renda variável"] : ["Renda fixa"]) : base.donut_labels),
    donut_colors: snap.donut_colors ?? (total > 0 ? (rv > 0 ? ["#A11D3E", "#3E5E7A"] : ["#A11D3E"]) : base.donut_colors),
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
  saudacao: "Acesso concedido. A carteira fica em branco atÃ© os extratos ou dados serem importados.",
  topbar_sub: "Persona aprovada Â· aguardando dados",
  kpi4_label: "Status",
  kpi4_val: "em branco",
  kpi4_sub: "aguardando importaÃ§Ã£o",
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
      det: "A Vesta jÃ¡ aprovou esta persona. Importe extratos XP ou cadastre dados para materializar a carteira.",
    },
  ],
  data_referencia: "",
};

const LUIZA_ABRANTES: UserData = {
  ...EMPTY_MEMBER,
  nome: "Luiza",
  conta: "BTG/Menthor Â· C6 Bank Â· Brasilprev",
  total: 1193145,
  rf: 1094395,
  rv: 98750,
  rf_pct: 91.7,
  rv_pct: 8.3,
  saudacao: "Carteira da Luiza Â· posiÃ§Ã£o em 30/06/2026.",
  topbar_sub: "Carteira Luiza Â· Domus Abrantes Â· posiÃ§Ã£o 30/06/2026",
  kpi4_label: "AÃ§Ã£o prioritÃ¡ria",
  kpi4_val: "Brasilprev",
  kpi4_sub: "portabilidade urgente Â· TAF 1,8%",
  donut_data: [671042, 167357, 255996, 98750],
  donut_labels: ["CrÃ©dito privado e CDBs", "Tesouro direto", "PrevidÃªncia", "Renda variÃ¡vel"],
  donut_colors: ["#A11D3E", "#4E7A5C", "#D97706", "#3E5E7A"],
  rf_ativos: [
    { n: "Multiagro FIDC Mezanino", v: 402964, t: 19.18, cdi: 130, venc: "â€”", s: "urgente", nota: "BTG/Menthor Â· orientaÃ§Ã£o: sair" },
    { n: "Multiplica FIDC SÃªnior", v: 128003, t: 18.14, cdi: 123, venc: "â€”", s: "urgente", nota: "BTG/Menthor Â· orientaÃ§Ã£o: sair" },
    { n: "CDB Daycoval", v: 68629, t: 13, cdi: null, venc: "11/2027", s: "monitorar", nota: "BTG/Menthor Â· 13% prÃ© Â· orientaÃ§Ã£o: manter" },
    { n: "NTN-B-P 2045", v: 48641, t: 11.63, cdi: null, venc: "05/2045", s: "estrategico", nota: "BTG/Menthor Â· IPCA+6,13% Â· estratÃ©gico" },
    { n: "BTG Tesouro Selic", v: 98414, t: 14.75, cdi: 100, venc: "â€”", s: "intocavel", nota: "BTG/Menthor Â· 100% CDI Â· ok" },
    { n: "BTG Digital Tesouro Selic", v: 10189, t: 14.75, cdi: 100, venc: "â€”", s: "intocavel", nota: "BTG/Menthor Â· 100% CDI Â· ok" },
    { n: "LTN PrÃ© 2032", v: 10113, t: 13.53, cdi: null, venc: "01/2032", s: "intocavel", nota: "BTG/Menthor Â· 13,53% prÃ© Â· ok" },
    { n: "PrevidÃªncia BTG 7 fundos", v: 152588, t: null, cdi: null, venc: "â€”", s: "monitorar", nota: "BTG/Menthor Â· TAF ~1% Â· auditar" },
    { n: "CDB C6 Comodidade", v: 71446, t: 14.75, cdi: 100, venc: "â€”", s: "intocavel", nota: "C6 Bank Â· 100% CDI Â· ok" },
    { n: "Brasilprev PGBL FIX X", v: 103408, t: null, cdi: null, venc: "â€”", s: "urgente", nota: "Brasilprev Â· TAF 1,8% Â· portabilidade urgente" },
  ],
  rv_ativos: [
    { n: "Western Asset US500 BTG", v: "R$ 26.661", pm: "BTG/Menthor", r: "+13,1% em 2026", rc: "good", cls: "RV", sb: "sb-g" },
    { n: "Alpha Key FICFIA", v: "R$ 15.086", pm: "BTG/Menthor", r: "+0,57% em 2026", rc: "muted", cls: "RV", sb: "sb-w" },
    { n: "Western Asset US500 C6", v: "R$ 57.003", pm: "C6 Bank", r: "+13,1% em 2026", rc: "good", cls: "RV", sb: "sb-g" },
  ],
  alertas_list: [
    { cor: "r", titulo: "Brasilprev PGBL FIX X â€” portabilidade urgente", det: "R$ 103.408 com TAF 1,8%. Priorizar anÃ¡lise de portabilidade." },
    { cor: "r", titulo: "FIDCs marcados para saÃ­da", det: "Multiagro Mezanino + Multiplica SÃªnior somam R$ 530.967." },
    { cor: "w", titulo: "PrevidÃªncia BTG precisa auditoria", det: "R$ 152.588 em 7 fundos com TAF aproximada de 1%." },
    { cor: "w", titulo: "Alpha Key FICFIA â€” sair", det: "R$ 15.086 com retorno de apenas +0,57% em 2026." },
  ],
  vencimentos: [
    { icon: "ðŸ”´", bg: "var(--danger-bg)", nome: "CDB Daycoval", det: "R$ 68.629 Â· 11/2027 Â· 13% prÃ©", badge: "manter", bc: "sb-w" },
    { icon: "ðŸ“…", bg: "rgba(74,124,89,.12)", nome: "LTN PrÃ© 2032", det: "R$ 10.113 Â· 01/2032 Â· 13,53% prÃ©", badge: "ok", bc: "sb-g" },
    { icon: "ðŸ›", bg: "rgba(74,124,89,.12)", nome: "NTN-B-P 2045", det: "R$ 48.641 Â· 05/2045 Â· IPCA+6,13%", badge: "estratÃ©gico", bc: "sb-g" },
  ],
  resumo: [
    { dot: "g", nome: "PosiÃ§Ã£o importada em 30/06/2026", det: "PatrimÃ´nio total de R$ 1.193.145 distribuÃ­do entre BTG/Menthor, C6 Bank e Brasilprev." },
    { dot: "w", nome: "Carteira majoritariamente defensiva", det: "91,7% em renda fixa/previdÃªncia e 8,3% em renda variÃ¡vel." },
    { dot: "r", nome: "SaÃ­das priorizadas", det: "Multiagro FIDC, Multiplica FIDC, Alpha Key e Brasilprev exigem decisÃ£o." },
    { dot: "g", nome: "US500 segue preservado", det: "Western Asset US500 soma R$ 83.664 entre BTG/Menthor e C6, ambos +13,1% em 2026." },
  ],
  data_referencia: "2026-06-30",
};

// PortfÃ³lios inteiramente fictÃ­cios para demonstraÃ§Ãµes do Domus Exemplum.
const CORNELIA_DEMO: UserData = {
  ...EMPTY_MEMBER,
  nome: "Cornelia",
  conta: "Carteira demonstrativa",
  total: 835000,
  rf: 610000,
  rv: 225000,
  rf_pct: 73.1,
  rv_pct: 26.9,
  saudacao: "Carteira demonstrativa de Cornelia Â· nenhum dado pertence a uma pessoa real.",
  topbar_sub: "DemonstraÃ§Ã£o Â· Domus Exemplum",
  kpi4_label: "Breakeven do plano",
  kpi4_val: "out/2027",
  kpi4_sub: "16 meses Â· ganho estimado de R$ 940/mÃªs",
  donut_data: [260000, 190000, 160000, 125000, 100000],
  donut_labels: ["CrÃ©dito privado", "PÃ³s-fixados", "InflaÃ§Ã£o", "AÃ§Ãµes Brasil", "ETFs globais"],
  donut_colors: ["#A11D3E", "#4E7A5C", "#D97706", "#3E5E7A", "#5C2B4E"],
  rf_ativos: [
    { n: "DEB EXEMPLAR ENERGIA 2030 (IPCA+7,8%)", v: 210000, t: 13.4, cdi: 105, venc: "15/09/2030", s: "intocavel", nota: "Ativo fictÃ­cio para demonstraÃ§Ã£o" },
    { n: "LCA BANCO AURORA 2029 (94% CDI)", v: 190000, t: 13.8, cdi: 108, venc: "21/11/2029", s: "monitorar" },
    { n: "NTN-B 2035 (IPCA+6,2%)", v: 160000, t: 11.7, cdi: 92, venc: "15/05/2035", s: "estrategico" },
    { n: "CDB BANCO EXEMPLUM 2027 (112% CDI)", v: 50000, t: 16.5, cdi: 112, venc: "10/10/2027", s: "planejar" },
  ],
  rv_ativos: [
    { n: "AÃ‡Ã•ES BRASIL â€” cesta demonstrativa", v: "R$ 125.000", pm: "diversificada", r: "+12,4%", rc: "good", cls: "aÃ§Ãµes", sb: "sb-g" },
    { n: "ETF GLOBAL EXEMPLUM", v: "R$ 100.000", pm: "exposiÃ§Ã£o internacional", r: "+8,1%", rc: "good", cls: "ETF", sb: "sb-a" },
  ],
  alertas_list: [
    { cor: "w", titulo: "CDB demonstrativo vence em out/2027", det: "R$ 50.000 Â· planejar o reinvestimento com antecedÃªncia." },
    { cor: "g", titulo: "DiversificaÃ§Ã£o internacional dentro da meta", det: "ETF global representa 12% do patrimÃ´nio demonstrativo." },
  ],
  vencimentos: [
    { icon: "ðŸ“…", bg: "var(--warning-bg)", nome: "CDB BANCO EXEMPLUM 2027", det: "R$ 50.000 Â· 10/10/2027 Â· 112% CDI", badge: "planejar", bc: "sb-w" },
    { icon: "ðŸ”’", bg: "rgba(74,124,89,.12)", nome: "LCA BANCO AURORA 2029", det: "R$ 190.000 Â· 21/11/2029 Â· 94% CDI", badge: "monitorar", bc: "sb-g" },
  ],
  resumo: [
    { dot: "g", nome: "PatrimÃ´nio demonstrativo equilibrado", det: "73,1% em renda fixa e 26,9% em renda variÃ¡vel." },
    { dot: "w", nome: "Breakeven projetado para out/2027", det: "Custo fictÃ­cio de R$ 14.100 compensado por ganho estimado de R$ 940/mÃªs." },
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
  saudacao: "Carteira demonstrativa de Marcus Â· nenhum dado pertence a uma pessoa real.",
  topbar_sub: "DemonstraÃ§Ã£o Â· Domus Exemplum",
  kpi4_label: "Breakeven do plano",
  kpi4_val: "fev/2028",
  kpi4_sub: "20 meses Â· ganho estimado de R$ 710/mÃªs",
  donut_data: [140000, 100000, 70000, 150000, 100000],
  donut_labels: ["PÃ³s-fixados", "Prefixados", "InflaÃ§Ã£o", "AÃ§Ãµes Brasil", "Fundos imobiliÃ¡rios"],
  donut_colors: ["#4E7A5C", "#A11D3E", "#D97706", "#3E5E7A", "#B8546E"],
  rf_ativos: [
    { n: "CDB BANCO ROMA 2028 (115% CDI)", v: 140000, t: 16.9, cdi: 115, venc: "18/02/2028", s: "monitorar" },
    { n: "TESOURO PREFIXADO 2031 (13,2%)", v: 100000, t: 13.2, cdi: 103, venc: "01/01/2031", s: "estrategico" },
    { n: "NTN-B 2040 (IPCA+6,0%)", v: 70000, t: 11.5, cdi: 90, venc: "15/08/2040", s: "intocavel" },
  ],
  rv_ativos: [
    { n: "AÃ‡Ã•ES DIVIDENDOS â€” cesta demonstrativa", v: "R$ 150.000", pm: "8 empresas", r: "+10,8%", rc: "good", cls: "aÃ§Ãµes", sb: "sb-g" },
    { n: "FIIs â€” cesta demonstrativa", v: "R$ 100.000", pm: "5 fundos", r: "+5,6%", rc: "good", cls: "FII", sb: "sb-a" },
  ],
  alertas_list: [
    { cor: "w", titulo: "Renda variÃ¡vel acima do perfil-base", det: "44,6% do patrimÃ´nio demonstrativo; avaliar rebalanceamento gradual." },
    { cor: "g", titulo: "Fluxo de dividendos diversificado", det: "Cesta fictÃ­cia distribuÃ­da entre aÃ§Ãµes e fundos imobiliÃ¡rios." },
  ],
  vencimentos: [
    { icon: "ðŸ“…", bg: "var(--warning-bg)", nome: "CDB BANCO ROMA 2028", det: "R$ 140.000 Â· 18/02/2028 Â· 115% CDI", badge: "monitorar", bc: "sb-w" },
    { icon: "ðŸ”’", bg: "rgba(74,124,89,.12)", nome: "TESOURO PREFIXADO 2031", det: "R$ 100.000 Â· 01/01/2031 Â· 13,2%", badge: "estratÃ©gico", bc: "sb-g" },
  ],
  resumo: [
    { dot: "w", nome: "Carteira demonstrativa mais arrojada", det: "44,6% em renda variÃ¡vel, com foco em dividendos." },
    { dot: "g", nome: "Breakeven projetado para fev/2028", det: "Custo fictÃ­cio de R$ 13.500 compensado por ganho estimado de R$ 710/mÃªs." },
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
    saudacao: `VisÃ£o consolidada do ${registered.name}.`,
    topbar_sub: `Consolidado Â· ${registered.name}`,
    kpi4_label: "Membros com dados",
    kpi4_val: String(users.filter((user) => user.total > 0).length),
    kpi4_sub: `${users.length} perfis autorizados`,
    donut_data: total > 0 ? [rf, rv] : [1],
    donut_labels: total > 0 ? ["Renda fixa", "Renda variÃ¡vel"] : ["Sem dados importados"],
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
  if (id.startsWith("member:")) return loadMemberFromStorage(id.slice("member:".length));
  if (id.startsWith("domus:")) return buildDomusConsolidated(id.slice("domus:".length));
  return buildFamiliar(
    loadFromStorage("paulo", PAULO),
    loadFromStorage("cinthia", CINTHIA),
  );
}



