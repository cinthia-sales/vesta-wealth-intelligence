import { useMemo, useState } from "react";

import { CARTEIRA } from "@/data/carteira-ativos";
import { CADASTRO_ATIVOS, cadastroDoCodigo, codigoAtivo, type CadastroAtivo } from "@/data/cadastro-ativos";
import { getSensibilidade } from "@/data/sensibilidade";

type Cotacao = {
  preco?: number;
  nome?: string;
  variacao?: number;
  moeda?: string;
  fonte?: string;
};

type NotaLocal = {
  decisao: "estudar" | "manter" | "comprar" | "reduzir" | "sair";
  tese: string;
  precoJusto: string;
  precoAlerta: string;
  observacao: string;
};

const NOTA_PADRAO: NotaLocal = {
  decisao: "estudar",
  tese: "",
  precoJusto: "",
  precoAlerta: "",
  observacao: "",
};

const fmtR = (n: number) => "R$ " + Math.round(n).toLocaleString("pt-BR");
const fmtP = (n: number) => "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function notaKey(codigo: string) {
  return `vesta.raiox.${codigo.toUpperCase()}`;
}

function carregarNota(codigo: string): NotaLocal {
  if (typeof window === "undefined" || !codigo) return NOTA_PADRAO;
  try {
    const raw = window.localStorage.getItem(notaKey(codigo));
    return raw ? { ...NOTA_PADRAO, ...JSON.parse(raw) } : NOTA_PADRAO;
  } catch {
    return NOTA_PADRAO;
  }
}

function salvarNota(codigo: string, nota: NotaLocal) {
  if (typeof window === "undefined" || !codigo) return;
  window.localStorage.setItem(notaKey(codigo), JSON.stringify(nota));
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-flex",
      padding: "3px 8px",
      borderRadius: 999,
      border: "1px solid var(--border)",
      background: "var(--secondary)",
      color: "var(--muted-foreground)",
      fontSize: 11,
      lineHeight: 1.35,
    }}>
      {children}
    </span>
  );
}

function FieldBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", color: "var(--muted-foreground)", marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {items.map((item) => (
          <div key={item} style={{
            border: "1px solid var(--border)",
            borderRadius: 9,
            padding: "8px 10px",
            fontSize: 12.5,
            color: "var(--muted-foreground)",
            background: "#fff",
            lineHeight: 1.45,
          }}>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function CadastroCard({ cadastro }: { cadastro: CadastroAtivo }) {
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-hdr">
        Cadastro Vesta <span>{cadastro.codigo} · {cadastro.nome}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.5 }}>
          <div><strong style={{ color: "var(--foreground)" }}>Tipo:</strong> {cadastro.tipo}</div>
          <div><strong style={{ color: "var(--foreground)" }}>Tributação:</strong> {cadastro.tributacao}</div>
          <div><strong style={{ color: "var(--foreground)" }}>Custos/spread:</strong> {cadastro.custos}</div>
          <div><strong style={{ color: "var(--foreground)" }}>Liquidez:</strong> {cadastro.liquidez}</div>
          <div><strong style={{ color: "var(--foreground)" }}>Benchmark:</strong> {cadastro.benchmark}</div>
          {cadastro.nota && <div style={{ color: "var(--accent)" }}>{cadastro.nota}</div>}
        </div>
        <FieldBlock title="Drivers principais" items={cadastro.drivers} />
        <FieldBlock title="Métricas que importam" items={cadastro.metricas} />
      </div>
    </div>
  );
}

