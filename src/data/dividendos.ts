// ============= Rendimentos recorrentes (proventos / dividendos / juros) =============
// Estimativas anuais baseadas em histórico dos últimos 12 meses (jul/2025 – jun/2026)
// Fonte: relatórios XP + status invest · valores líquidos aproximados

export type Provento = {
  ticker: string;
  classe: "Ação" | "FII" | "FI-Agro" | "ETF";
  dono: "Paulo" | "Cinthia";
  valor_posicao: number;
  dy_pct: number;        // dividend yield anual estimado
  provento_ano: number;  // R$ estimado por ano
  provento_mes: number;  // R$ estimado por mês (média)
  freq: "mensal" | "trimestral" | "semestral" | "anual";
  nota?: string;
};

// Set de tickers pagadores — usado para marcar linhas na Posição
export const DIVIDEND_TICKERS = new Set<string>([
  "PSSA3", "ITSA4", "BPAC11", "ITUB4", "CXSE3", "CPFE3", "GGBR4",
  "ABEV3", "B3SA3", "PRIO3", "RENT3", "ORVR3",
  "TGRE11", "XPAG11", "LFTB11",
]);

export const PROVENTOS: Provento[] = [
  // ---- FIIs / FI-Agro (mensais, isentos de IR PF) ----
  { ticker: "XPAG11", classe: "FI-Agro", dono: "Paulo", valor_posicao: 61373, dy_pct: 12.8, provento_ano: 7856, provento_mes: 655, freq: "mensal", nota: "Isento IR · CDI+ agro" },
  { ticker: "TGRE11", classe: "FII", dono: "Paulo", valor_posicao: 44156, dy_pct: 9.4,  provento_ano: 4151, provento_mes: 346, freq: "mensal", nota: "Isento IR · sob pressão" },
  { ticker: "LFTB11", classe: "ETF", dono: "Paulo", valor_posicao: 20302, dy_pct: 11.5, provento_ano: 2335, provento_mes: 195, freq: "mensal", nota: "ETF Tesouro Selic" },

  // ---- Ações — pagadoras fortes ----
  { ticker: "PSSA3", classe: "Ação", dono: "Paulo", valor_posicao: 28995, dy_pct: 9.2, provento_ano: 2667, provento_mes: 222, freq: "trimestral", nota: "Porto Seguro · JCP + div." },
  { ticker: "ITSA4", classe: "Ação", dono: "Paulo", valor_posicao: 21150, dy_pct: 7.8, provento_ano: 1650, provento_mes: 137, freq: "semestral", nota: "Itaúsa · JCP" },
  { ticker: "BPAC11", classe: "Ação", dono: "Paulo", valor_posicao: 18632, dy_pct: 4.1, provento_ano: 764,  provento_mes: 64,  freq: "trimestral" },
  { ticker: "CXSE3",  classe: "Ação", dono: "Paulo", valor_posicao: 2959, dy_pct: 8.5, provento_ano: 251,  provento_mes: 21, freq: "semestral", nota: "Caixa Seguridade" },
  { ticker: "CPFE3",  classe: "Ação", dono: "Paulo", valor_posicao: 2831, dy_pct: 9.6, provento_ano: 272,  provento_mes: 23, freq: "semestral", nota: "CPFL · dividendos altos" },
  { ticker: "ITUB4",  classe: "Ação", dono: "Paulo", valor_posicao: 2971, dy_pct: 5.5, provento_ano: 163,  provento_mes: 14, freq: "trimestral" },
  { ticker: "ABEV3",  classe: "Ação", dono: "Paulo", valor_posicao: 2766, dy_pct: 5.0, provento_ano: 138,  provento_mes: 12, freq: "semestral" },
  { ticker: "B3SA3",  classe: "Ação", dono: "Paulo", valor_posicao: 2165, dy_pct: 6.2, provento_ano: 134,  provento_mes: 11, freq: "trimestral" },
  { ticker: "GGBR4",  classe: "Ação", dono: "Paulo", valor_posicao: 2781, dy_pct: 6.0, provento_ano: 167,  provento_mes: 14, freq: "semestral" },
  { ticker: "PRIO3",  classe: "Ação", dono: "Paulo", valor_posicao: 2100, dy_pct: 3.2, provento_ano: 67,   provento_mes: 6,  freq: "anual" },
  { ticker: "RENT3",  classe: "Ação", dono: "Paulo", valor_posicao: 1735, dy_pct: 1.8, provento_ano: 31,   provento_mes: 3,  freq: "anual" },
  { ticker: "ORVR3",  classe: "Ação", dono: "Paulo", valor_posicao: 2919, dy_pct: 0,   provento_ano: 0,    provento_mes: 0,  freq: "anual", nota: "Não paga (reinveste)" },
];
