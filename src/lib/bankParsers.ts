/**
 * VESTA — Parser Multi-banco
 * Integrar em: src/lib/bankParsers.ts
 * Usar em: src/components/upload.tsx
 *
 * Adiciona suporte a BTG/Menthor, C6 Bank e Brasilprev
 * ao parser XP já existente.
 */

export interface AtivoImportado {
  nome: string;
  valor: number;
  taxa: string;
  indexador: string;
  vencimento: string;
  tipo: string;
  banco: string;
  status: string;
  rentab12m?: string;
  rentabAno?: string;
  arquivo?: string;
}

export interface ResultadoImport {
  ativos: AtivoImportado[];
  total: number;
  banco: string;
  erros: string[];
}

// ─── Detectar banco pelo nome do arquivo e conteúdo ───────────────────────
export function detectarBanco(filename: string, conteudo: string): string {
  const fn = filename.toLowerCase();
  const c  = conteudo.toLowerCase().substring(0, 800);

  if (fn.includes('btg') || fn.includes('menthor') ||
      c.includes('btg pactual') || c.includes('banco btg') ||
      c.includes('menthor'))                               return 'BTG';

  if (fn.includes('c6') || c.includes('c6 bank') ||
      c.includes('banco c6'))                              return 'C6';

  if (fn.includes('brasilprev') || fn.includes('pgbl') ||
      c.includes('brasilprev') || c.includes('bradesco previdencia')) return 'Brasilprev';

  if (fn.match(/529\d{4}|641\d{4}/) || fn.includes('xp') ||
      c.includes('xp investimentos'))                      return 'XP';

  return 'Genérico';
}

// ─── Normalizar valor monetário BR ────────────────────────────────────────
export function normValor(s: string | number): number {
  if (!s) return 0;
  let str = String(s).replace(/[R$\s]/g, '').trim();
  // Formato BR: 1.234,56 → 1234.56
  if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(str)) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    str = str.replace(',', '.');
  }
  return parseFloat(str) || 0;
}

// ─── Classificar tipo de ativo ────────────────────────────────────────────
export function classificarTipo(nome: string, taxa: string = ''): string {
  const n = nome.toLowerCase();
  if (n.includes('fidc'))                                     return 'FIDC';
  if (n.includes('pgbl') || n.includes('vgbl') ||
      n.includes('previd') || n.includes('previdencia'))      return 'Previdência';
  if (n.includes('ntn-b') || n.includes('tesouro ipca'))     return 'Tesouro Inflação';
  if (n.includes('ltn') || n.includes('tesouro pre') ||
      n.includes('tesouro prefixado'))                        return 'Tesouro Pré';
  if (n.includes('lft') || n.includes('tesouro selic'))      return 'Tesouro Selic';
  if (n.includes('lci'))                                      return 'LCI';
  if (n.includes('lca'))                                      return 'LCA';
  if (n.includes('cdb'))                                      return 'CDB';
  if (n.includes('cri'))                                      return 'CRI';
  if (n.includes('cra'))                                      return 'CRA';
  if (n.includes('debênture') || n.includes('debenture'))    return 'Debênture';
  if (n.includes('fia') || n.includes('ficfia'))             return 'FIA';
  if (n.includes('fii') || n.includes('fundo imob'))         return 'FII';
  if (n.includes('us500') || n.includes('s&p') ||
      n.includes('ivvb') || n.includes('index'))              return 'Fundo RV';
  if (n.includes('fundo') || n.includes('fi '))              return 'Fundo RF';
  return 'RF';
}

// ─── Status automático Vesta ──────────────────────────────────────────────
export function calcStatus(a: Partial<AtivoImportado>): string {
  const n = (a.nome || '').toLowerCase();
  const t = a.tipo || '';
  const tx = a.taxa || '';

  if (t === 'FIDC')                                           return 'sair';
  if (t === 'FIA')                                            return 'sair';
  if (n.includes('alpha key'))                                return 'sair';
  if (t === 'Previdência' && tx.includes('1,8'))              return 'portabilidade';
  if (t === 'Previdência')                                    return 'auditar';
  if (t === 'Tesouro Inflação' || t === 'LCI' || t === 'LCA') return 'manter';
  if (n.includes('ntn-b') && (n.includes('2045') || n.includes('2050'))) return 'estratégico';
  if (t === 'CDB' || t === 'Tesouro Selic' || t === 'Tesouro Pré') return 'ok';
  if (t === 'Fundo RV' && (n.includes('us500') || n.includes('s&p'))) return 'manter';
  return 'ok';
}

