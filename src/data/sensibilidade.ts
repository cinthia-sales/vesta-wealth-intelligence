// Mapeamento curado de sensibilidade por ativo/classe.
// Fonte de referência sinalizada em cada item (RI, Tesouro, Anbima etc.).

export type Fator = {
  nome: string;
  impacto: "alto" | "medio" | "baixo";
  direcao: string; // "sobe → beneficia" ou "sobe → prejudica" etc.
};

export type FonteRef = {
  label: string;
  url?: string;
};

export type Sensibilidade = {
  titulo: string;
  classe: string;
  resumo: string;
  fatores: Fator[];
  observacao?: string;
  fontes: FonteRef[];
};

// ---------- Mapeamentos por ticker (RV) ----------
const TICKER_MAP: Record<string, Sensibilidade> = {
  PSSA3: {
    titulo: "PSSA3 · Porto Seguro",
    classe: "Ação · Seguros",
    resumo: "Empresa de seguros e serviços financeiros. Sensível a sinistralidade, juros longos (aplicações técnicas) e crescimento de prêmios.",
    fatores: [
      { nome: "Selic / CDI", impacto: "alto", direcao: "Selic alta → maior receita financeira das reservas técnicas (positivo)" },
      { nome: "Sinistralidade auto", impacto: "alto", direcao: "Roubo/furto/acidentes sobem → margem cai" },
      { nome: "Inadimplência crédito", impacto: "medio", direcao: "Vertical financeira sofre em ciclo de crédito ruim" },
      { nome: "Resultado trimestral", impacto: "alto", direcao: "ROE histórico >20% sustenta múltiplo" },
    ],
    observacao: "Posição +97,75% sobre PM. Dividendo recorrente relevante.",
    fontes: [
      { label: "RI Porto Seguro", url: "https://www.portoseguro.com.br/investidores" },
      { label: "Susep — dados setoriais", url: "https://www.gov.br/susep" },
    ],
  },
  ITSA4: {
    titulo: "ITSA4 · Itaúsa",
    classe: "Ação · Holding",
    resumo: "Holding do Itaú Unibanco (~90% do NAV), Alpargatas, Dexco, Aegea, Copa Energia. Espelha o Itaú com desconto de holding.",
    fatores: [
      { nome: "Itaú (ITUB4)", impacto: "alto", direcao: "Resultado do Itaú é o principal driver" },
      { nome: "Selic / spread bancário", impacto: "alto", direcao: "Selic alta ajuda margem financeira dos bancos" },
      { nome: "Desconto de holding", impacto: "medio", direcao: "Historicamente 15–25% vs NAV; oscila com fluxo" },
      { nome: "JCP + dividendo", impacto: "alto", direcao: "Payout alto sustenta preço" },
    ],
    fontes: [
      { label: "RI Itaúsa", url: "https://www.itausa.com.br/ri" },
      { label: "RI Itaú Unibanco", url: "https://www.itau.com.br/relacoes-com-investidores" },
    ],
  },
  BPAC11: {
    titulo: "BPAC11 · BTG Pactual",
    classe: "Ação · Banco de investimento",
    resumo: "Banco de investimento e gestão de patrimônio. Sensível a mercado de capitais, M&A e AuM.",
    fatores: [
      { nome: "Volume de M&A / IPOs", impacto: "alto", direcao: "Mercado aquecido → receita de IB sobe" },
      { nome: "AuM (wealth + asset)", impacto: "alto", direcao: "Captação líquida é key" },
      { nome: "Selic", impacto: "medio", direcao: "Selic alta pesa em ações e IPOs; mas ajuda tesouraria" },
      { nome: "Bolsa (Ibovespa)", impacto: "alto", direcao: "Correlação forte com ciclo de risco" },
    ],
    observacao: "Posição −37% sobre PM. Revisar tese ou stop.",
    fontes: [
      { label: "RI BTG Pactual", url: "https://ri.btgpactual.com" },
    ],
  },
  ITUB4: {
    titulo: "ITUB4 · Itaú Unibanco",
    classe: "Ação · Banco",
    resumo: "Maior banco privado do Brasil. Motor de resultado é margem financeira + inadimplência controlada.",
    fatores: [
      { nome: "Selic", impacto: "alto", direcao: "Ajuda spread e receita de tesouraria" },
      { nome: "Inadimplência (PDD)", impacto: "alto", direcao: "PDD sobe → lucro cai" },
      { nome: "Crescimento carteira", impacto: "medio", direcao: "Crédito PJ e cartões" },
    ],
    fontes: [{ label: "RI Itaú", url: "https://www.itau.com.br/relacoes-com-investidores" }],
  },
  CXSE3: {
    titulo: "CXSE3 · Caixa Seguridade",
    classe: "Ação · Seguros / Previdência",
    resumo: "Braço de seguros da Caixa. Distribuição amarrada à rede Caixa (canal cativo).",
    fatores: [
      { nome: "Volume Caixa (canal)", impacto: "alto", direcao: "Depende da rede da Caixa" },
      { nome: "Selic (rendas técnicas)", impacto: "medio", direcao: "Selic alta ajuda resultado financeiro" },
      { nome: "Payout / dividendo", impacto: "alto", direcao: "Alto payout é tese central" },
    ],
    fontes: [{ label: "RI Caixa Seguridade", url: "https://ri.caixaseguridade.com.br" }],
  },
  ORVR3: {
    titulo: "ORVR3 · Orizon",
    classe: "Ação · Saneamento / Resíduos",
    resumo: "Tratamento de resíduos, biogás e crédito de carbono. Contratos de longo prazo com municípios.",
    fatores: [
      { nome: "IPCA (contratos indexados)", impacto: "alto", direcao: "Reajustes anuais indexados ao IPCA" },
      { nome: "Marco do saneamento / regulação", impacto: "alto", direcao: "Ambiente regulatório de resíduos" },
      { nome: "Preço do biogás/CBIOs", impacto: "medio", direcao: "Receita adicional" },
    ],
    fontes: [{ label: "RI Orizon", url: "https://ri.orizonvr.com.br" }],
  },
  CPFE3: {
    titulo: "CPFE3 · CPFL Energia",
    classe: "Ação · Utilities (energia elétrica)",
    resumo: "Distribuidora + geração. Receita regulada indexada a IPCA/IGP-M.",
    fatores: [
      { nome: "IPCA / IGP-M", impacto: "alto", direcao: "Revisões tarifárias indexadas" },
      { nome: "Aneel (revisão tarifária)", impacto: "alto", direcao: "Ciclo regulatório" },
      { nome: "Selic (múltiplo)", impacto: "medio", direcao: "Selic alta pressiona ação de dividendo" },
      { nome: "Hidrologia / bandeiras", impacto: "medio", direcao: "Custo de energia comprada" },
    ],
    fontes: [
      { label: "RI CPFL", url: "https://www.cpfl.com.br/institucional/relacoes-com-investidores" },
      { label: "Aneel", url: "https://www.gov.br/aneel" },
    ],
  },
  GGBR4: {
    titulo: "GGBR4 · Gerdau",
    classe: "Ação · Siderurgia",
    resumo: "Siderúrgica global (Brasil, América do Norte, Aços Especiais). Ciclo do aço.",
    fatores: [
      { nome: "Preço do aço (China)", impacto: "alto", direcao: "China exporta → derruba preço global" },
      { nome: "Dólar", impacto: "alto", direcao: "Exportação e ON dolarizadas" },
      { nome: "Demanda EUA (construção)", impacto: "alto", direcao: "40%+ do EBITDA vem da América do Norte" },
      { nome: "Tarifas / anti-dumping", impacto: "medio", direcao: "Medidas protetivas ajudam" },
    ],
    fontes: [{ label: "RI Gerdau", url: "https://ri.gerdau.com" }],
  },
  ABEV3: {
    titulo: "ABEV3 · Ambev",
    classe: "Ação · Consumo (bebidas)",
    resumo: "Cervejas, refri e não-alcoólicos. Sensível a consumo e commodities agrícolas.",
    fatores: [
      { nome: "Cevada, alumínio, milho", impacto: "alto", direcao: "Custo de produção" },
      { nome: "Renda / massa salarial BR", impacto: "alto", direcao: "Consumo popular" },
      { nome: "Câmbio (insumos importados)", impacto: "medio", direcao: "Dólar alto pressiona custo" },
      { nome: "Concorrência (Heineken)", impacto: "medio", direcao: "Perda de market share" },
    ],
    fontes: [{ label: "RI Ambev", url: "https://ri.ambev.com.br" }],
  },
  B3SA3: {
    titulo: "B3SA3 · B3",
    classe: "Ação · Bolsa/Infra de mercado",
    resumo: "Monopólio de bolsa e balcão no Brasil. Receita atrelada a volume negociado.",
    fatores: [
      { nome: "Volume Bovespa (ADTV)", impacto: "alto", direcao: "Volume alto → receita" },
      { nome: "Selic", impacto: "medio", direcao: "Selic alta reduz apetite por RV" },
      { nome: "Nº de investidores PF", impacto: "medio", direcao: "Base ativa" },
    ],
    fontes: [{ label: "RI B3", url: "https://ri.b3.com.br" }],
  },
  PRIO3: {
    titulo: "PRIO3 · PRIO (ex-PetroRio)",
    classe: "Ação · Óleo e gás",
    resumo: "Independente de O&G, compra campos maduros e revitaliza. 100% dolarizada.",
    fatores: [
      { nome: "Brent (petróleo)", impacto: "alto", direcao: "Receita 100% linkada ao Brent" },
      { nome: "Dólar", impacto: "alto", direcao: "Receita em USD, custo mix BR/USD" },
      { nome: "Lifting cost", impacto: "medio", direcao: "Custo por barril" },
      { nome: "Aquisições / M&A", impacto: "alto", direcao: "Crescimento vem de comprar campos" },
    ],
    fontes: [{ label: "RI PRIO", url: "https://www.prio3.com.br/ri" }],
  },
  RENT3: {
    titulo: "RENT3 · Localiza",
    classe: "Ação · Locação de veículos",
    resumo: "Locadora líder após fusão com Unidas. Sensível a preço de carros seminovos e juros.",
    fatores: [
      { nome: "Selic (custo da dívida)", impacto: "alto", direcao: "Alavancagem alta; Selic pesa muito" },
      { nome: "Preço de seminovos", impacto: "alto", direcao: "Venda de frota é key" },
      { nome: "Produção montadoras", impacto: "medio", direcao: "Custo de compra da frota" },
    ],
    fontes: [{ label: "RI Localiza", url: "https://ri.localiza.com" }],
  },
  TGRE11: {
    titulo: "TGRE11 · TG Ativo Real",
    classe: "FII listado · Fundos imobiliários",
    resumo: "Fundo imobiliário. Preço oscila com juros longos e vacância dos imóveis.",
    fatores: [
      { nome: "IPCA + juros longos (NTN-B)", impacto: "alto", direcao: "Yield do fundo compete com NTN-B" },
      { nome: "Vacância / aluguéis", impacto: "alto", direcao: "Distribuição depende disso" },
      { nome: "Ciclo imobiliário", impacto: "medio", direcao: "Cap rate dos imóveis" },
    ],
    observacao: "Posição −11,69% sobre capital aplicado.",
    fontes: [{ label: "TG Core", url: "https://www.tgcoreasset.com.br" }],
  },
  XPAG11: {
    titulo: "XPAG11 · XP Crédito Agrícola",
    classe: "FI Agro listado · Crédito agro",
    resumo: "Fundo de crédito agro (CRAs). Isento de IR pra PF. Distribuição mensal.",
    fatores: [
      { nome: "CDI", impacto: "alto", direcao: "Grande parte da carteira é CDI+; CDI cai → distribuição cai" },
      { nome: "Inadimplência agro", impacto: "alto", direcao: "Safra/preço commodities afeta emissores" },
      { nome: "Preço soja/milho/açúcar", impacto: "medio", direcao: "Saúde dos devedores" },
      { nome: "Isenção de IR", impacto: "alto", direcao: "Vantagem estrutural pra PF" },
    ],
    fontes: [{ label: "XP Asset — XPAG11", url: "https://www.xpasset.com.br" }],
  },
  LFTB11: {
    titulo: "LFTB11 · ETF Tesouro Selic",
    classe: "ETF · Tesouro pós-fixado",
    resumo: "ETF de LFTs (Tesouro Selic). Sem risco de crédito, sem marcação a mercado relevante.",
    fatores: [
      { nome: "Selic / CDI", impacto: "alto", direcao: "Rende ~100% do CDI" },
    ],
    fontes: [{ label: "Tesouro Direto", url: "https://www.tesourodireto.com.br" }],
  },
  IVVB11: {
    titulo: "IVVB11 · S&P 500 (BDR)",
    classe: "ETF · Bolsa americana",
    resumo: "Exposição ao S&P 500 em reais. Sensível a Fed, tech americana e câmbio.",
    fatores: [
      { nome: "Dólar (USD/BRL)", impacto: "alto", direcao: "Dólar sobe → cota sobe" },
      { nome: "Fed / juros dos EUA", impacto: "alto", direcao: "Fed alto pressiona múltiplos" },
      { nome: "Big Techs (Apple, Nvidia, MSFT)", impacto: "alto", direcao: "Top 10 = ~35% do índice" },
    ],
    fontes: [{ label: "S&P Global", url: "https://www.spglobal.com/spdji" }],
  },
  GOLD11: {
    titulo: "GOLD11 · ETF Ouro",
    classe: "ETF · Ouro",
    resumo: "Ouro físico em reais. Hedge de crise e dólar.",
    fatores: [
      { nome: "Ouro (USD/oz)", impacto: "alto", direcao: "Cotação internacional" },
      { nome: "Dólar", impacto: "alto", direcao: "Convertido pra BRL" },
      { nome: "Juros reais EUA", impacto: "alto", direcao: "Juros reais altos → ouro cai" },
      { nome: "Risco geopolítico", impacto: "medio", direcao: "Guerra/crise → demanda por ouro" },
    ],
    fontes: [{ label: "LBMA", url: "https://www.lbma.org.uk" }],
  },
  NASD11: {
    titulo: "NASD11 · Nasdaq 100 (BDR)",
    classe: "ETF · Tech americana",
    resumo: "Nasdaq 100 em reais. Concentrado em tech.",
    fatores: [
      { nome: "Dólar", impacto: "alto", direcao: "Câmbio afeta cota BRL" },
      { nome: "Fed / juros EUA", impacto: "alto", direcao: "Tech é sensível a juros" },
      { nome: "Big Techs + IA", impacto: "alto", direcao: "Nvidia, MSFT, Apple, Meta, Google" },
    ],
    fontes: [{ label: "Nasdaq", url: "https://www.nasdaq.com" }],
  },
};

