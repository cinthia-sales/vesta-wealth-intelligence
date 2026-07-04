import type { ProfileId } from "@/lib/profile-derive";

type Status = "intocavel" | "urgente" | "monitorar";

export type RFAtivo = {
  n: string;
  v: number;
  t: number | null;
  cdi: number | null;
  venc: string;
  s: Status;
  nota?: string;
};

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
  rv_ativos?: { n: string; v: string; pm: string; r: string; rc: string; cls: string; sb: string }[];
  alertas_list: { cor: "r" | "w" | "g"; titulo: string; det: string }[];
  vencimentos: { icon: string; bg: string; nome: string; det: string; badge: string; bc: string }[];
  resumo: { dot: "r" | "w" | "g"; nome: string; det: string }[];
};

// Fonte: PosicaoDetalhada_02-07.xlsx (conta 5296823) · Total R$712.325,21 em 02/07/2026
const PAULO: UserData = {
  nome: "Paulo Henrique",
  conta: "XP 5296823",
  total: 712325,
  rf: 481006,
  rv: 231319, // Ações 122.980 + XPAG 61.373 + TGRE 44.156 + LFTB 20.302 (ETF pós-fix) + IVVB 3.943 + NASD 2.753 + GOLD 3.977 = 259.484 na verdade divido: RF pura 481.006, resto 231.319
  rf_pct: 67.5,
  rv_pct: 32.5,
  saudacao: "Cinthia, você está gerenciando a carteira do Paulo.",
  topbar_sub: "Carteira Paulo sob gestão · Conta XP 5296823",
  kpi4_label: "Breakeven do plano",
  kpi4_val: "mai/2028",
  kpi4_sub: "22 meses · +R$ 692/mês",
  // Donut por classe (fonte XP): Ações 122.980 · ETFs/Global/Alt 30.975 · XPAG 61.373 · TGRE 44.156 · RF Inflação 243.584 · RF Pós-fix 142.592 · RF Prefixado 94.830
  donut_data: [243584, 142592, 94830, 61373, 44156, 122980, 30975],
  donut_labels: [
    "RF Inflação (NTN-B + Jalles)",
    "RF Pós-fixado (LCAs)",
    "RF Prefixado (DEB J&F)",
    "XPAG11 Crédito Agro",
    "TGRE11 Real Estate",
    "Ações Brasil",
    "ETFs + Global + Ouro",
  ],
  donut_colors: ["#4A7C59", "#C47E3A", "#8B7355", "#B8892A", "#6B8E9E", "#A89880", "#D4AF37"],
  rf_ativos: [
    { n: "NTN-B AGO/2026 (IPCA+9,45%)", v: 96512, t: 15.47, cdi: 120.7, venc: "15/08/2026", s: "urgente" },
    { n: "DEB ER ATIVO J&F FEV/2028 (+15,15%)", v: 90662, t: 15.15, cdi: 118.4, venc: "21/02/2028", s: "intocavel", nota: "Lote principal · 87 debêntures" },
    { n: "DEB JALLES MACHADO DEZ/2031 (IPCA+8,5%)", v: 70642, t: 14.47, cdi: 113.0, venc: "15/12/2031", s: "intocavel" },
    { n: "NTN-B AGO/2050 (IPCA+4,45%)", v: 53341, t: 8.55, cdi: 66.8, venc: "15/08/2050", s: "monitorar", nota: "Aplicada em 09/2021" },
    { n: "LCA SICOOB MAR/2030 (92% CDI)", v: 37750, t: 13.57, cdi: 106.1, venc: "21/03/2030", s: "intocavel" },
    { n: "LCA SICOOB ABR/2030 (92% CDI · 24 títulos)", v: 28390, t: 13.57, cdi: 106.1, venc: "04/04/2030", s: "intocavel" },
    { n: "LCA ORIGINAL DEZ/2028 (92,5% CDI)", v: 26700, t: 13.61, cdi: 106.5, venc: "18/12/2028", s: "intocavel" },
    { n: "NTN-B AGO/2050 (IPCA+4,65%)", v: 23089, t: 8.74, cdi: 68.3, venc: "15/08/2050", s: "monitorar", nota: "Aplicada em 10/2021" },
    { n: "LCA SICOOB MAI/2030 (92% CDI)", v: 22492, t: 13.57, cdi: 106.1, venc: "10/05/2030", s: "intocavel" },
    { n: "LCA SICOOB ABR/2030 (92% CDI · 14 títulos)", v: 16842, t: 13.57, cdi: 106.1, venc: "15/04/2030", s: "intocavel" },
    { n: "LCA ORIGINAL MAR/2030 (94% CDI)", v: 10418, t: 13.87, cdi: 108.4, venc: "06/03/2030", s: "intocavel" },
    { n: "DEB ER ATIVO J&F FEV/2028 (+15,15% · lote 2)", v: 3126, t: 15.15, cdi: 118.4, venc: "21/02/2028", s: "intocavel" },
    { n: "DEB ER ATIVO J&F FEV/2028 (+15,15% · lote 3)", v: 1042, t: 15.15, cdi: 118.4, venc: "21/02/2028", s: "intocavel" },
  ],
  rv_ativos: [
    // Ações Brasil
    { n: "PSSA3", v: "R$ 28.995", pm: "R$26,95 · 544 ações", r: "+97,75%", rc: "good", cls: "ação", sb: "sb-g" },
    { n: "ITSA4", v: "R$ 21.150", pm: "R$8,87 · 1.576 ações", r: "+51,28%", rc: "good", cls: "ação", sb: "sb-g" },
    { n: "BPAC11", v: "R$ 18.632", pm: "R$86,85 · 342 ações", r: "-37,27% ⚠️", rc: "bad", cls: "ação", sb: "sb-r" },
    { n: "ITUB4", v: "R$ 2.971", pm: "R$40,81 · 70 ações", r: "+4,00%", rc: "good", cls: "ação", sb: "sb-g" },
    { n: "CXSE3", v: "R$ 2.959", pm: "R$19,50 · 147 ações", r: "+3,21%", rc: "good", cls: "ação", sb: "sb-g" },
    { n: "ORVR3", v: "R$ 2.919", pm: "R$75,71 · 37 ações", r: "+4,22%", rc: "good", cls: "ação", sb: "sb-g" },
    { n: "CPFE3", v: "R$ 2.831", pm: "R$44,48 · 63 ações", r: "+1,03%", rc: "good", cls: "ação", sb: "sb-g" },
    { n: "GGBR4", v: "R$ 2.781", pm: "R$21,80 · 132 ações", r: "-3,34%", rc: "bad", cls: "ação", sb: "sb-w" },
    { n: "ABEV3", v: "R$ 2.766", pm: "R$16,29 · 170 ações", r: "-0,15%", rc: "muted", cls: "ação", sb: "sb-n" },
    { n: "B3SA3", v: "R$ 2.165", pm: "R$14,71 · 149 ações", r: "-1,20%", rc: "muted", cls: "ação", sb: "sb-n" },
    { n: "PRIO3", v: "R$ 2.100", pm: "R$56,67 · 40 ações", r: "-7,34%", rc: "bad", cls: "ação", sb: "sb-w" },
    { n: "RENT3", v: "R$ 1.735", pm: "R$40,89 · 42 ações", r: "+1,01%", rc: "good", cls: "ação", sb: "sb-g" },
    // FII / Fundos listados
    { n: "TGRE11 (TG Real Estate)", v: "R$ 44.156", pm: "Aplicado R$50.000", r: "-11,69% capital", rc: "bad", cls: "FII", sb: "sb-w" },
    { n: "XPAG11 (XP Crédito Agro)", v: "R$ 61.373", pm: "Aplicado R$62.000", r: "+42,94% líq. hist.", rc: "good", cls: "FI", sb: "sb-a" },
    // ETFs
    { n: "LFTB11 (ETF Tesouro)", v: "R$ 20.302", pm: "R$122,75 · 165 cotas", r: "+0,24%", rc: "good", cls: "ETF", sb: "sb-a" },
    { n: "IVVB11 (S&P 500)", v: "R$ 3.943", pm: "R$433,15 · 9 cotas", r: "+1,16%", rc: "good", cls: "ETF", sb: "sb-a" },
    { n: "GOLD11 (Ouro)", v: "R$ 3.977", pm: "R$22,33 · 178 cotas", r: "+0,05%", rc: "muted", cls: "ETF", sb: "sb-a" },
    { n: "NASD11 (Nasdaq)", v: "R$ 2.753", pm: "R$21,70 · 130 cotas", r: "-2,40%", rc: "bad", cls: "ETF", sb: "sb-w" },
  ],
  alertas_list: [
    { cor: "r", titulo: "NTN-B AGO/2026 — vence em 45 dias", det: "R$96.512 liberam em 15/08. Decidir destino AGORA." },
    { cor: "w", titulo: "BPAC11 — -37,27% sobre preço médio", det: "R$18.632 · PM R$86,85 vs R$54,48. Revisar tese ou stop." },
    { cor: "w", titulo: "TGRE11 — -11,69% sobre capital aplicado", det: "Aplicou R$50.000 · vale R$44.156. Fundo listado sob pressão." },
    { cor: "g", titulo: "Proventos previstos jul–dez/2026", det: "R$1.520 provisionados (PSSA3, ITSA4, ABEV3, B3SA3 etc.)." },
  ],
  vencimentos: [
    { icon: "🔴", bg: "var(--danger-bg)", nome: "NTN-B AGO/2026", det: "R$96.512 · 15/08/2026 · 45 dias", badge: "urgente", bc: "sb-r" },
    { icon: "🔒", bg: "rgba(196,126,58,.1)", nome: "DEB J&F FEV/2028 (3 lotes)", det: "R$94.830 · 21/02/2028 · +15,15% isento", badge: "intocável", bc: "sb-a" },
    { icon: "🔒", bg: "rgba(196,126,58,.1)", nome: "LCA ORIGINAL DEZ/2028", det: "R$26.700 · 18/12/2028 · 92,5% CDI", badge: "intocável", bc: "sb-a" },
    { icon: "🔒", bg: "rgba(196,126,58,.1)", nome: "LCAs SICOOB 2030 (×4)", det: "R$105.474 · mar–mai/2030 · 92% CDI", badge: "intocável", bc: "sb-a" },
    { icon: "🔒", bg: "rgba(74,124,89,.12)", nome: "DEB JALLES DEZ/2031", det: "R$70.642 · 15/12/2031 · IPCA+8,5%", badge: "intocável", bc: "sb-a" },
  ],
  resumo: [
    { dot: "w", nome: "Reestruturação jun/26", det: "Custo R$14.698 · ganho +R$692/mês · recupera mai/2028" },
    { dot: "g", nome: "Taxa média subiu 11,81% → 14,86%", det: "+3,05%/ano · R$285/mês das debêntures novas" },
    { dot: "g", nome: "5 blocos intocáveis (RF)", det: "J&F · Jalles · LCAs SICOOB · LCA Original · NTN-B 2050" },
    { dot: "w", nome: "RV concentrada em 3 posições", det: "PSSA3 + ITSA4 + BPAC11 = 60% das ações · rebalancear?" },
  ],
};

