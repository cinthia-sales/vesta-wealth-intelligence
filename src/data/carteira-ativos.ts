/*
 * Catálogo único de ativos da carteira (RF + RV) — alimenta os dropdowns
 * da tela Custo de Oportunidade e a linha dura retrospectiva.
 *
 * anoCompra das ações é estimado a partir do histórico de PM — ajustar
 * quando houver a data exata das notas de corretagem.
 */

export type ClasseAtivo = "rv" | "rf";
export type Dono = "paulo" | "cinthia";

export type AtivoCarteira = {
  id: string;
  dono: Dono;
  classe: ClasseAtivo;
  nome: string;
  valorMercado: number;
  /** ações */
  qtd?: number;
  pm?: number;
  dyEsperado?: number;      // %/ano
  divRecebidos?: number;    // R$ acumulados (não reinvestidos)
  anoCompra?: number;
  /** renda fixa */
  taxaBruta?: number;       // %/ano equivalente hoje
  isento?: boolean;
  vencimento?: string;
  intocavel?: boolean;      // tese registrada em Regras
};

export const CARTEIRA: AtivoCarteira[] = [
  /* ── RV Paulo ── */
  { id: "vale3",  dono: "paulo", classe: "rv", nome: "VALE3 · Vale",           valorMercado: 14562, qtd: 200,  pm: 87.15, dyEsperado: 8, divRecebidos: 6500, anoCompra: 2021 },
  { id: "pssa3",  dono: "paulo", classe: "rv", nome: "PSSA3 · Porto Seguro",   valorMercado: 28995, qtd: 544,  pm: 26.95, dyEsperado: 5, divRecebidos: 0,    anoCompra: 2019 },
  { id: "itsa4",  dono: "paulo", classe: "rv", nome: "ITSA4 · Itaúsa",         valorMercado: 21149, qtd: 1576, pm: 8.87,  dyEsperado: 6, divRecebidos: 0,    anoCompra: 2020 },
  { id: "bpac11", dono: "paulo", classe: "rv", nome: "BPAC11 · BTG Pactual",   valorMercado: 18632, qtd: 342,  pm: 86.85, dyEsperado: 3, divRecebidos: 0,    anoCompra: 2021 },
  { id: "itub4",  dono: "paulo", classe: "rv", nome: "ITUB4 + outras ações",   valorMercado: 12362, dyEsperado: 6, divRecebidos: 0, anoCompra: 2020 },

  /* ── RF Paulo ── */
  { id: "xpag11",   dono: "paulo", classe: "rf", nome: "XPAG11 · XP Crédito Agro",        valorMercado: 61373, taxaBruta: 12.5, isento: true },
  { id: "ntnb50a",  dono: "paulo", classe: "rf", nome: "NTN-B 2050 · IPCA+4,45%",         valorMercado: 53341, taxaBruta: 10.2, isento: false, vencimento: "08/2050" },
  { id: "ntnb50b",  dono: "paulo", classe: "rf", nome: "NTN-B 2050 · IPCA+4,65%",         valorMercado: 23088, taxaBruta: 10.4, isento: false, vencimento: "08/2050" },
  { id: "ntnb26",   dono: "paulo", classe: "rf", nome: "NTN-B AGO/2026 · IPCA+9,45%",     valorMercado: 96511, taxaBruta: 15.5, isento: false, vencimento: "08/2026" },
  { id: "debjf",    dono: "paulo", classe: "rf", nome: "DEB J&F FEV/2028 · 15,15% pré",   valorMercado: 94830, taxaBruta: 15.15, isento: true, vencimento: "02/2028", intocavel: true },
  { id: "debjalles",dono: "paulo", classe: "rf", nome: "DEB Jalles DEZ/2031 · IPCA+8,5%", valorMercado: 70642, taxaBruta: 14.5, isento: true, vencimento: "12/2031", intocavel: true },

  /* ── RF Cínthia ── */
  { id: "lcixp",  dono: "cinthia", classe: "rf", nome: "LCI XP MAI/2027 · 89% CDI",        valorMercado: 225494, taxaBruta: 13.13, isento: true, vencimento: "05/2027" },
  { id: "lcd36",  dono: "cinthia", classe: "rf", nome: "LCD BRDE FEV/2036 · 92,5% CDI",    valorMercado: 106961, taxaBruta: 13.64, isento: true, vencimento: "02/2036" },
  { id: "lcabb",  dono: "cinthia", classe: "rf", nome: "LCA Bocom BBM OUT/2030 · 92,7%",   valorMercado: 86312,  taxaBruta: 13.67, isento: true, vencimento: "10/2030" },
  { id: "lcaori", dono: "cinthia", classe: "rf", nome: "LCA Original ABR/2030 · 94% CDI",  valorMercado: 19553,  taxaBruta: 13.87, isento: true, vencimento: "04/2030", intocavel: true },
];