// ---------- Padrões por nome (RF) ----------
type Padrao = { match: (n: string) => boolean; data: Omit<Sensibilidade, "titulo"> };

const PADROES: Padrao[] = [
  {
    match: (n) => /NTN-B|NTNB|Tesouro IPCA/i.test(n),
    data: {
      classe: "Tesouro IPCA+ (NTN-B)",
      resumo: "Título público indexado à inflação. Marcação a mercado varia com juros reais.",
      fatores: [
        { nome: "IPCA", impacto: "alto", direcao: "Rentabilidade = IPCA + cupom fixo" },
        { nome: "Juros reais (curva DI real)", impacto: "alto", direcao: "Juros reais sobem → MtM cai (marcação)" },
        { nome: "Fiscal / risco Brasil", impacto: "alto", direcao: "Piora fiscal → curva abre → MtM cai" },
        { nome: "Crédito soberano", impacto: "baixo", direcao: "Emissor = Tesouro Nacional" },
      ],
      observacao: "Se carregar até o vencimento, IPCA + cupom é garantido — MtM não importa.",
      fontes: [
        { label: "Tesouro Direto", url: "https://www.tesourodireto.com.br" },
        { label: "IPCA (IBGE)", url: "https://www.ibge.gov.br/indicadores" },
        { label: "Anbima — curva de juros", url: "https://www.anbima.com.br" },
      ],
    },
  },
  {
    match: (n) => /DEB.*J&F|DEB ER ATIVO J&F/i.test(n),
    data: {
      classe: "Debênture incentivada J&F",
      resumo: "Debênture da holding J&F (JBS, Eldorado, Banco Original). Isenta de IR (Lei 12.431).",
      fatores: [
        { nome: "Rating / risco de crédito J&F", impacto: "alto", direcao: "Piora do crédito → spread abre" },
        { nome: "Selic / CDI", impacto: "medio", direcao: "Título prefixado; concorre com CDI" },
        { nome: "JBS (resultado)", impacto: "alto", direcao: "Principal ativo da holding" },
        { nome: "Isenção de IR", impacto: "alto", direcao: "Vantagem estrutural pra PF" },
      ],
      fontes: [
        { label: "J&F Investimentos", url: "https://jefinvestimentos.com.br" },
        { label: "RI JBS", url: "https://ri.jbs.com.br" },
      ],
    },
  },
  {
    match: (n) => /JALLES/i.test(n),
    data: {
      classe: "Debênture Jalles Machado (sucroenergético)",
      resumo: "Debênture incentivada de usina de açúcar/etanol/energia. IPCA+8,5% isenta.",
      fatores: [
        { nome: "IPCA", impacto: "alto", direcao: "Correção do principal" },
        { nome: "Preço do açúcar (NY)", impacto: "alto", direcao: "Saúde do emissor" },
        { nome: "Etanol / Petrobras (gasolina)", impacto: "medio", direcao: "Paridade etanol-gasolina" },
        { nome: "Safra / clima", impacto: "medio", direcao: "Produtividade da cana" },
      ],
      fontes: [{ label: "RI Jalles Machado", url: "https://ri.jallesmachado.com" }],
    },
  },
  {
    match: (n) => /LCA|LCI/i.test(n),
    data: {
      classe: "LCA / LCI (isento IR)",
      resumo: "Letra de Crédito do Agronegócio/Imobiliário. Isento de IR pra PF. Coberto pelo FGC até R$250k por CPF/emissor.",
      fatores: [
        { nome: "CDI", impacto: "alto", direcao: "Pós-fixado: rende % do CDI" },
        { nome: "Risco do emissor", impacto: "medio", direcao: "FGC cobre até R$250k" },
        { nome: "Isenção de IR", impacto: "alto", direcao: "Vantagem vs CDB" },
        { nome: "Liquidez", impacto: "medio", direcao: "Carência até vencimento na maioria" },
      ],
      fontes: [
        { label: "FGC", url: "https://www.fgc.org.br" },
        { label: "Anbima", url: "https://www.anbima.com.br" },
      ],
    },
  },
  {
    match: (n) => /LCD/i.test(n),
    data: {
      classe: "LCD BRDE (Letra de Crédito do Desenvolvimento)",
      resumo: "Instrumento novo criado pela Lei 14.937/2024. Emitido por bancos de desenvolvimento (BRDE aqui). Isento de IR pra PF, coberto pelo FGC.",
      fatores: [
        { nome: "CDI", impacto: "alto", direcao: "Rende % do CDI (flutuante)" },
        { nome: "Selic (ciclo)", impacto: "alto", direcao: "Se Selic cair, rendimento cai junto — sem saída até vencimento" },
        { nome: "BRDE (emissor)", impacto: "baixo", direcao: "Banco público estadual + FGC" },
      ],
      observacao: "⚠️ Taxa flutuante trancada por longo prazo. Perde vs prefixado/IPCA+ num ciclo de queda de juros.",
      fontes: [
        { label: "BRDE", url: "https://www.brde.com.br" },
        { label: "Lei 14.937/2024", url: "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14937.htm" },
      ],
    },
  },
];

