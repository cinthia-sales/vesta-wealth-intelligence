import { useMemo, useState, type CSSProperties } from "react";
import {
  CARTEIRA,
  notaRetrospectiva,
  ondeEstaria,
  salvarGiro,
  type AtivoCarteira,
} from "@/data/carteira-ativos";

/* ═══════════════════════════════════════════════════════════
   Custo de Oportunidade — tela unificada
   Absorve: Validador de troca + Simulador RV + Equivalência
   Linha dura: passado (CDI/inflação perdidos) + futuro (CAGR)
═══════════════════════════════════════════════════════════ */

const fmtR = (n: number) => "R$ " + Math.round(n).toLocaleString("pt-BR");
const fmtP = (n: number) => "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (n: number, d = 1) => (n * 100).toFixed(d) + "%";

/* curva Selic projetada — editável na tela */
const SELIC_DEF = [13.5, 12.5, 11.0, 9.5, 9.0, 9.0, 9.0, 9.0, 9.0, 9.0];
const ANOS = ["2026", "2027", "2028", "2029", "2030", "2031", "2032", "2033", "2034", "2035"];

type DestinoTipo = "lci" | "cdb" | "ipca" | "pre" | "acao" | "carteira";

const DESTINO_LABEL: Record<DestinoTipo, string> = {
  lci: "LCI/LCA — % do CDI (isenta)",
  cdb: "CDB — % do CDI (tributado)",
  ipca: "IPCA+ (isenta)",
  pre: "Pré-fixada (isenta)",
  acao: "Outra ação (DY + variação)",
  carteira: "Ativo da minha carteira",
};

/* taxa anual líquida do destino no ano i (0-based a partir de 2026) */
function taxaDestinoAno(
  tipo: DestinoTipo,
  i: number,
  selic: number[],
  p: { pctCdi: number; irCdb: number; ipcaReal: number; ipcaProj: number; preTaxa: number; acaoDy: number; acaoApre: number; cartTaxa: number },
): number {
  const cdi = ((selic[i] ?? 9) - 0.1) / 100;
  switch (tipo) {
    case "lci": return cdi * (p.pctCdi / 100);
    case "cdb": return cdi * (p.pctCdi / 100) * (1 - p.irCdb);
    case "ipca": return (1 + p.ipcaProj / 100) * (1 + p.ipcaReal / 100) - 1;
    case "pre": return p.preTaxa / 100;
    case "acao": return p.acaoDy / 100 + p.acaoApre / 100;
    case "carteira": return p.cartTaxa / 100;
  }
}

/* ── vereditos linha dura ──
   Retro:  perda nominal 3+ anos → MIGRAR travado
           abaixo do CDI 2+ anos sem tese → puxa MIGRAR
   Prosp.: CAGR necessário >7,5% → MIGRAR · 5,5–7,5 → MONITORAR · <5,5 → MANTER */
type Veredito = { t: "MANTER" | "MONITORAR" | "MIGRAR"; motivo: string };

function veredito(a: AtivoCarteira | null, cagrNec: number | null, bGanha5: boolean): Veredito {
  const retro = a ? notaRetrospectiva(a) : null;

  if (retro && retro.perdaNominal && retro.anos >= 3) {
    return { t: "MIGRAR", motivo: `${retro.anos} anos com perda nominal — regra sem exceção: nem tese salva. Perdeu ${fmtR(retro.gapVsCdi)} vs CDI no período.` };
  }
  if (retro && retro.perdeuDoCDI && retro.anos >= 2 && !a?.intocavel) {
    return { t: "MIGRAR", motivo: `${retro.anos} anos abaixo do CDI (${pct(retro.retornoTotalPct)} vs ${pct(retro.cdiPeriodoPct)}) sem tese registrada. Custo já pago: ${fmtR(retro.gapVsCdi)}.` };
  }
  if (a?.intocavel) {
    return { t: "MANTER", motivo: "Tese registrada em Regras — travado até o prazo. Reavaliação obrigatória no vencimento da tese." };
  }
  if (cagrNec === null) {
    return bGanha5
      ? { t: "MIGRAR", motivo: "Destino supera a origem no horizonte simulado." }
      : { t: "MANTER", motivo: "Origem supera o destino no horizonte simulado." };
  }
  if (cagrNec > 0.075) return { t: "MIGRAR", motivo: `Precisa de ${pct(cagrNec)} a.a. de preço só para empatar — acima do razoável.` };
  if (cagrNec > 0.055) return { t: "MONITORAR", motivo: `Meta de ${pct(cagrNec)} a.a. é possível mas exige gatilho de saída e revisão trimestral.` };
  return { t: "MANTER", motivo: `Meta de ${pct(cagrNec)} a.a. é factível e o histórico não aciona a linha dura.` };
}