const CINTHIA: UserData = {
  nome: "Cinthia",
  conta: "XP 6414212",
  total: 440301,
  rf: 439472,
  rv: 0,
  rf_pct: 100,
  rv_pct: 0,
  saudacao: "Esta é a sua carteira, Cinthia. Posição em 30/06/2026.",
  topbar_sub: "Carteira Cinthia · Conta XP 6414212",
  kpi4_label: "LCI vence em",
  kpi4_val: "mai/2027",
  kpi4_sub: "R$225k · ~10 meses · oportunidade",
  donut_data: [225494, 106961, 86312, 19553, 1152],
  donut_labels: [
    "LCI XP mai/27 (89% CDI)",
    "LCD BRDE fev/36 (92,5% CDI)",
    "LCA Bocom out/30 (92,7% CDI)",
    "LCA Original abr/30 (94% CDI)",
    "LCD BRDE mai/30 (93,5% CDI)",
  ],
  donut_colors: ["#C47E3A", "#B84545", "#4A7C59", "#8B7355", "#6B8E9E"],
  rf_ativos: [
    { n: "LCI BANCO XP S.A. MAI/2027", v: 225494, t: 13.13, cdi: 89.0, venc: "13/05/2027", s: "urgente", nota: "89% CDI isento · aplicada em 13/05/2026 · vence em ~10 meses" },
    { n: "LCA BANCO BOCOM BBM OUT/2030", v: 86312, t: 13.68, cdi: 92.7, venc: "21/10/2030", s: "monitorar", nota: "92,7% CDI isento · banco menor, checar rating" },
    { n: "LCD BRDE FEV/2036 (lote 1 · 55 títulos)", v: 57675, t: 13.64, cdi: 92.5, venc: "11/02/2036", s: "monitorar", nota: "⚠️ Taxa flutuante trancada 10 anos" },
    { n: "LCD BRDE FEV/2036 (lote 2 · 47 títulos)", v: 49286, t: 13.64, cdi: 92.5, venc: "11/02/2036", s: "monitorar", nota: "⚠️ Taxa flutuante trancada 10 anos" },
    { n: "LCA ORIGINAL ABR/2030", v: 19553, t: 13.87, cdi: 94.0, venc: "08/04/2030", s: "intocavel", nota: "94% CDI isento" },
    { n: "LCD BRDE MAI/2030", v: 1152, t: 13.79, cdi: 93.5, venc: "23/05/2030", s: "monitorar", nota: "Resíduo · 1 título" },
  ],
  alertas_list: [
    { cor: "w", titulo: "LCI XP vence em 13/05/2027 — planejar reinvestimento", det: "R$225.494 liberam em ~10 meses. Estudar IPCA+8%+ ou prefixado 14%+." },
    { cor: "r", titulo: "LCD BRDE FEV/2036 — taxa flutuante por 10 anos", det: "R$106.961 (2 lotes) a 92,5% CDI trancados até 2036. Quando Selic cair, rende menos sem saída." },
    { cor: "w", titulo: "LCA Bocom BBM — banco menor, checar rating", det: "R$86.312 a 92,7% CDI · confirmar rating do Bocom BBM." },
    { cor: "g", titulo: "LCA ORIGINAL ABR/2030 — 94% CDI isento", det: "R$19.553 travado até 04/2030, taxa boa." },
  ],
  vencimentos: [
    { icon: "📅", bg: "var(--warning-bg)", nome: "LCI BANCO XP MAI/2027", det: "R$225.494 · 13/05/2027 · 89% CDI · planejar já", badge: "próximo", bc: "sb-w" },
    { icon: "🔒", bg: "rgba(196,126,58,.1)", nome: "LCA ORIGINAL ABR/2030", det: "R$19.553 · 08/04/2030 · 94% CDI", badge: "intocável", bc: "sb-a" },
    { icon: "📅", bg: "rgba(74,124,89,.12)", nome: "LCA Bocom BBM OUT/2030", det: "R$86.312 · 21/10/2030 · 92,7% CDI", badge: "ok", bc: "sb-n" },
    { icon: "⚠️", bg: "var(--danger-bg)", nome: "LCD BRDE FEV/2036 (×2)", det: "R$106.961 · 11/02/2036 · 92,5% CDI flutuante", badge: "monitorar", bc: "sb-r" },
  ],
  resumo: [
    { dot: "r", nome: "LCD BRDE FEV/2036 — risco de longo prazo", det: "R$106.961 em taxa flutuante até 2036. Quando Selic cair, rende menos sem saída." },
    { dot: "g", nome: "LCI XP vence 13/05/2027 — oportunidade", det: "R$225.494 livram em ~10 meses. Travar IPCA+8%+ ou pré 14%+ compensa o LCD BRDE." },
    { dot: "g", nome: "Carteira 100% pós-fixado isento", det: "5 emissores · 6 títulos · média ~92% CDI · sem IR/IOF relevante." },
  ],

};