const RV_CLASSE_FALLBACK: Record<string, Sensibilidade> = {
  "FII": {
    titulo: "FII (Fundo Imobiliário)",
    classe: "Fundo imobiliário listado",
    resumo: "Renda de aluguéis distribuída mensalmente. Preço oscila com NTN-B e vacância.",
    fatores: [
      { nome: "Juros reais (NTN-B)", impacto: "alto", direcao: "Yield compete com NTN-B" },
      { nome: "Vacância dos imóveis", impacto: "alto", direcao: "Impacta distribuição" },
      { nome: "IGP-M / IPCA (reajustes)", impacto: "medio", direcao: "Contratos indexados" },
    ],
    fontes: [{ label: "Anbima FII", url: "https://www.anbima.com.br" }],
  },
  "ETF": {
    titulo: "ETF",
    classe: "Fundo de índice",
    resumo: "Cesta de ativos que segue um índice. Sensibilidade depende do índice de referência.",
    fatores: [
      { nome: "Índice de referência", impacto: "alto", direcao: "Ver o índice subjacente" },
      { nome: "Câmbio (se global)", impacto: "medio", direcao: "ETFs internacionais em BRL" },
    ],
    fontes: [{ label: "B3 — ETFs", url: "https://www.b3.com.br" }],
  },
};

export function getSensibilidade(nome: string, classeHint?: string): Sensibilidade | null {
  // 1. Ticker exato
  const ticker = nome.split(/[\s(·]/)[0].replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (TICKER_MAP[ticker]) return TICKER_MAP[ticker];

  // 2. Padrão por regex no nome
  for (const p of PADROES) {
    if (p.match(nome)) {
      return { titulo: nome, ...p.data };
    }
  }

  // 3. Fallback por classe
  if (classeHint && RV_CLASSE_FALLBACK[classeHint]) {
    return { ...RV_CLASSE_FALLBACK[classeHint], titulo: nome };
  }

  return null;
}