const VCOLOR = { MANTER: "#5B8A6A", MONITORAR: "#B8892A", MIGRAR: "#A85555" } as const;
const VBG = { MANTER: "#F0F6F2", MONITORAR: "#FDF8EA", MIGRAR: "#FAF1F1" } as const;

/* ═══════════ COMPONENT ═══════════ */
export function OportunidadePage() {
  /* origem */
  const [origemId, setOrigemId] = useState("vale3");
  const manual = origemId === "manual";
  const ativo = manual ? null : (CARTEIRA.find((a) => a.id === origemId) ?? null);

  const [mValor, setMValor] = useState(100000);
  const [mNome, setMNome] = useState("Ativo manual");
  const [custoSaida, setCustoSaida] = useState(0);
  const [aDy, setADy] = useState<number | null>(null);
  const [aApre, setAApre] = useState(0);
  const [aTaxaRf, setATaxaRf] = useState<number | null>(null);

  /* destino */
  const [tipoB, setTipoB] = useState<DestinoTipo>("lci");
  const [pctCdi, setPctCdi] = useState(89);
  const [irCdb, setIrCdb] = useState(0.15);
  const [ipcaReal, setIpcaReal] = useState(8.5);
  const [ipcaProj, setIpcaProj] = useState(5.5);
  const [preTaxa, setPreTaxa] = useState(15.15);
  const [acaoDy, setAcaoDy] = useState(6);
  const [acaoApre, setAcaoApre] = useState(5);
  const [cartDestId, setCartDestId] = useState("lcixp");

  const [hz, setHz] = useState(5);
  const [selic, setSelic] = useState<number[]>([...SELIC_DEF]);
  const [showSelic, setShowSelic] = useState(false);
  const [giroSalvo, setGiroSalvo] = useState(false);
  const [vOverride, setVOverride] = useState<number | null>(null);
  const [vCurvaOverride, setVCurvaOverride] = useState<number | null>(null);
  const [ticker, setTicker] = useState("");
  const [tickerQtd, setTickerQtd] = useState(100);
  const [buscaMsg, setBuscaMsg] = useState("");

  /* valores da origem
     RF: FICAR roda o valor NA CURVA (taxa contratada até o venc.);
         SAIR entrega o valor DE MERCADO. Deságio = curva − mercado.
     RV: curva = mercado (ação não tem curva). */
  const valorMercadoA = manual ? mValor : (vOverride ?? ativo?.valorMercado ?? 0);
  const nomeA = manual ? mNome : (ativo?.nome ?? "");
  const isRV = manual ? true : ativo?.classe === "rv";
  const valorCurvaA = isRV
    ? valorMercadoA
    : (vCurvaOverride ?? ativo?.valorCurva ?? valorMercadoA);
  const valorA = valorCurvaA;   // trajetória de quem FICA
  const desagioImplicito = Math.max(valorCurvaA - valorMercadoA, 0);
  const dyA = aDy ?? (ativo?.dyEsperado ?? 0);
  const taxaRfA = aTaxaRf ?? (ativo?.taxaBruta ?? 0);

  const cartDest = CARTEIRA.find((a) => a.id === cartDestId);
  const params = {
    pctCdi, irCdb, ipcaReal, ipcaProj, preTaxa, acaoDy, acaoApre,
    cartTaxa: cartDest?.taxaBruta ?? 13,
  };

  /* custo extra de saída (IR/corretagem) — o deságio curva↔mercado já é automático */
  const custo = Math.abs(custoSaida);
  const pedagioTotal = desagioImplicito + custo;

  /* simulação ano a ano */
  const sim = useMemo(() => {
    const capB = Math.max(valorMercadoA - custo, 0);
    const rows: { ano: number; a: number; b: number }[] = [];
    let va = valorA;
    let divAcum = 0;
    let vb = capB;
    for (let i = 0; i < hz; i++) {
      if (isRV) {
        divAcum += va * (dyA / 100);           // dividendo NÃO compõe — fica parado
        va = va * (1 + aApre / 100);
      } else {
        va = va * (1 + taxaRfA / 100);
      }
      vb = vb * (1 + taxaDestinoAno(tipoB, i, selic, params));
      rows.push({ ano: i + 1, a: va + divAcum, b: vb });
    }
    const final = rows[rows.length - 1] ?? { a: valorA, b: capB, ano: 0 };
    /* CAGR de preço necessário p/ origem RV empatar com destino (descontando dividendos parados) */
    let cagrNec: number | null = null;
    if (isRV && valorA > 0) {
      const alvo = final.b - divAcum;
      if (alvo > 0) cagrNec = Math.pow(alvo / valorA, 1 / hz) - 1;
    }
    /* ganho mensal estimado da troca (1º ano) */
    const tA1 = isRV ? dyA / 100 + aApre / 100 : taxaRfA / 100;
    const tB1 = taxaDestinoAno(tipoB, 0, selic, params);
    const ganhoMes = (capB * (tB1 - tA1)) / 12;
    /* cruzamento das curvas mês a mês: quando o destino (que entrou com deságio)
       ultrapassa a origem — o breakeven da troca */
    let cruzaMes: number | null = null;
    {
      let vaM = valorA, divM = 0, vbM = capB;
      const maxM = Math.max(hz, 10) * 12;
      for (let m = 1; m <= maxM; m++) {
        const i = Math.min(Math.floor((m - 1) / 12), selic.length - 1);
        if (isRV) {
          divM += (vaM * (dyA / 100)) / 12;
          vaM *= Math.pow(1 + aApre / 100, 1 / 12);
        } else {
          vaM *= Math.pow(1 + taxaRfA / 100, 1 / 12);
        }
        vbM *= Math.pow(1 + taxaDestinoAno(tipoB, i, selic, params), 1 / 12);
        if (cruzaMes === null && vbM >= vaM + divM) { cruzaMes = m; break; }
      }
    }
    return { rows, final, cagrNec, divAcum, capB, ganhoMes, tA1, tB1, cruzaMes };
  }, [valorA, valorMercadoA, custo, hz, isRV, dyA, aApre, taxaRfA, tipoB, selic, pctCdi, irCdb, ipcaReal, ipcaProj, preTaxa, acaoDy, acaoApre, cartDestId]);

  const retro = ativo ? notaRetrospectiva(ativo) : null;
  const vd = veredito(ativo, isRV ? sim.cagrNec : null, sim.final.b > sim.final.a);
  const bkMeses = sim.ganhoMes > 0 && pedagioTotal > 0 ? Math.ceil(pedagioTotal / sim.ganhoMes) : 0;

  /* equivalência embutida: taxa isenta ↔ CDB bruto equivalente */
  const taxaB1Isenta = tipoB === "lci" || tipoB === "ipca" || tipoB === "pre";
  const equivBruta = taxaB1Isenta ? sim.tB1 / (1 - 0.15) : sim.tB1;

  const descDestino =
    tipoB === "lci" ? `LCI/LCA ${pctCdi}% CDI` :
    tipoB === "cdb" ? `CDB ${pctCdi}% CDI (IR ${(irCdb * 100).toFixed(1)}%)` :
    tipoB === "ipca" ? `IPCA+${ipcaReal}%` :
    tipoB === "pre" ? `Pré ${preTaxa}%` :
    tipoB === "acao" ? `Ação (DY ${acaoDy}% + ${acaoApre}%)` :
    (cartDest?.nome ?? "Ativo da carteira");

  const registrar = () => {
    if (!ativo && !manual) return;
    salvarGiro({
      id: Math.random().toString(36).slice(2, 10),
      criadoEm: new Date().toISOString(),
      dono: ativo?.dono ?? "paulo",
      origem: nomeA,
      destino: descDestino,
      capital: sim.capB,
      custoSaida: custo,
      ganhoMesEstimado: Math.max(0, sim.ganhoMes),
      horizonteAnos: hz,
    });
    setGiroSalvo(true);
    setTimeout(() => setGiroSalvo(false), 3500);
  };

  const inputSt: CSSProperties = {
    width: "100%", padding: "6px 9px", fontSize: 13, border: "1px solid var(--border)",
    borderRadius: 7, color: "var(--foreground)", background: "var(--card)", fontFamily: "inherit",
  };
  const lblSt: CSSProperties = { fontSize: 11, color: "var(--muted-foreground)", display: "block", marginBottom: 3 };

  return (
    <>
      <div className="ph">
        <h1>Custo de oportunidade</h1>
        <p>Qualquer ativo seu → qualquer destino. Linha dura: o passado conta, e toda troca paga seu breakeven.</p>
      </div>

      <div style={{
        background: "#FDF8EA", borderLeft: "3px solid #B8892A", borderRadius: "4px 8px 8px 4px",
        padding: "9px 13px", marginBottom: 14, fontSize: 12, color: "#8A6420", lineHeight: 1.55,
      }}>
        <strong>Custo afundado:</strong> o preço de compra não importa. As perguntas são: o capital de hoje
        renderia mais em outro lugar? E quanto ele <strong>já deixou de render</strong> parado onde está?
        Dividendo parado na conta não vira juros compostos.
      </div>

      {/* ── ORIGEM / DESTINO ── */}
      <div className="val-grid">
        <div className="side-card a">
          <div className="side-title a">Ativo atual — origem</div>
          <div className="fld">
            <label>Selecionar da carteira</label>
            <select style={inputSt} value={origemId} onChange={(e) => { setOrigemId(e.target.value); setADy(null); setAApre(0); setATaxaRf(null); setVOverride(null); setBuscaMsg(""); }}>
              <optgroup label="Renda Variável — Paulo">
                {CARTEIRA.filter((a) => a.classe === "rv").map((a) => (
                  <option key={a.id} value={a.id}>{a.nome} · {fmtR(a.valorMercado)}</option>
                ))}
              </optgroup>
              <optgroup label="Renda Fixa — Paulo">
                {CARTEIRA.filter((a) => a.classe === "rf" && a.dono === "paulo").map((a) => (
                  <option key={a.id} value={a.id}>{a.nome} · {fmtR(a.valorMercado)}</option>
                ))}
              </optgroup>
              <optgroup label="Renda Fixa — Cínthia">
                {CARTEIRA.filter((a) => a.classe === "rf" && a.dono === "cinthia").map((a) => (
                  <option key={a.id} value={a.id}>{a.nome} · {fmtR(a.valorMercado)}</option>
                ))}
              </optgroup>
              <optgroup label="—">
                <option value="manual">✎ Entrada manual…</option>
              </optgroup>
            </select>
          </div>

          {ativo && (
            <div style={{
              background: "var(--secondary)", border: "1px dashed var(--ring)", borderRadius: 7,
              padding: "6px 10px", fontSize: 11, color: "var(--muted-foreground)", marginBottom: 9,
            }}>
              ✓ Preenchido do Vesta
              {ativo.qtd ? ` · ${ativo.qtd} ações · PM ${fmtP(ativo.pm ?? 0)}` : ""}
              {ativo.anoCompra ? ` · na carteira desde ~${ativo.anoCompra}` : ""}
              {ativo.divRecebidos ? ` · div. recebidos ${fmtR(ativo.divRecebidos)}` : ""}
              {ativo.intocavel ? " · 🔒 tese registrada" : ""}
            </div>
          )}

          {manual && (
            <>
              <div className="fld-row">
                <div className="fld"><label style={lblSt}>Buscar por código (B3)</label>
                  <input style={inputSt} type="text" placeholder="ex.: PSSA3" value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())} /></div>
                <div className="fld"><label style={lblSt}>Quantidade</label>
                  <input style={inputSt} type="number" value={tickerQtd} onChange={(e) => setTickerQtd(+e.target.value || 0)} /></div>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 9 }}>
                <button
                  onClick={async () => {
                    if (!ticker) return;
                    setBuscaMsg("buscando…");
                    try {
                      const r = await fetch(`https://brapi.dev/api/quote/${ticker}`);
                      const j = await r.json();
                      const q = j?.results?.[0];
                      if (q?.regularMarketPrice) {
                        setMNome(`${ticker} · ${q.longName ?? q.shortName ?? ""}`.trim());
                        setMValor(Math.round(q.regularMarketPrice * tickerQtd));
                        setBuscaMsg(`✓ ${ticker} a ${fmtP(q.regularMarketPrice)} — ${fmtR(q.regularMarketPrice * tickerQtd)}`);
                      } else {
                        setBuscaMsg("não encontrado — preencha manualmente");
                      }
                    } catch {
                      setBuscaMsg("fonte indisponível — preencha manualmente");
                    }
                  }}
                  style={{
                    background: "var(--primary)", color: "var(--primary-foreground)", border: "none",
                    padding: "6px 14px", borderRadius: 7, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                  }}
                >buscar cotação</button>
                {buscaMsg && <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{buscaMsg}</span>}
              </div>
              <div className="fld"><label style={lblSt}>Nome</label>
                <input style={inputSt} type="text" value={mNome} onChange={(e) => setMNome(e.target.value)} /></div>
            </>
          )}

          {isRV ? (
            <div className="fld"><label style={lblSt}>Valor de mercado (R$)</label>
              <input
                style={{ ...inputSt, fontWeight: 600 }}
                type="number"
                value={valorMercadoA}
                onChange={(e) => {
                  const v = +e.target.value || 0;
                  if (manual) setMValor(v); else setVOverride(v);
                }}
              /></div>
          ) : (
            <div className="fld-row">
              <div className="fld"><label style={lblSt}>Valor na curva — se ficar (R$)</label>
                <input
                  style={{ ...inputSt, fontWeight: 600 }}
                  type="number"
                  value={valorCurvaA}
                  onChange={(e) => setVCurvaOverride(+e.target.value || 0)}
                /></div>
              <div className="fld"><label style={lblSt}>Valor de mercado — se sair (R$)</label>
                <input
                  style={{ ...inputSt, fontWeight: 600 }}
                  type="number"
                  value={valorMercadoA}
                  onChange={(e) => setVOverride(+e.target.value || 0)}
                /></div>
            </div>
          )}
          {!isRV && desagioImplicito > 0 && (
            <div style={{
              background: "var(--secondary)", borderRadius: 7, padding: "6px 10px",
              fontSize: 11, color: "var(--muted-foreground)", marginBottom: 9,
            }}>
              Deságio implícito: <b>{fmtR(desagioImplicito)}</b> — sair hoje entrega {fmtR(valorMercadoA)} dos {fmtR(valorCurvaA)} da curva.
            </div>
          )}

          <div className="fld-row">
            <div className="fld"><label style={lblSt}>Custo extra de saída — IR/corretagem (R$)</label>
              <input style={inputSt} type="number" value={custoSaida} onChange={(e) => setCustoSaida(+e.target.value || 0)} /></div>
            {isRV ? (
              <div className="fld"><label style={lblSt}>DY esperado %/ano</label>
                <input style={inputSt} type="number" step={0.5} value={dyA} onChange={(e) => setADy(+e.target.value || 0)} /></div>
            ) : (
              <div className="fld"><label style={lblSt}>Taxa atual %/ano</label>
                <input style={inputSt} type="number" step={0.05} value={taxaRfA} onChange={(e) => setATaxaRf(+e.target.value || 0)} /></div>
            )}
          </div>
          {isRV && (
            <div className="fld"><label style={lblSt}>Variação de preço esperada %/ano</label>
              <input style={inputSt} type="number" step={0.5} value={aApre} onChange={(e) => setAApre(+e.target.value || 0)} /></div>
          )}
          {pedagioTotal > 0 && (
            <div style={{
              background: "var(--secondary)", borderRadius: 7, padding: "6px 10px",
              fontSize: 11, color: "var(--muted-foreground)",
            }}>
              Pedágio total de <b>{fmtR(pedagioTotal)}</b>{desagioImplicito > 0 && custo > 0 ? ` (deságio ${fmtR(desagioImplicito)} + custos ${fmtR(custo)})` : ""}:
              o destino parte de <b>{fmtR(sim.capB)}</b> e precisa alcançar a curva de quem fica.
            </div>
          )}
        </div>

        <div className="side-card b">
          <div className="side-title b">Destino — para onde vai</div>
          <div className="fld">
            <label style={lblSt}>Tipo de destino</label>
            <select style={inputSt} value={tipoB} onChange={(e) => setTipoB(e.target.value as DestinoTipo)}>
              {(Object.keys(DESTINO_LABEL) as DestinoTipo[]).map((t) => (
                <option key={t} value={t}>{DESTINO_LABEL[t]}</option>
              ))}
            </select>
          </div>

          {(tipoB === "lci" || tipoB === "cdb") && (
            <div className="fld-row">
              <div className="fld"><label style={lblSt}>% do CDI</label>
                <input style={inputSt} type="number" step={0.5} value={pctCdi} onChange={(e) => setPctCdi(+e.target.value || 0)} /></div>
              {tipoB === "cdb" ? (
                <div className="fld"><label style={lblSt}>IR</label>
                  <select style={inputSt} value={irCdb} onChange={(e) => setIrCdb(+e.target.value)}>
                    <option value={0.225}>22,5%</option><option value={0.2}>20%</option>
                    <option value={0.175}>17,5%</option><option value={0.15}>15%</option>
                  </select></div>
              ) : (
                <div className="fld"><label style={lblSt}>CDI hoje %</label>
                  <input
                    style={inputSt} type="number" step={0.05}
                    value={+(selic[0] - 0.1).toFixed(2)}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v)) setSelic((prev) => { const n = [...prev]; n[0] = +(v + 0.1).toFixed(2); return n; });
                    }}
                  /></div>
              )}
            </div>
          )}
          {tipoB === "ipca" && (
            <div className="fld-row">
              <div className="fld"><label style={lblSt}>Taxa real IPCA+ %</label>
                <input style={inputSt} type="number" step={0.1} value={ipcaReal} onChange={(e) => setIpcaReal(+e.target.value || 0)} /></div>
              <div className="fld"><label style={lblSt}>IPCA projetado %</label>
                <input style={inputSt} type="number" step={0.1} value={ipcaProj} onChange={(e) => setIpcaProj(+e.target.value || 0)} /></div>
            </div>
          )}
          {tipoB === "pre" && (
            <div className="fld"><label style={lblSt}>Taxa pré %/ano</label>
              <input style={inputSt} type="number" step={0.05} value={preTaxa} onChange={(e) => setPreTaxa(+e.target.value || 0)} /></div>
          )}
          {tipoB === "acao" && (
            <div className="fld-row">
              <div className="fld"><label style={lblSt}>DY esperado %/ano</label>
                <input style={inputSt} type="number" step={0.5} value={acaoDy} onChange={(e) => setAcaoDy(+e.target.value || 0)} /></div>
              <div className="fld"><label style={lblSt}>Variação esperada %/ano</label>
                <input style={inputSt} type="number" step={0.5} value={acaoApre} onChange={(e) => setAcaoApre(+e.target.value || 0)} /></div>
            </div>
          )}
          {tipoB === "carteira" && (
            <div className="fld"><label style={lblSt}>Ativo destino</label>
              <select style={inputSt} value={cartDestId} onChange={(e) => setCartDestId(e.target.value)}>
                {CARTEIRA.filter((a) => a.classe === "rf" && a.id !== origemId).map((a) => (
                  <option key={a.id} value={a.id}>{a.nome} · {a.taxaBruta}%</option>
                ))}
              </select></div>
          )}

          <div className="fld">
            <label style={lblSt}>Horizonte</label>
            <select style={inputSt} value={hz} onChange={(e) => setHz(+e.target.value)}>
              <option value={3}>3 anos</option><option value={5}>5 anos</option>
              <option value={7}>7 anos</option><option value={10}>10 anos</option>
            </select>
          </div>

          <div className="tip-txt">
            1º ano: origem {pct(sim.tA1, 2)} vs destino {pct(sim.tB1, 2)} líquido
            {taxaB1Isenta && ` (≈ ${pct(equivBruta, 2)} bruto em CDB — equivalência embutida)`}
          </div>

          <div style={{ display: "flex", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
            <button
              onClick={() => setShowSelic(!showSelic)}
              style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 11, cursor: "pointer", padding: 0, fontFamily: "inherit", textDecoration: "underline" }}
            >
              {showSelic ? "▾ ocultar curva Selic" : "▸ editar curva Selic projetada"}
            </button>
            <button
              onClick={async () => {
                setBuscaMsg("consultando BCB…");
                try {
                  const r = await fetch("https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json");
                  const j = await r.json();
                  const v = parseFloat(j?.[0]?.valor);
                  if (!isNaN(v)) {
                    setSelic((prev) => { const n = [...prev]; n[0] = +(v + 0.1).toFixed(2); return n; });
                    setBuscaMsg(`✓ CDI ${v.toFixed(2)}% (BCB, série 4389)`);
                  } else setBuscaMsg("BCB sem dados — mantido o valor atual");
                } catch {
                  setBuscaMsg("BCB indisponível — mantido o valor atual");
                }
              }}
              style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 11, cursor: "pointer", padding: 0, fontFamily: "inherit", textDecoration: "underline" }}
            >
              ↻ CDI do Banco Central
            </button>
            {buscaMsg && !manual && <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{buscaMsg}</span>}
          </div>
          {showSelic && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
              {SELIC_DEF.slice(0, hz).map((def, i) => (
                <span key={i} style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <label style={{ fontSize: 9, color: "var(--muted-foreground)" }}>{ANOS[i]}</label>
                  <input
                    type="number" step={0.25} value={selic[i] ?? def}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setSelic((prev) => { const n = [...prev]; n[i] = isNaN(v) ? def : v; return n; });
                    }}
                    style={{ ...inputSt, width: 56, padding: "3px 5px", textAlign: "center", fontSize: 11 }}
                  />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── LINHA DURA (só RV com histórico) ── */}
      {retro && (
        <div style={{
          background: "linear-gradient(135deg, #26384a, #1f3a52)", borderRadius: 11,
          padding: "15px 18px", marginBottom: 13, color: "#e8e2d5",
        }}>
          <div style={{ color: "#d8b36a", fontFamily: "var(--font-serif)", fontSize: 14, marginBottom: 10 }}>
            ⚖ Linha dura — o que esse capital já perdeu parado
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
            {[
              { l: "Tempo na carteira", v: `~${retro.anos} anos`, c: undefined },
              { l: "Retorno total (preço+div)", v: pct(retro.retornoTotalPct), c: retro.perdeuDoCDI ? "#e8a0a0" : "#a0d4b0" },
              { l: "CDI no período", v: "+" + pct(retro.cdiPeriodoPct), c: "#a0d4b0" },
              { l: "Inflação no período", v: "+" + pct(retro.ipcaPeriodoPct), c: undefined },
              { l: "Ficou para trás vs CDI", v: retro.gapVsCdi > 0 ? "−" + fmtR(retro.gapVsCdi) : "à frente", c: retro.gapVsCdi > 0 ? "#e8a0a0" : "#a0d4b0" },
            ].map((k) => (
              <div key={k.l}>
                <div style={{ fontSize: 9.5, letterSpacing: ".1em", textTransform: "uppercase", color: "#9fb0bf", marginBottom: 3 }}>{k.l}</div>
                <div style={{ fontSize: 17, fontFamily: "var(--font-serif)", color: k.c }}>{k.v}</div>
              </div>
            ))}
          </div>
          {(retro.perdaNominal || retro.perdaReal) && (
            <div style={{ fontSize: 11, color: "#c4b494", marginTop: 10, borderTop: "1px solid rgba(216,179,106,.25)", paddingTop: 9, lineHeight: 1.55 }}>
              {retro.perdaNominal && <>Vale hoje <b>menos que o investido</b> ({fmtR(retro.valorInvestido)} → {fmtR(ativo!.valorMercado)}). </>}
              {retro.perdaReal && <>Retorno total abaixo da inflação: <b>perda real de poder de compra</b>. </>}
              Esperar "voltar ao preço médio" é pagar o CDI de aluguel, ano após ano.
            </div>
          )}

          {/* Quanto estamos devendo a nós mesmos — contrafactual */}
          {ativo?.anoCompra && (() => {
            const estaria = ondeEstaria(retro.valorInvestido, ativo.anoCompra!, pctCdi || 89);
            const temos = ativo.valorMercado + (ativo.divRecebidos ?? 0);
            const divida = estaria - temos;
            return (
              <div style={{
                marginTop: 12, background: "rgba(216,179,106,.10)", border: "1px solid rgba(216,179,106,.3)",
                borderRadius: 9, padding: "11px 14px",
              }}>
                <div style={{ fontSize: 10, letterSpacing: ".12em", textTransform: "uppercase", color: "#d8b36a", marginBottom: 8 }}>
                  Quanto estamos devendo a nós mesmos
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, fontSize: 12 }}>
                  <div>
                    <div style={{ color: "#9fb0bf", fontSize: 10 }}>Onde estaria ({pctCdi || 89}% CDI desde {ativo.anoCompra})</div>
                    <div style={{ fontSize: 16, fontFamily: "var(--font-serif)", color: "#a0d4b0" }}>{fmtR(estaria)}</div>
                  </div>
                  <div>
                    <div style={{ color: "#9fb0bf", fontSize: 10 }}>Onde está (mercado + dividendos)</div>
                    <div style={{ fontSize: 16, fontFamily: "var(--font-serif)" }}>{fmtR(temos)}</div>
                  </div>
                  <div>
                    <div style={{ color: "#9fb0bf", fontSize: 10 }}>Dívida com nós mesmos</div>
                    <div style={{ fontSize: 16, fontFamily: "var(--font-serif)", color: divida > 0 ? "#e8a0a0" : "#a0d4b0" }}>
                      {divida > 0 ? "−" + fmtR(divida) : "+" + fmtR(-divida)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── JANELA DE DURATION (RF marcada a mercado) ── */}
      {!isRV && ativo?.durationAnos && ativo?.taxaRealCurva != null && ativo?.taxaRealMercado != null && (() => {
        const dur = ativo.durationAnos!;
        const tc = ativo.taxaRealCurva!;
        const tm = ativo.taxaRealMercado!;
        /* aproximação: a taxa real de mercado cai junto com a Selic projetada;
           deságio% ≈ duration × (taxaMercado − taxaCurva); janela = quando zera */
        const quedaSelic = (i: number) => (selic[0] ?? 13.5) - (selic[Math.min(i, selic.length - 1)] ?? 9);
        let janela: number | null = null;
        for (let i = 0; i < 10; i++) {
          if (tm - quedaSelic(i) <= tc) { janela = 2026 + i; break; }
        }
        const desagioPctHoje = Math.max(dur * (tm - tc), 0);
        return (
          <div className="card" style={{ marginBottom: 13, borderLeft: "3px solid var(--ring)" }}>
            <div className="card-hdr">
              Janela de duration
              <span>estimativa didática — preço ≈ duration × variação da taxa</span>
            </div>
            <div style={{ fontSize: 12.5, lineHeight: 1.7 }}>
              Contratado a <b>IPCA+{tc}%</b>; mercado hoje exige <b>IPCA+{tm}%</b>.
              Com duration de <b>{dur} anos</b>, o deságio implícito é da ordem de <b>{desagioPctHoje.toFixed(0)}%</b> do valor na curva.
              {janela !== null ? (
                <> Se a taxa real cair junto com a Selic projetada, o deságio deve fechar por volta de{" "}
                <b style={{ color: "var(--accent)" }}>{janela}</b> — essa é a janela para migrar <b>sem pagar pedágio</b>.
                Antes disso, sair custa caro; depois, o título perde a vantagem de taxa.</>
              ) : (
                <> Com a curva Selic projetada, a taxa real não converge para a contratada em 10 anos — o deságio tende a persistir; avalie a troca pelo cruzamento das curvas abaixo.</>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── VEREDITO ── */}
      <div style={{
        background: VBG[vd.t], border: `1px solid ${VCOLOR[vd.t]}44`, borderRadius: 10,
        padding: "13px 17px", marginBottom: 13, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
      }}>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: ".08em", padding: "6px 14px",
          borderRadius: 20, whiteSpace: "nowrap", background: VCOLOR[vd.t], color: "#fff",
        }}>{vd.t}</span>
        <span style={{ fontSize: 12.5, lineHeight: 1.5, color: VCOLOR[vd.t], flex: 1, minWidth: 220 }}>
          <b>{nomeA} → {descDestino}:</b> {vd.motivo}
          {vd.t !== "MANTER" && sim.ganhoMes > 0 && (
            <> Troca rende <b>+{fmtR(sim.ganhoMes)}/mês</b>{pedagioTotal > 0 ? <> e paga o pedágio em <b>{bkMeses} {bkMeses === 1 ? "mês" : "meses"}</b></> : " sem custo de saída"}.</>
          )}
        </span>
      </div>

      {/* ── PEDÁGIO & CRUZAMENTO — o breakeven da troca ── */}
      <div className="kpi-row" style={{ marginBottom: 13 }}>
        <div className="kpi">
          <div className="kpi-l">Pedágio de saída</div>
          <div className="kpi-v" style={{ color: pedagioTotal > 0 ? "var(--destructive)" : undefined }}>
            {pedagioTotal > 0 ? fmtR(pedagioTotal) : "—"}
          </div>
          <div className="kpi-s">
            {pedagioTotal > 0
              ? desagioImplicito > 0 ? `deságio + custos · destino parte de ${fmtR(sim.capB)}` : `destino parte de ${fmtR(sim.capB)}`
              : "sem custo de saída"}
          </div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Ganho na taxa nova</div>
          <div className="kpi-v" style={{ color: sim.ganhoMes > 0 ? "var(--success, #5B8A6A)" : "var(--destructive)" }}>
            {sim.ganhoMes > 0 ? "+" : ""}{fmtR(sim.ganhoMes)}/mês
          </div>
          <div className="kpi-s">1º ano · {pct(sim.tB1, 2)} vs {pct(sim.tA1, 2)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Pedágio pago em</div>
          <div className="kpi-v">
            {pedagioTotal === 0 ? "imediato" : sim.ganhoMes > 0 ? `${bkMeses} ${bkMeses === 1 ? "mês" : "meses"}` : "nunca"}
          </div>
          <div className="kpi-s">breakeven da troca (fluxo)</div>
        </div>
        <div className="kpi">
          <div className="kpi-l">Curvas se cruzam</div>
          <div className="kpi-v" style={{ color: sim.cruzaMes === null ? "var(--destructive)" : undefined }}>
            {sim.cruzaMes === null
              ? "não cruzam"
              : sim.cruzaMes <= 1
              ? "imediato"
              : sim.cruzaMes % 12 === 0
              ? `${sim.cruzaMes / 12} ${sim.cruzaMes === 12 ? "ano" : "anos"}`
              : `${sim.cruzaMes} meses`}
          </div>
          <div className="kpi-s">
            {sim.cruzaMes === null
              ? "em até 10 anos — origem rende mais"
              : `destino ultrapassa a origem em ${new Date(2026, 6 + sim.cruzaMes, 1).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}`}
          </div>
        </div>
      </div>

      {/* ── COMPARAÇÃO NO TEMPO ── */}
      <div className="card" style={{ marginBottom: 13 }}>
        <div className="card-hdr">
          Comparação no tempo
          <span>curva Selic decrescente · dividendos da origem NÃO compõem</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="cmp-tbl">
            <thead>
              <tr><th>Ano</th><th>Ficar — {nomeA}</th><th>Trocar — {descDestino}</th><th>Diferença</th><th></th></tr>
            </thead>
            <tbody>
              {sim.rows.map((r) => {
                const win = r.b > r.a;
                return (
                  <tr key={r.ano} className={win ? "win" : ""}>
                    <td>{r.ano} {r.ano === 1 ? "ano" : "anos"}</td>
                    <td>{fmtR(r.a)}</td>
                    <td style={{ color: win ? "var(--success)" : "inherit" }}>{fmtR(r.b)}</td>
                    <td style={{ color: win ? "var(--success)" : "var(--danger)" }}>
                      {win ? "+" : "−"}{fmtR(Math.abs(r.b - r.a))}
                    </td>
                    <td><span className={"sb " + (win ? "sb-g" : "sb-r")}>{win ? "destino ganha" : "origem ganha"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {isRV && sim.cagrNec !== null && (
          <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 8 }}>
            Para a origem empatar com o destino em {hz} anos, o preço precisa subir <b>{pct(sim.cagrNec)} a.a.</b> além
            dos dividendos ({fmtR(sim.divAcum)} projetados, parados na conta).
          </div>
        )}
      </div>

      {/* ── AÇÕES ── */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={registrar}
          style={{
            background: "var(--accent)", color: "var(--accent-foreground)", border: "none",
            padding: "9px 18px", borderRadius: 8, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit",
          }}
        >＋ Registrar como giro (breakeven)</button>
        {giroSalvo && (
          <span style={{ fontSize: 12, color: "var(--success)" }}>
            ✓ Giro registrado — acompanhe em Breakeven &amp; giros
          </span>
        )}
        <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
          Toda troca confirmada vira um giro com custo, ganho/mês e prazo de recuperação.
        </span>
      </div>
    </>
  );
}
