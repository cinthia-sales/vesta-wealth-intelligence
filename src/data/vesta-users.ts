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

const PAULO: UserData = {
  nome: "Paulo Henrique",
  conta: "XP 5296823",
  total: 648476,
  rf: 532076,
  rv: 116399,
  rf_pct: 82.1,
  rv_pct: 17.9,
  saudacao: "Cinthia, você está gerenciando a carteira do Paulo.",
  topbar_sub: "Carteira Paulo sob gestão · Conta XP 5296823",
  kpi4_label: "Breakeven do plano",
  kpi4_val: "mai/2028",
  kpi4_sub: "22 meses · +R$ 692/mês",
  donut_data: [142000, 245000, 95000, 61000, 116000],
  donut_labels: ["LCA pós-fix. isento", "Inflação IPCA+", "Prefixado isento", "XPAG11 agro", "Renda variável"],
  donut_colors: ["#C47E3A", "#4A7C59", "#8B7355", "#f59e0b", "#A89880"],
  rf_ativos: [
    { n: "NTN-B AGO/2026 (IPCA+9,45%)", v: 96511, t: 15.47, cdi: 120.7, venc: "15/08/2026", s: "urgente" },
    { n: "DEB J&F FEV/2028 (15,15%)", v: 94830, t: 15.15, cdi: 118.4, venc: "21/02/2028", s: "intocavel" },
    { n: "DEB JALLES DEZ/2031 (IPCA+8,5%)", v: 70642, t: 14.47, cdi: 113.0, venc: "15/12/2031", s: "intocavel" },
    { n: "XPAG11 XP Crédito Agro", v: 61373, t: null, cdi: null, venc: "—", s: "monitorar" },
    { n: "NTN-B 2050 (IPCA+4,45%)", v: 53341, t: 8.55, cdi: 66.8, venc: "15/08/2050", s: "monitorar" },
    { n: "LCA SICOOB MAR/2030 (92% CDI)", v: 37749, t: 13.57, cdi: 106.1, venc: "21/03/2030", s: "intocavel" },
    { n: "LCA SICOOB ABR/2030 (92% CDI)", v: 28389, t: 13.57, cdi: 106.1, venc: "04/04/2030", s: "intocavel" },
    { n: "LCA ORIGINAL DEZ/2028 (92,5%)", v: 26700, t: 13.61, cdi: 106.5, venc: "18/12/2028", s: "intocavel" },
    { n: "LCA SICOOB MAI/2030 (92% CDI)", v: 22491, t: 13.57, cdi: 106.1, venc: "10/05/2030", s: "intocavel" },
    { n: "NTN-B 2050 (IPCA+4,65%)", v: 23088, t: 8.74, cdi: 68.3, venc: "15/08/2050", s: "monitorar" },
    { n: "LCA SICOOB ABR/2030 B (92%)", v: 16842, t: 13.57, cdi: 106.1, venc: "15/04/2030", s: "intocavel" },
    { n: "LCA ORIGINAL MAR/2030 (94%)", v: 10418, t: 13.87, cdi: 108.4, venc: "06/03/2030", s: "intocavel" },
  ],
  rv_ativos: [
    { n: "PSSA3", v: "R$ 28.995", pm: "R$26,95 · 544 ações", r: "+97,75%", rc: "good", cls: "ação", sb: "sb-g" },
    { n: "ITSA4", v: "R$ 21.149", pm: "R$8,87 · 1.576 ações", r: "+51,28%", rc: "good", cls: "ação", sb: "sb-g" },
    { n: "BPAC11", v: "R$ 18.632", pm: "R$86,85 · 342 ações", r: "-37,27% ⚠️", rc: "bad", cls: "ação", sb: "sb-r" },
    { n: "TGRE11", v: "R$ 44.155", pm: "Aplicado R$50.000", r: "-11,69% capital", rc: "bad", cls: "FII", sb: "sb-w" },
    { n: "LFTB11", v: "R$ 20.301", pm: "165 cotas", r: "+CDI", rc: "good", cls: "ETF", sb: "sb-a" },
    { n: "GOLD11", v: "R$ 3.976", pm: "178 cotas", r: "+ouro", rc: "good", cls: "ETF", sb: "sb-a" },
    { n: "Outros ações", v: "R$ 9.392", pm: "ITUB4 + outros", r: "variado", rc: "muted", cls: "ação", sb: "sb-n" },
  ],
  alertas_list: [
    { cor: "r", titulo: "NTN-B AGO/2026 — vence em 45 dias", det: "R$96.511 liberam em 15/08. Decidir destino AGORA." },
    { cor: "w", titulo: "BPAC11 — -37,27% sobre preço médio", det: "Revisar tese ou definir stop loss." },
    { cor: "g", titulo: "Come-cotas XPAG11 em nov/2026", det: "Verificar se ainda compensa vs LCA direta." },
  ],
  vencimentos: [
    { icon: "🔴", bg: "var(--danger-bg)", nome: "NTN-B AGO/2026", det: "R$96.511 · 15/08/2026 · 45 dias", badge: "urgente", bc: "sb-r" },
    { icon: "🔒", bg: "rgba(196,126,58,.1)", nome: "DEB J&F FEV/2028", det: "R$94.830 · 21/02/2028 · 15,15% isento", badge: "intocável", bc: "sb-a" },
    { icon: "🔒", bg: "rgba(196,126,58,.1)", nome: "LCA ORIGINAL DEZ/2028", det: "R$26.700 · 18/12/2028 · 92,5% CDI", badge: "intocável", bc: "sb-a" },
    { icon: "🔒", bg: "rgba(196,126,58,.1)", nome: "LCAs SICOOB 2030 (×4)", det: "R$105.474 · mar–mai/2030 · 92% CDI", badge: "intocável", bc: "sb-a" },
  ],
  resumo: [
    { dot: "w", nome: "Reestruturação jun/26", det: "Custo R$14.698 · ganho +R$692/mês · recupera mai/2028" },
    { dot: "g", nome: "Taxa média subiu 11,81% → 14,86%", det: "+3,05%/ano · R$285/mês das debêntures novas" },
    { dot: "g", nome: "4 blocos intocáveis", det: "J&F · Jalles · LCAs · NTN-B 2050 — não tocar antes de mai/2028" },
  ],
};

