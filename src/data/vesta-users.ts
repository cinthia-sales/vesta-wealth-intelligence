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
  total: number;
  rf: number;
  rv: number;
  rf_ativos: RFAtivo[];
  rv_ativos?: UserData["rv_ativos"];
};

export const STORAGE_KEYS = {
  paulo: "vesta_posicao_paulo",
  cinthia: "vesta_posicao_cinthia",
} as const;

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
  total: 717856, // Fonte: print XP 04/07/2026 20:30 · saldo R$2.122 + investido R$715.734
  rf: 484415,
  rv: 231319,
  rf_pct: 67.8,
  rv_pct: 32.2,
  saudacao: "Cinthia, você está gerenciando a carteira do Paulo.",
  topbar_sub: "Carteira Paulo sob gestão · Conta XP 5296823",
  kpi4_label: "Breakeven do plano",
  kpi4_val: "mai/2028",
  kpi4_sub: "22 meses · +R$ 692/mês",
  data_referencia: "2026-07-02",
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
  donut_colors: ["#A11D3E", "#4E7A5C", "#D97706", "#3E5E7A", "#B8546E", "#7A1530", "#5C2B4E"],
  rf_ativos: [
    { n: "NTN-B AGO/2026 (IPCA+9,45%)", v: 96512, t: 15.47, cdi: 120.7, venc: "15/08/2026", s: "urgente" },
    { n: "DEB ER ATIVO J&F FEV/2028 (+15,15%)", v: 90662, t: 15.15, cdi: 118.4, venc: "21/02/2028", s: "intocavel", nota: "Lote principal · 87 debêntures" },
    { n: "DEB JALLES MACHADO DEZ/2031 (IPCA+8,5%)", v: 70642, t: 14.47, cdi: 113.0, venc: "15/12/2031", s: "intocavel" },
    { n: "NTN-B AGO/2050 (IPCA+4,45%)", v: 53341, t: 8.55, cdi: 66.8, venc: "15/08/2050", s: "estrategico", nota: "Aplicada em 09/2021 · nunca vender com deságio" },
    { n: "LCA SICOOB MAR/2030 (92% CDI)", v: 37750, t: 13.57, cdi: 106.1, venc: "21/03/2030", s: "intocavel" },
    { n: "LCA SICOOB ABR/2030 (92% CDI · 24 títulos)", v: 28390, t: 13.57, cdi: 106.1, venc: "04/04/2030", s: "intocavel" },
    { n: "LCA ORIGINAL DEZ/2028 (92,5% CDI)", v: 26700, t: 13.61, cdi: 106.5, venc: "18/12/2028", s: "intocavel" },
    { n: "NTN-B AGO/2050 (IPCA+4,65%)", v: 23089, t: 8.74, cdi: 68.3, venc: "15/08/2050", s: "estrategico", nota: "Aplicada em 10/2021 · nunca vender com deságio" },
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
    { n: "XPAG11 (XP Crédito Agro)", v: "R$ 61.373", pm: "Aplicado R$62.000", r: "-1,01%", rc: "bad", cls: "FI", sb: "sb-a", retorno_posicao: "-1,01%", retorno_fundo_historico: "+42,94%", come_cotas_aviso: "⚠️ Come-cotas novembro" },
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
  nome: "Cínthia",
  conta: "XP 6414212",
  total: 440301,
  rf: 439472,
  rv: 0,
  rf_pct: 100,
  rv_pct: 0,
  data_referencia: "2026-06-30",
  saudacao: "Esta é a sua carteira, Cínthia. Posição em 30/06/2026.",
  topbar_sub: "Carteira Cínthia · Conta XP 6414212",
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
  donut_colors: ["#A11D3E", "#C0392B", "#4E7A5C", "#B8546E", "#3E5E7A"],
  rf_ativos: [
    { n: "LCI BANCO XP S.A. MAI/2027", v: 225494, t: 13.13, cdi: 89.0, venc: "13/05/2027", s: "planejar", nota: "89% CDI isento · vence mai/2027 · planejar reinvestimento nov/2026 · meta IPCA+8%+ ou pré 14%+ isento" },
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
      { dot: "g", nome: "Cinthia: LCI XP vence mai/2027", det: "R$222k livram em ~10 meses — travar IPCA+8%+ ou pré 14%+." },
      { dot: "r", nome: "Cinthia: LCD BRDE FEV/2036", det: "R$106k a taxa flutuante trancada por 10 anos." },
      { dot: "g", nome: "4 blocos intocáveis (Paulo)", det: "J&F · Jalles · LCAs · NTN-B 2050 até mai/2028." },
    ],
    data_referencia: dataRef,
  };
}

