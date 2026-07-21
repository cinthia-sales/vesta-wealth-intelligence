export type CadastroAtivo = {
  codigo: string;
  nome: string;
  tipo: string;
  tributacao: string;
  custos: string;
  liquidez: string;
  drivers: string[];
  benchmark: string;
  metricas: string[];
  valuation: string[];
  perguntasVesta: string[];
  dadosAutomaticos: string[];
  dadosManuais: string[];
  fontes: string;
  dyReferencia?: number;
  nota?: string;
};

export const CADASTRO_ATIVOS: Record<string, CadastroAtivo> = {
  VALE3: {
    codigo: "VALE3",
    nome: "Vale",
    tipo: "Ação brasileira · mineração/commodity",
    tributacao: "ganho de capital em renda variável; dividendos/JCP conforme regra vigente e informe da companhia",
    custos: "corretagem, emolumentos B3, spread de execução e IR sobre ganho quando aplicável",
    liquidez: "alta em bolsa; preço muda a cada pregão e pode abrir gap por minério, dólar, China e acidentes/regulação",
    drivers: ["minério de ferro", "China", "dólar", "frete marítimo", "risco regulatório/ambiental", "ciclo global"],
    benchmark: "CDI/IPCA como custo de oportunidade; minério e dólar como drivers econômicos",
    metricas: ["preço vs preço médio", "retorno preço separado de dividendos", "DY histórico e futuro", "P/L", "EV/EBITDA", "dívida líquida/EBITDA"],
    valuation: ["commodity não tem lucro estável", "DY alto pode ser armadilha se o preço cair", "comparar com ciclo do minério e custo de oportunidade em CDI/IPCA"],
    perguntasVesta: [
      "o dividendo compensou a queda do preço ou só anestesiou a perda?",
      "qual preço seria necessário para zerar o prejuízo econômico?",
      "o capital ficaria melhor em RF isenta/IPCA+ sem risco de commodity?",
    ],
    dadosAutomaticos: ["cotação", "proventos pagos", "histórico de preço", "volume", "indicadores básicos quando houver provedor"],
    dadosManuais: ["preço médio real", "tese da família", "data de entrada", "custo de oportunidade escolhido"],
    fontes: "B3/corretora para preço e custos; RI/CVM para proventos; Bacen só para CDI/IPCA/Selic",
    dyReferencia: 8,
    nota: "DY é premissa, não garantia. Commodity pode pagar dividendo e destruir preço ao mesmo tempo.",
  },
  PSSA3: {
    codigo: "PSSA3",
    nome: "Porto Seguro",
    tipo: "Ação brasileira · seguradora/serviços financeiros",
    tributacao: "ganho de capital em renda variável; dividendos/JCP conforme regra vigente e informe da companhia",
    custos: "corretagem, emolumentos B3, spread de execução e IR sobre ganho quando aplicável",
    liquidez: "boa liquidez em bolsa; sensível a resultado trimestral, sinistralidade e juros",
    drivers: ["sinistralidade", "prêmios de seguros", "Selic/resultado financeiro", "crescimento da frota", "competição"],
    benchmark: "CDI como comparação forte, porque seguradora carrega resultado financeiro sensível a juros",
    metricas: ["ROE", "sinistralidade", "crescimento de prêmios", "P/L", "P/VP", "payout/DY"],
    valuation: ["seguradora boa costuma merecer múltiplo maior", "Selic ajuda resultado financeiro, mas não salva operação ruim"],
    perguntasVesta: [
      "o lucro vem da operação ou só do resultado financeiro?",
      "a sinistralidade está controlada?",
      "o prêmio de carregar ação compensa contra CDI?",
    ],
    dadosAutomaticos: ["cotação", "proventos", "histórico de preço", "indicadores básicos"],
    dadosManuais: ["tese", "limite de exposição", "preço de saída ou manutenção"],
    fontes: "B3/corretora para preço; RI/CVM para resultados/proventos; Bacen para Selic/CDI",
    dyReferencia: 5,
  },
  ITSA4: {
    codigo: "ITSA4",
    nome: "Itaúsa",
    tipo: "Ação brasileira · holding financeira/industrial",
    tributacao: "ganho de capital em renda variável; dividendos/JCP conforme regra vigente e informe da companhia",
    custos: "corretagem, emolumentos B3, spread de execução e IR sobre ganho quando aplicável",
    liquidez: "alta liquidez; preço segue principalmente Itaú e desconto de holding",
    drivers: ["Itaú", "juros", "crédito", "inadimplência", "valuation de bancos", "desconto de holding"],
    benchmark: "CDI/IPCA e bancos comparáveis",
    metricas: ["desconto de holding", "P/L", "P/VP", "ROE do Itaú", "DY", "crescimento de lucro"],
    valuation: ["não olhar só DY; holding pode ficar barata por desconto estrutural", "comparar retorno esperado com banco direto e CDI"],
    perguntasVesta: [
      "vale carregar Itaú via holding ou seria melhor o banco direto?",
      "o desconto de holding está pagando o risco?",
      "a tese é dividendo, valorização ou ambos?",
    ],
    dadosAutomaticos: ["cotação", "proventos", "histórico de preço", "indicadores básicos"],
    dadosManuais: ["tese", "desconto aceitável", "preço de saída"],
    fontes: "B3/corretora, RI/CVM e Bacen para juros",
    dyReferencia: 6,
  },
  BPAC11: {
    codigo: "BPAC11",
    nome: "BTG Pactual",
    tipo: "Unit brasileira · banco de investimento/gestão",
    tributacao: "ganho de capital em renda variável; dividendos/JCP conforme regra vigente e informe da companhia",
    custos: "corretagem, emolumentos B3, spread de execução e IR sobre ganho quando aplicável",
    liquidez: "alta liquidez; sensível a ciclo de mercado, crédito, M&A, gestão e apetite a risco",
    drivers: ["mercado de capitais", "gestão de recursos", "crédito", "Selic", "apetite a risco", "valuation de bancos"],
    benchmark: "CDI/IPCA e bancos/gestoras comparáveis",
    metricas: ["ROE", "P/L", "P/VP", "AuM/AuA", "receita de investment banking", "inadimplência/crédito"],
    valuation: ["ativo de crescimento pode parecer caro por múltiplo; precisa justificar com lucro e recorrência"],
    perguntasVesta: [
      "o preço atual embute crescimento demais?",
      "qual parte do resultado é recorrente?",
      "a perda atual é tese ou teimosia?",
    ],
    dadosAutomaticos: ["cotação", "proventos", "histórico de preço", "indicadores básicos"],
    dadosManuais: ["preço médio", "tese", "limite de perda aceitável"],
    fontes: "B3/corretora, RI/CVM e Bacen para juros",
    dyReferencia: 3,
  },
  XPAG11: {
    codigo: "XPAG11",
    nome: "XP Crédito Agro",
    tipo: "Fundo listado/FI-Agro",
    tributacao: "proventos e ganho de capital conforme regra do produto e informe da instituição",
    custos: "spread de tela, corretagem/emolumentos se houver, taxa de administração/gestão embutida no fundo",
    liquidez: "liquidez de bolsa; preço pode descolar do valor patrimonial e abrir spread em estresse",
    drivers: ["crédito agro", "inadimplência", "CDI", "spreads de crédito", "liquidez no secundário"],
    benchmark: "CDI líquido/isento equivalente e crédito privado comparável",
    metricas: ["DY mensal", "P/VP", "inadimplência", "concentração por devedor", "duration", "indexador da carteira"],
    valuation: ["DY alto só presta se o crédito for bom e o preço não estiver destruindo patrimônio"],
    perguntasVesta: [
      "o yield paga o risco de crédito?",
      "há concentração perigosa?",
      "vale carregar na bolsa ou trocar por crédito isento mais simples?",
    ],
    dadosAutomaticos: ["cotação", "proventos", "histórico de preço"],
    dadosManuais: ["risco de carteira", "relatório gerencial", "tese de crédito"],
    fontes: "B3/corretora para preço; relatório gerencial/CVM para carteira e taxas; Bacen para CDI",
    dyReferencia: 12.8,
  },
};

CADASTRO_ATIVOS.PSS3 = CADASTRO_ATIVOS.PSSA3;

export function codigoAtivo(texto: string) {
  return texto.toUpperCase().match(/[A-Z]{4}\d{1,2}|PSS3/)?.[0] ?? "";
}

export function cadastroDoCodigo(codigo: string) {
  return CADASTRO_ATIVOS[codigo.toUpperCase()] ?? null;
}

export function cadastroDoTexto(texto: string) {
  const codigo = codigoAtivo(texto);
  return codigo ? cadastroDoCodigo(codigo) : null;
}