const CINTHIA: UserData = {
  nome: "Cinthia",
  conta: "XP 6414212",
  total: 435700,
  rf: 435700,
  rv: 0,
  rf_pct: 100,
  rv_pct: 0,
  saudacao: "Esta é a sua carteira, Cinthia.",
  topbar_sub: "Carteira Cinthia · Conta XP 6414212",
  kpi4_label: "LCI vence em",
  kpi4_val: "mai/2027",
  kpi4_sub: "R$222k · ~10 meses · oportunidade",
  donut_data: [222000, 106833, 86186, 20682],
  donut_labels: ["LCI XP mai/27", "LCD BRDE 2036", "LCA Bocom 2030", "LCAs orig."],
  donut_colors: ["#C47E3A", "#B84545", "#4A7C59", "#8B7355"],
  rf_ativos: [
    { n: "LCI BANCO XP S.A. MAI/2027", v: 222000, t: 13.11, cdi: 92.6, venc: "mai/2027", s: "urgente", nota: "89% CDI isento · vence em ~10 meses" },
    { n: "LCD BRDE FEV/2036 (92,5% CDI)", v: 106833, t: 13.64, cdi: 106.9, venc: "fev/2036", s: "monitorar", nota: "⚠️ Taxa flutuante trancada 10 anos" },
    { n: "LCA BANCO BOCOM BBM OUT/2030", v: 86186, t: null, cdi: null, venc: "out/2030", s: "monitorar", nota: "Taxa a confirmar · banco menor" },
    { n: "LCA ORIGINAL ABR/2030", v: 19533, t: null, cdi: null, venc: "abr/2030", s: "monitorar", nota: "Taxa a confirmar" },
    { n: "LCD BRDE MAI/2030", v: 1149, t: null, cdi: null, venc: "mai/2030", s: "monitorar", nota: "Resíduo" },
  ],
  alertas_list: [
    { cor: "w", titulo: "LCI XP vence em mai/2027 — planejar reinvestimento", det: "R$222k liberam em ~10 meses. Estudar IPCA+8%+ ou prefixado 14%+." },
    { cor: "r", titulo: "LCD BRDE FEV/2036 — taxa flutuante por 10 anos", det: "R$106.833 a 92,5% CDI trancados até 2036. Quando Selic cair, rende menos sem saída." },
    { cor: "w", titulo: "LCA Bocom BBM — confirmar taxa e rating", det: "Banco menor, checar rating e qual o % CDI contratado." },
    { cor: "g", titulo: "LCA ORIGINAL ABR/2030 — confirmar taxa", det: "Verificar se é 92% ou 94% CDI." },
  ],
  vencimentos: [
    { icon: "📅", bg: "var(--warning-bg)", nome: "LCI BANCO XP MAI/2027", det: "R$222.000 · mai/2027 · 89% CDI · planejar já", badge: "próximo", bc: "sb-w" },
    { icon: "⚠️", bg: "var(--danger-bg)", nome: "LCD BRDE FEV/2036", det: "R$106.833 · fev/2036 · 92,5% CDI flutuante", badge: "monitorar", bc: "sb-r" },
    { icon: "📅", bg: "rgba(196,126,58,.08)", nome: "LCA Bocom BBM OUT/2030", det: "R$86.186 · out/2030 · taxa a confirmar", badge: "ok", bc: "sb-n" },
  ],
  resumo: [
    { dot: "w", nome: "LCD BRDE FEV/2036 — risco de longo prazo", det: "R$106k em taxa flutuante até 2036. Quando Selic cair, rende menos sem saída." },
    { dot: "g", nome: "LCI XP vence mai/2027 — oportunidade", det: "R$222k livram em ~10 meses. Travar IPCA+8%+ ou prefixado 14%+ compensa o LCD BRDE." },
    { dot: "w", nome: "Taxas a confirmar", det: "Bocom BBM e LCA ORIGINAL — confirmar % CDI na XP." },
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