/* ── Histórico anual (%) para a linha dura retrospectiva ── */
export const CDI_HIST: Record<number, number> = {
  2019: 5.96, 2020: 2.76, 2021: 4.42, 2022: 12.39, 2023: 13.04,
  2024: 10.88, 2025: 14.00, 2026: 7.20, // 2026 = acumulado até jul
};

export const IPCA_HIST: Record<number, number> = {
  2019: 4.31, 2020: 4.52, 2021: 10.06, 2022: 5.79, 2023: 4.62,
  2024: 4.83, 2025: 5.30, 2026: 2.70, // 2026 = acumulado até jul
};

const ANO_ATUAL = 2026;

function fatorAcumulado(hist: Record<number, number>, desde: number): number {
  let f = 1;
  for (let ano = desde; ano <= ANO_ATUAL; ano++) f *= 1 + (hist[ano] ?? 0) / 100;
  return f;
}

export const cdiAcumuladoDesde = (ano: number) => fatorAcumulado(CDI_HIST, ano) - 1;
export const ipcaAcumuladoDesde = (ano: number) => fatorAcumulado(IPCA_HIST, ano) - 1;
export const anosNaCarteira = (anoCompra: number) => ANO_ATUAL - anoCompra;

/* ── Linha dura: nota retrospectiva de uma posição RV ── */
export type NotaRetro = {
  anos: number;
  valorInvestido: number;
  retornoTotalPct: number;   // (mercado + dividendos) / investido − 1
  cdiPeriodoPct: number;
  ipcaPeriodoPct: number;
  perdeuDoCDI: boolean;
  perdaNominal: boolean;     // mercado (sem dividendos) < investido
  perdaReal: boolean;        // retorno total < inflação
  gapVsCdi: number;          // R$ que faltaram vs CDI
};

export function notaRetrospectiva(a: AtivoCarteira): NotaRetro | null {
  if (a.classe !== "rv" || !a.anoCompra) return null;
  const investido = a.qtd && a.pm ? a.qtd * a.pm : a.valorMercado; // agrupado: sem PM confiável
  const total = a.valorMercado + (a.divRecebidos ?? 0);
  const cdi = cdiAcumuladoDesde(a.anoCompra);
  const ipca = ipcaAcumuladoDesde(a.anoCompra);
  const retorno = investido > 0 ? total / investido - 1 : 0;
  return {
    anos: anosNaCarteira(a.anoCompra),
    valorInvestido: investido,
    retornoTotalPct: retorno,
    cdiPeriodoPct: cdi,
    ipcaPeriodoPct: ipca,
    perdeuDoCDI: retorno < cdi,
    perdaNominal: a.valorMercado < investido,
    perdaReal: retorno < ipca,
    gapVsCdi: investido * (1 + cdi) - total,
  };
}

/* ── Giros registrados pela tela Custo de Oportunidade ── */
export type GiroRegistrado = {
  id: string;
  criadoEm: string;
  dono: Dono;
  origem: string;          // nome do ativo A
  destino: string;         // descrição do destino B
  capital: number;
  custoSaida: number;
  ganhoMesEstimado: number;
  horizonteAnos: number;
};

const GIROS_KEY = "vesta.giros.registrados";

export function carregarGiros(): GiroRegistrado[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(GIROS_KEY);
    return raw ? (JSON.parse(raw) as GiroRegistrado[]) : [];
  } catch {
    return [];
  }
}

export function salvarGiro(g: GiroRegistrado) {
  if (typeof window === "undefined") return;
  const list = carregarGiros();
  list.push(g);
  window.localStorage.setItem(GIROS_KEY, JSON.stringify(list));
}

export function removerGiro(id: string) {
  if (typeof window === "undefined") return;
  const list = carregarGiros().filter((g) => g.id !== id);
  window.localStorage.setItem(GIROS_KEY, JSON.stringify(list));
}