function mergeSnapshot(base: UserData, snap: LocalSnapshot): UserData {
  const { total, rf, rv } = snap;
  return {
    ...base,
    total,
    rf,
    rv,
    rf_pct: total > 0 ? (rf / total) * 100 : 0,
    rv_pct: total > 0 ? (rv / total) * 100 : 0,
    rf_ativos: snap.rf_ativos,
    rv_ativos: snap.rv_ativos ?? base.rv_ativos,
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
    { n: "Multiagro FIDC Mezanino", v: 402964, t: 19.18, cdi: 130, venc: "—", s: "urgente", nota: "BTG/Menthor · orientação: sair" },
    { n: "Multiplica FIDC Sênior", v: 128003, t: 18.14, cdi: 123, venc: "—", s: "urgente", nota: "BTG/Menthor · orientação: sair" },
    { n: "CDB Daycoval", v: 68629, t: 13, cdi: null, venc: "11/2027", s: "monitorar", nota: "BTG/Menthor · 13% pré · orientação: manter" },
    { n: "NTN-B-P 2045", v: 48641, t: 11.63, cdi: null, venc: "05/2045", s: "estrategico", nota: "BTG/Menthor · IPCA+6,13% · estratégico" },
    { n: "BTG Tesouro Selic", v: 98414, t: 14.75, cdi: 100, venc: "—", s: "intocavel", nota: "BTG/Menthor · 100% CDI · ok" },
    { n: "BTG Digital Tesouro Selic", v: 10189, t: 14.75, cdi: 100, venc: "—", s: "intocavel", nota: "BTG/Menthor · 100% CDI · ok" },
    { n: "LTN Pré 2032", v: 10113, t: 13.53, cdi: null, venc: "01/2032", s: "intocavel", nota: "BTG/Menthor · 13,53% pré · ok" },
    { n: "Previdência BTG 7 fundos", v: 152588, t: null, cdi: null, venc: "—", s: "monitorar", nota: "BTG/Menthor · TAF ~1% · auditar" },
    { n: "CDB C6 Comodidade", v: 71446, t: 14.75, cdi: 100, venc: "—", s: "intocavel", nota: "C6 Bank · 100% CDI · ok" },
    { n: "Brasilprev PGBL FIX X", v: 103408, t: null, cdi: null, venc: "—", s: "urgente", nota: "Brasilprev · TAF 1,8% · portabilidade urgente" },
  ],
  rv_ativos: [
    { n: "Western Asset US500 BTG", v: "R$ 26.661", pm: "BTG/Menthor", r: "+13,1% em 2026", rc: "good", cls: "RV", sb: "sb-g" },
    { n: "Alpha Key FICFIA", v: "R$ 15.086", pm: "BTG/Menthor", r: "+0,57% em 2026", rc: "muted", cls: "RV", sb: "sb-w" },
    { n: "Western Asset US500 C6", v: "R$ 57.003", pm: "C6 Bank", r: "+13,1% em 2026", rc: "good", cls: "RV", sb: "sb-g" },
  ],
  alertas_list: [
    { cor: "r", titulo: "Brasilprev PGBL FIX X — portabilidade urgente", det: "R$ 103.408 com TAF 1,8%. Priorizar análise de portabilidade." },
    { cor: "r", titulo: "FIDCs marcados para saída", det: "Multiagro Mezanino + Multiplica Sênior somam R$ 530.967." },
    { cor: "w", titulo: "Previdência BTG precisa auditoria", det: "R$ 152.588 em 7 fundos com TAF aproximada de 1%." },
    { cor: "w", titulo: "Alpha Key FICFIA — sair", det: "R$ 15.086 com retorno de apenas +0,57% em 2026." },
  ],
  vencimentos: [
    { icon: "🔴", bg: "var(--danger-bg)", nome: "CDB Daycoval", det: "R$ 68.629 · 11/2027 · 13% pré", badge: "manter", bc: "sb-w" },
    { icon: "📅", bg: "rgba(74,124,89,.12)", nome: "LTN Pré 2032", det: "R$ 10.113 · 01/2032 · 13,53% pré", badge: "ok", bc: "sb-g" },
    { icon: "🏛", bg: "rgba(74,124,89,.12)", nome: "NTN-B-P 2045", det: "R$ 48.641 · 05/2045 · IPCA+6,13%", badge: "estratégico", bc: "sb-g" },
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
    { n: "AÇÕES BRASIL — cesta demonstrativa", v: "R$ 125.000", pm: "diversificada", r: "+12,4%", rc: "good", cls: "ações", sb: "sb-g" },
    { n: "ETF GLOBAL EXEMPLUM", v: "R$ 100.000", pm: "exposição internacional", r: "+8,1%", rc: "good", cls: "ETF", sb: "sb-a" },
  ],
  alertas_list: [
    { cor: "w", titulo: "CDB demonstrativo vence em out/2027", det: "R$ 50.000 · planejar o reinvestimento com antecedência." },
    { cor: "g", titulo: "Diversificação internacional dentro da meta", det: "ETF global representa 12% do patrimônio demonstrativo." },
  ],
  vencimentos: [
    { icon: "📅", bg: "var(--warning-bg)", nome: "CDB BANCO EXEMPLUM 2027", det: "R$ 50.000 · 10/10/2027 · 112% CDI", badge: "planejar", bc: "sb-w" },
    { icon: "🔒", bg: "rgba(74,124,89,.12)", nome: "LCA BANCO AURORA 2029", det: "R$ 190.000 · 21/11/2029 · 94% CDI", badge: "monitorar", bc: "sb-g" },
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
    { n: "AÇÕES DIVIDENDOS — cesta demonstrativa", v: "R$ 150.000", pm: "8 empresas", r: "+10,8%", rc: "good", cls: "ações", sb: "sb-g" },
    { n: "FIIs — cesta demonstrativa", v: "R$ 100.000", pm: "5 fundos", r: "+5,6%", rc: "good", cls: "FII", sb: "sb-a" },
  ],
  alertas_list: [
    { cor: "w", titulo: "Renda variável acima do perfil-base", det: "44,6% do patrimônio demonstrativo; avaliar rebalanceamento gradual." },
    { cor: "g", titulo: "Fluxo de dividendos diversificado", det: "Cesta fictícia distribuída entre ações e fundos imobiliários." },
  ],
  vencimentos: [
    { icon: "📅", bg: "var(--warning-bg)", nome: "CDB BANCO ROMA 2028", det: "R$ 140.000 · 18/02/2028 · 115% CDI", badge: "monitorar", bc: "sb-w" },
    { icon: "🔒", bg: "rgba(74,124,89,.12)", nome: "TESOURO PREFIXADO 2031", det: "R$ 100.000 · 01/01/2031 · 13,2%", badge: "estratégico", bc: "sb-g" },
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
  if (id.startsWith("member:")) return loadMemberFromStorage(id.slice("member:".length));
  if (id.startsWith("domus:")) return buildDomusConsolidated(id.slice("domus:".length));
  return buildFamiliar(
    loadFromStorage("paulo", PAULO),
    loadFromStorage("cinthia", CINTHIA),
  );
}