// ─── Parser CSV genérico com detecção fuzzy de colunas ────────────────────
export function parsearCSV(
  texto: string,
  banco: string,
  filename: string
): AtivoImportado[] {

  const linhas = texto.split(/\r?\n/).filter(l => l.trim());
  if (linhas.length < 2) return [];

  // Detectar separador
  const primeira = linhas[0];
  const sep = (primeira.match(/,/g) || []).length >
              (primeira.match(/;/g) || []).length ? ',' : ';';

  const cols = primeira.split(sep).map(c => c.replace(/"/g,'').toLowerCase().trim());

  const findCol = (...keywords: string[]): number => {
    for (let i = 0; i < cols.length; i++)
      for (const k of keywords)
        if (cols[i].includes(k)) return i;
    return -1;
  };

  const cNome  = findCol('produto','ativo','papel','titulo','título','nome','descri');
  const cValor = findCol('valor bruto','valor atual','saldo bruto','saldo atual','posição','posicao','valor');
  const cTaxa  = findCol('taxa','rentab','indexador','indice','índice','benchmark');
  const cIndex = findCol('indexador','indice','índice');
  const cVenc  = findCol('vencimento','vencto','data venc','maturidade');
  const cTipo  = findCol('tipo','classe','categoria');
  const cCust  = findCol('custodiante','banco','instituição','instituicao','corretora');
  const cStat  = findCol('status','ação','acao','decisao','decisão');
  const cR12m  = findCol('rentab_12m','12m','12 meses');
  const cRAno  = findCol('rentab_ano','rentab_mes','ano','ytd');

  const resultado: AtivoImportado[] = [];

  // Fallback se não encontrou colunas esperadas
  if (cNome < 0 || cValor < 0) {
    for (let i = 1; i < linhas.length; i++) {
      const p = linhas[i].split(sep).map(c => c.replace(/"/g,'').trim());
      const nome = p[0];
      if (!nome || nome.length < 3) continue;
      let val = 0;
      for (let j = 1; j < p.length; j++) {
        const v = normValor(p[j]);
        if (v > 100) { val = v; break; }
      }
      if (val > 0) {
        const tipo = classificarTipo(nome);
        const a: AtivoImportado = { nome, valor: val, taxa: '', indexador: '', vencimento: '', tipo, banco, status: '', arquivo: filename };
        a.status = calcStatus(a);
        resultado.push(a);
      }
    }
    return resultado;
  }

  for (let i = 1; i < linhas.length; i++) {
    const p = linhas[i].split(sep).map(c => c.replace(/"/g,'').trim());
    if (p.length < 2) continue;

    const nome = cNome >= 0 ? p[cNome] : '';
    if (!nome || nome.length < 2) continue;
    const nomeLow = nome.toLowerCase();
    if (nomeLow.includes('total') || nomeLow.includes('subtotal')) continue;

    const val = cValor >= 0 ? normValor(p[cValor]) : 0;
    if (val < 0.01) continue;

    const tipo = (cTipo >= 0 && p[cTipo]) ? p[cTipo] : classificarTipo(nome, p[cTaxa] || '');
    const custc = (cCust >= 0 && p[cCust]) ? p[cCust] : banco;

    const a: AtivoImportado = {
      nome,
      valor: val,
      taxa:       cTaxa  >= 0 ? p[cTaxa]  : '',
      indexador:  cIndex >= 0 ? p[cIndex] : '',
      vencimento: cVenc  >= 0 ? p[cVenc]  : '',
      tipo,
      banco: custc,
      status:     cStat  >= 0 ? p[cStat]  : '',
      rentab12m:  cR12m  >= 0 ? p[cR12m]  : '',
      rentabAno:  cRAno  >= 0 ? p[cRAno]  : '',
      arquivo: filename
    };
    a.status = a.status || calcStatus(a);
    resultado.push(a);
  }

  return resultado;
}

// ─── Entrada principal — processar arquivo ────────────────────────────────
export function processarArquivo(filename: string, conteudo: string): ResultadoImport {
  const banco  = detectarBanco(filename, conteudo);
  const ativos = parsearCSV(conteudo, banco, filename);
  const total  = ativos.reduce((s, a) => s + a.valor, 0);
  const erros: string[] = [];

  if (ativos.length === 0)
    erros.push(`${filename}: nenhum ativo encontrado — verifique o formato`);

  return { ativos, total, banco, erros };
}

// ─── Consolidar múltiplos arquivos ────────────────────────────────────────
export function consolidar(resultados: ResultadoImport[]): {
  ativos: AtivoImportado[];
  total: number;
  bancos: string[];
  erros: string[];
} {
  const ativos   = resultados.flatMap(r => r.ativos);
  const total    = ativos.reduce((s, a) => s + a.valor, 0);
  const bancos   = [...new Set(ativos.map(a => a.banco))];
  const erros    = resultados.flatMap(r => r.erros);
  return { ativos, total, bancos, erros };
}

// ─── Parser PDF XP (XPerformance / Posição Detalhada) ────────────────────
// Lê apenas as páginas com "POSIÇÃO DETALHADA DOS ATIVOS" (páginas 7-8 do XPerformance).
// Cada ativo tem vencimento no formato MMM/AAAA e R$ valor.
// Formato 1 (nome e valor em linhas Y diferentes):
//   y=390: "LCA BANCO BOCOM BBM SA - OUT/2030 - 92,70%"
//   y=386: "R$ 86.733,37 | 78 | 17,02% | ..."
// Formato 2 (nome e valor no mesmo Y):
//   y=359: "LCA ORIGINAL - ABR/2030 - 94,00% CDI | R$ 19.649,37 | 19 | ..."
export async function parsearPDF(file: File): Promise<ResultadoImport> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  // Padrões para identificar linhas de ativos reais
  // Vencimento estilo "MMM/AAAA" (jan, fev, ... dez)
  const VENC_TEXT_RE = /\b(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\/\d{4}\b/i;
  // Linha de subtotal de seção (ex: "Pós Fixado | R$ 311.287,70 | - |")
  const SUBTOTAL_RE = /^(pós.?fixado|inflação|pré.?fixado|caixa|proventos)\s*\|/i;
  // Valor monetário XP: "R$ 86.733,37"
  const MONEY_RE = /R\$\s*([\d.,]+)/;
  // Taxa anual: "92,70%" ou "IPC-A + 11,55%"
  const TAXA_RE = /(?:IPC-?A\s*\+\s*)?([\d]+[.,][\d]+)\s*%/;

  // Coletar linhas apenas das páginas com "POSIÇÃO DETALHADA"
  type Linha = { y: number; text: string };
  const linhasPos: Linha[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    // Agrupar por Y exato, ordenar X → juntar por espaço
    const byY = new Map<number, Array<{ x: number; str: string }>>();
    for (const item of content.items) {
      if (!('str' in item) || !(item as any).str.trim()) continue;
      const y = Math.round((item as any).transform[5]);
      const x = Math.round((item as any).transform[4]);
      if (!byY.has(y)) byY.set(y, []);
      byY.get(y)!.push({ x, str: (item as any).str.trim() });
    }

    const linhas: Linha[] = Array.from(byY.entries())
      .map(([y, items]) => ({
        y,
        text: items
          .sort((a, b) => a.x - b.x)
          .map(i => i.str)
          .join(' | ')
          .replace(/\s+/g, ' ')
          .trim(),
      }))
      .filter(l => l.text.length > 0);

    // Verificar se a página tem seção de posição detalhada
    // O XP extrai o título espaçado: "P O S I Ç Ã O  D E T A L H A D A"
    // Compactar: remover espaços entre letras únicas antes de testar
    const pageText = linhas.map(l => l.text).join(' ');
    const pageCompact = pageText.replace(/(?<=[A-Za-zÀ-ÿ]) (?=[A-Za-zÀ-ÿ])/g, '');
    const temPosicao = /posi[çc][aã]o\s*detalhada/i.test(pageCompact);

    if (temPosicao) {
      linhasPos.push(...linhas.sort((a, b) => b.y - a.y));
    }
  }

  const ativos: AtivoImportado[] = [];
  const erros: string[] = [];

  if (linhasPos.length === 0) {
    erros.push(`${file.name}: seção "POSIÇÃO DETALHADA DOS ATIVOS" não encontrada — verifique se é um extrato XP XPerformance`);
    return { ativos, total: 0, banco: 'XP', erros };
  }

  // Extrair nome limpo (parte antes do primeiro "|", sem o valor)
  const extrairNome = (text: string): string => {
    const parte = text.split('|')[0].trim();
    return parte;
  };

  // Extrair vencimento textual → converter para MM/AAAA
  const extrairVenc = (text: string): string => {
    const m = VENC_TEXT_RE.exec(text);
    if (!m) return '';
    const meses: Record<string, string> = {
      jan:'01', fev:'02', mar:'03', abr:'04', mai:'05', jun:'06',
      jul:'07', ago:'08', set:'09', out:'10', nov:'11', dez:'12',
    };
    const [mesStr, ano] = m[0].split('/');
    return `${meses[mesStr.toLowerCase()]}/${ano}`;
  };

  // Extrair taxa string
  const extrairTaxa = (text: string): string => {
    if (/IPC-?A/i.test(text)) {
      const m = /IPC-?A\s*\+\s*([\d.,]+)\s*%/i.exec(text);
      return m ? `IPC-A + ${m[1]}%` : 'IPC-A';
    }
    const m = TAXA_RE.exec(text);
    if (!m) return '';
    const prefixo = /CDI/i.test(text) ? '' : '';
    return `${m[1]}%${/CDI/i.test(text) ? ' CDI' : ''}`;
  };

  // Extrair indexador
  const extrairIndex = (text: string): string => {
    if (/IPC-?A/i.test(text)) return 'IPCA';
    if (/CDI/i.test(text)) return 'CDI';
    if (/selic/i.test(text)) return 'SELIC';
    if (/pre.?fix|% a\.?a/i.test(text)) return 'Prefixado';
    return '';
  };

  const criarAtivo = (nome: string, valor: number, taxa: string, venc: string, indexador: string): AtivoImportado => {
    const tipo = classificarTipo(nome, taxa);
    const a: AtivoImportado = { nome, valor, taxa, indexador, vencimento: venc, tipo, banco: 'XP', status: '' };
    a.status = calcStatus(a);
    return a;
  };

  let nomePendente: string | null = null;
  let taxaPendente = '';
  let vencPendente = '';
  let indexPendente = '';

  // linhasPos já contém só páginas com POSIÇÃO DETALHADA — processar tudo
  for (const { text } of linhasPos) {
    // Pular o próprio título da seção (pode vir espaçado: "P O S I Ç Ã O...")
    const textCompact = text.replace(/(?<=[A-Za-zÀ-ÿ]) (?=[A-Za-zÀ-ÿ])/g, '');
    if (/posi[çc][aã]o\s*detalhada/i.test(textCompact)) continue;

    // Pular linha de cabeçalho da tabela
    if (/estrat[eé]gia\s*\|.*saldo\s*bruto/i.test(text)) continue;

    // Pular subtotais de seção ("Pós Fixado | R$ 311... | - |")
    if (SUBTOTAL_RE.test(text)) continue;

    // Checar se a linha contém R$ (tem valor)
    const moneyMatch = MONEY_RE.exec(text);

    // Linha com vencimento → é nome de ativo (pode ou não ter R$)
    if (VENC_TEXT_RE.test(text)) {
      // Salvar ativo anterior pendente sem valor (raro, mas defensivo)
      nomePendente = null;

      const taxa   = extrairTaxa(text);
      const venc   = extrairVenc(text);
      const index  = extrairIndex(text);
      const nome   = extrairNome(text);

      if (moneyMatch) {
        // Formato 2: nome + valor na mesma linha
        const valor = normValor(moneyMatch[1]);
        if (valor >= 100) ativos.push(criarAtivo(nome, valor, taxa, venc, index));
      } else {
        // Formato 1: nome na linha atual, valor vem na próxima linha
        nomePendente = nome;
        taxaPendente = taxa;
        vencPendente = venc;
        indexPendente = index;
      }
      continue;
    }

    // Linha que começa com R$ e temos um nome pendente → Formato 1, linha de valor
    if (moneyMatch && nomePendente && /^\s*R\$/.test(text)) {
      const valor = normValor(moneyMatch[1]);
      if (valor >= 100) ativos.push(criarAtivo(nomePendente, valor, taxaPendente, vencPendente, indexPendente));
      nomePendente = null;
      continue;
    }

    // Linha com apenas indexador (ex: "CDI") após nome pendente → não reseta, próxima pode ser o valor
    if (nomePendente && /^(CDI|IPCA?|Selic|Prefixado)$/i.test(text.trim())) continue;

    // Qualquer outra linha limpa o nome pendente
    if (nomePendente && !moneyMatch) nomePendente = null;
  }

  if (ativos.length === 0)
    erros.push(`${file.name}: nenhum ativo encontrado na seção de posição — verifique o formato do PDF`);

  return { ativos, total: ativos.reduce((s, a) => s + a.valor, 0), banco: 'XP', erros };
}

// ─── Gerar CSV no formato Vesta ───────────────────────────────────────────
export function gerarCSVVesta(ativos: AtivoImportado[]): string {
  const header = 'Produto;Valor Bruto;Taxa;Indexador;Vencimento;Rentab_12M;Rentab_Ano;Tipo;Custodiante;Status';
  const linhas = ativos.map(a =>
    [a.nome, a.valor, a.taxa, a.indexador, a.vencimento,
     a.rentab12m || '', a.rentabAno || '', a.tipo, a.banco, a.status].join(';')
  );
  return [header, ...linhas].join('\n');
}