function buildFamiliar(): UserData {
  const total = PAULO.total + CINTHIA.total;
  const rf = PAULO.rf + CINTHIA.rf;
  const rv = PAULO.rv + CINTHIA.rv;
  // Donut consolidado por classe estratégica
  const donut_data = [
    142000 + CINTHIA.rf_ativos.filter((x) => /LCI|LCA/.test(x.n)).reduce((s, x) => s + x.v, 0),
    245000,
    95000,
    61000 + 106833, // XPAG + LCD BRDE
    116000,
  ];
  return {
    nome: "Família Furtado",
    conta: "Consolidado Paulo + Cinthia",
    total,
    rf,
    rv,
    rf_pct: (rf / total) * 100,
    rv_pct: (rv / total) * 100,
    saudacao: "Bom dia, Cinthia. Visão consolidada da família.",
    topbar_sub: "Visão familiar · Cinthia como gestora",
    kpi4_label: "Breakeven do plano",
    kpi4_val: "mai/2028",
    kpi4_sub: "22 meses · +R$ 692/mês",
    donut_data,
    donut_labels: ["LCA/LCI pós-fix.", "Inflação IPCA+", "Prefixado isento", "Agro + LCD flut.", "Renda variável"],
    donut_colors: ["#C47E3A", "#4A7C59", "#8B7355", "#B8892A", "#A89880"],
    rf_ativos: [
      ...PAULO.rf_ativos.map((x) => ({ ...x, n: `[Paulo] ${x.n}` })),
      ...CINTHIA.rf_ativos.map((x) => ({ ...x, n: `[Cinthia] ${x.n}` })),
    ],
    rv_ativos: PAULO.rv_ativos,
    alertas_list: [
      ...PAULO.alertas_list.map((a) => ({ ...a, titulo: `[Paulo] ${a.titulo}` })),
      ...CINTHIA.alertas_list.map((a) => ({ ...a, titulo: `[Cinthia] ${a.titulo}` })),
    ],
    vencimentos: [
      ...PAULO.vencimentos.map((v) => ({ ...v, nome: `[Paulo] ${v.nome}` })),
      ...CINTHIA.vencimentos.map((v) => ({ ...v, nome: `[Cinthia] ${v.nome}` })),
    ],
    resumo: [
      { dot: "w", nome: "Reestruturação jun/26 (Paulo)", det: "Custo R$14.698 · ganho +R$692/mês · recupera mai/2028" },
      { dot: "g", nome: "Cinthia: LCI XP vence mai/2027", det: "R$222k livram em ~10 meses — travar IPCA+8%+ ou pré 14%+." },
      { dot: "r", nome: "Cinthia: LCD BRDE FEV/2036", det: "R$106k a taxa flutuante trancada por 10 anos." },
      { dot: "g", nome: "4 blocos intocáveis (Paulo)", det: "J&F · Jalles · LCAs · NTN-B 2050 até mai/2028." },
    ],
  };
}

const FAMILIAR = buildFamiliar();

export function getUser(id: ProfileId): UserData {
  if (id === "paulo") return PAULO;
  if (id === "cinthia") return CINTHIA;
  return FAMILIAR;
}