export function RaioXPage() {
  const codigos = useMemo(() => {
    const fromCarteira = CARTEIRA.map((a) => codigoAtivo(a.nome)).filter(Boolean);
    return Array.from(new Set([...Object.keys(CADASTRO_ATIVOS), ...fromCarteira])).filter((c) => c !== "PSS3").sort();
  }, []);

  const [codigo, setCodigo] = useState(codigos[0] ?? "VALE3");
  const [cotacao, setCotacao] = useState<Cotacao | null>(null);
  const [buscaMsg, setBuscaMsg] = useState("");
  const [nota, setNota] = useState<NotaLocal>(() => carregarNota(codigos[0] ?? "VALE3"));

  const normalizado = codigo.toUpperCase().trim();
  const cadastro = cadastroDoCodigo(normalizado);
  const posicoes = CARTEIRA.filter((a) => codigoAtivo(a.nome) === normalizado);
  const sensibilidade = getSensibilidade(normalizado);

  const setCodigoAtivo = (value: string) => {
    const next = value.toUpperCase().trim();
    setCodigo(next);
    setCotacao(null);
    setBuscaMsg("");
    setNota(carregarNota(next));
  };

  const setNotaCampo = <K extends keyof NotaLocal>(campo: K, valor: NotaLocal[K]) => {
    const next = { ...nota, [campo]: valor };
    setNota(next);
    salvarNota(normalizado, next);
  };

  const buscarCotacao = async () => {
    if (!normalizado) return;
    setBuscaMsg("buscando cotação…");
    try {
      const response = await fetch(`https://brapi.dev/api/quote/${normalizado}`);
      const json = await response.json();
      const q = json?.results?.[0];
      if (!q?.regularMarketPrice) {
        setBuscaMsg("não encontrei cotação automática; mantenha o cadastro Vesta/manual");
        setCotacao(null);
        return;
      }
      setCotacao({
        preco: q.regularMarketPrice,
        nome: q.longName ?? q.shortName,
        variacao: q.regularMarketChangePercent,
        moeda: q.currency,
        fonte: "brapi/B3",
      });
      setBuscaMsg("cotação preenchida");
    } catch {
      setBuscaMsg("fonte indisponível agora; o cadastro Vesta continua funcionando");
      setCotacao(null);
    }
  };

  return (
    <>
      <div className="ph">
        <h1>Raio-X do ativo</h1>
        <p>
          Consulte o que move um ativo antes de comprar, manter ou sair. A Vesta separa dado automático,
          julgamento humano e custo de oportunidade — sem teatrinho de valuation.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Ativo em análise <span>cadastro + posição + tese</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) auto", gap: 10, alignItems: "end" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "var(--muted-foreground)" }}>
            Código do ativo
            <input
              list="raiox-codigos"
              value={codigo}
              onChange={(e) => setCodigoAtivo(e.target.value)}
              placeholder="ex.: VALE3, PSSA3, ITSA4"
              style={{
                border: "1px solid var(--border)",
                borderRadius: 9,
                padding: "10px 12px",
                fontFamily: "inherit",
                fontSize: 14,
                background: "#fff",
              }}
            />
            <datalist id="raiox-codigos">
              {codigos.map((c) => <option key={c} value={c} />)}
            </datalist>
          </label>
          <button
            onClick={buscarCotacao}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 9,
              padding: "10px 14px",
              background: "var(--primary)",
              color: "var(--primary-foreground)",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            buscar cotação
          </button>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {cadastro ? <Pill>{cadastro.tipo}</Pill> : <Pill>sem cadastro Vesta ainda</Pill>}
          {posicoes.length ? <Pill>{posicoes.length} posição(ões) na carteira</Pill> : <Pill>fora da carteira atual</Pill>}
          {cotacao?.preco && <Pill>{cotacao.fonte}: {fmtP(cotacao.preco)} {cotacao.moeda ?? ""}</Pill>}
          {cotacao?.variacao != null && <Pill>dia: {cotacao.variacao.toFixed(2)}%</Pill>}
          {buscaMsg && <Pill>{buscaMsg}</Pill>}
        </div>
      </div>

      {cadastro ? (
        <CadastroCard cadastro={cadastro} />
      ) : (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-hdr">Cadastro Vesta <span>pendente</span></div>
          <p style={{ color: "var(--muted-foreground)", fontSize: 13, lineHeight: 1.55, margin: 0 }}>
            Ainda não há cadastro curado para {normalizado || "este ativo"}. A cotação pode até existir,
            mas faltam os itens que dão inteligência: drivers, riscos, métrica de valuation e pergunta decisória.
          </p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 14 }}>
        <div className="card">
          <div className="card-hdr">Sua posição <span>{posicoes.length ? "Vesta" : "não encontrada"}</span></div>
          {posicoes.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {posicoes.map((a) => (
                <div key={a.id} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, lineHeight: 1.55 }}>
                  <strong>{a.nome}</strong>
                  <div style={{ color: "var(--muted-foreground)", fontSize: 12 }}>
                    Valor de mercado: {fmtR(a.valorMercado)}
                    {a.qtd ? ` · ${a.qtd} unidades` : ""}
                    {a.pm ? ` · PM ${fmtP(a.pm)}` : ""}
                    {a.dyEsperado ? ` · DY premissa ${a.dyEsperado}%` : ""}
                    {a.divRecebidos ? ` · dividendos recebidos ${fmtR(a.divRecebidos)}` : ""}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--muted-foreground)", fontSize: 13, lineHeight: 1.55, margin: 0 }}>
              Não achei esse ativo nas carteiras atuais. Ainda assim dá para estudar o cadastro e salvar uma tese.
            </p>
          )}
        </div>

        <div className="card">
          <div className="card-hdr">Caderno da Vesta <span>editável sem código</span></div>
          <div style={{ display: "grid", gap: 9 }}>
            <label style={{ display: "grid", gap: 5, fontSize: 12, color: "var(--muted-foreground)" }}>
              Decisão
              <select
                value={nota.decisao}
                onChange={(e) => setNotaCampo("decisao", e.target.value as NotaLocal["decisao"])}
                style={{ border: "1px solid var(--border)", borderRadius: 9, padding: "9px 10px", fontFamily: "inherit" }}
              >
                <option value="estudar">estudar</option>
                <option value="comprar">comprar</option>
                <option value="manter">manter</option>
                <option value="reduzir">reduzir</option>
                <option value="sair">sair</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: 5, fontSize: 12, color: "var(--muted-foreground)" }}>
              Tese em uma frase
              <input value={nota.tese} onChange={(e) => setNotaCampo("tese", e.target.value)}
                style={{ border: "1px solid var(--border)", borderRadius: 9, padding: "9px 10px", fontFamily: "inherit" }} />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              <label style={{ display: "grid", gap: 5, fontSize: 12, color: "var(--muted-foreground)" }}>
                Preço justo
                <input value={nota.precoJusto} onChange={(e) => setNotaCampo("precoJusto", e.target.value)}
                  style={{ border: "1px solid var(--border)", borderRadius: 9, padding: "9px 10px", fontFamily: "inherit" }} />
              </label>
              <label style={{ display: "grid", gap: 5, fontSize: 12, color: "var(--muted-foreground)" }}>
                Preço de alerta
                <input value={nota.precoAlerta} onChange={(e) => setNotaCampo("precoAlerta", e.target.value)}
                  style={{ border: "1px solid var(--border)", borderRadius: 9, padding: "9px 10px", fontFamily: "inherit" }} />
              </label>
            </div>
            <label style={{ display: "grid", gap: 5, fontSize: 12, color: "var(--muted-foreground)" }}>
              Observações
              <textarea value={nota.observacao} onChange={(e) => setNotaCampo("observacao", e.target.value)}
                rows={4}
                style={{ border: "1px solid var(--border)", borderRadius: 9, padding: "9px 10px", fontFamily: "inherit", resize: "vertical" }} />
            </label>
          </div>
        </div>
      </div>

      {cadastro && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 14 }}>
          <div className="card">
            <div className="card-hdr">Valuation prático <span>sem vidência</span></div>
            <FieldBlock title="Como olhar preço x valor" items={cadastro.valuation} />
          </div>
          <div className="card">
            <div className="card-hdr">Perguntas decisórias <span>Vesta</span></div>
            <FieldBlock title="Antes de comprar/manter/sair" items={cadastro.perguntasVesta} />
          </div>
        </div>
      )}

      {sensibilidade && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-hdr">Sensibilidades <span>{sensibilidade.classe}</span></div>
          <p style={{ color: "var(--muted-foreground)", fontSize: 13, lineHeight: 1.55, marginTop: 0 }}>
            {sensibilidade.resumo}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
            {sensibilidade.fatores.map((f) => (
              <div key={f.nome} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 5 }}>
                  <strong>{f.nome}</strong>
                  <Pill>{f.impacto}</Pill>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--muted-foreground)", lineHeight: 1.45 }}>{f.direcao}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cadastro && (
        <div className="card">
          <div className="card-hdr">Fontes e atualização <span>o que dá para automatizar</span></div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            <FieldBlock title="Pode vir de API / fonte externa" items={cadastro.dadosAutomaticos} />
            <FieldBlock title="Ainda precisa de julgamento da Vesta" items={cadastro.dadosManuais} />
            <div style={{ fontSize: 13, color: "var(--muted-foreground)", lineHeight: 1.55 }}>
              <strong style={{ color: "var(--foreground)" }}>Fontes:</strong> {cadastro.fontes}
              <br /><br />
              Bacen entra para CDI, Selic e IPCA. B3/corretora entram para preço e execução.
              RI/CVM entram para proventos e documentos. A decisão final continua sendo da Vesta.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
