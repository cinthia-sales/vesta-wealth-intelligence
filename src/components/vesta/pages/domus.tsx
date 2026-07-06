import {
  DOMUS_NAME,
  getPersonaInfo,
  type PersonaId,
  type ProfileId,
  type Scope,
  type ScopeMap,
} from "@/state/session";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { approveJoinRequest, createDomus, DEFAULT_MEMBER_PASSWORD, getDomusAdmin, updateJoinRequestStatus } from "@/lib/domus.functions";
import { useState } from "react";

/* ============================================================
   DomusPage — só a Vesta acessa.
   Lista membros, escopos e permite editar (checkboxes livres).
   ============================================================ */
export function DomusPage({
  scopes,
  onUpdateScopes,
}: {
  scopes: ScopeMap;
  onUpdateScopes: (next: ScopeMap) => void;
}) {
  const membros: PersonaId[] = ["cinthia", "paulo"];
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoSlug, setNovoSlug] = useState("");
  const [novaDescricao, setNovaDescricao] = useState("");

  const { data: adminData, isLoading } = useQuery({
    queryKey: ["domus-admin"],
    queryFn: () => getDomusAdmin(),
  });

  const createMutation = useMutation({
    mutationFn: () => createDomus({ data: { nome: novoNome, slug: novoSlug, descricao: novaDescricao } }),
    onSuccess: () => {
      setNovoNome("");
      setNovoSlug("");
      setNovaDescricao("");
      setShowCreate(false);
      queryClient.invalidateQueries({ queryKey: ["domus-admin"] });
    },
  });

  const [aprovado, setAprovado] = useState<{ email: string; senha: string } | null>(null);

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveJoinRequest({ data: { id } }),
    onSuccess: (res) => {
      setAprovado({ email: res.email, senha: res.senha });
      queryClient.invalidateQueries({ queryKey: ["domus-admin"] });
    },
  });

  const recusaMutation = useMutation({
    mutationFn: (id: string) => updateJoinRequestStatus({ data: { id, status: "recusado" } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["domus-admin"] }),
  });

  const [savedFlash, setSavedFlash] = useState(false);
  const flashSaved = () => {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
  };

  const toggleConsolidado = (id: PersonaId) => {
    onUpdateScopes({
      ...scopes,
      [id]: { ...scopes[id], seeConsolidado: !scopes[id].seeConsolidado },
    });
    flashSaved();
  };

  const togglePersona = (owner: PersonaId, target: PersonaId) => {
    const cur = scopes[owner].seePersonae;
    const next = cur.includes(target)
      ? cur.filter((p) => p !== target)
      : [...cur, target];
    onUpdateScopes({
      ...scopes,
      [owner]: { ...scopes[owner], seePersonae: next },
    });
    flashSaved();
  };

  const domusList = adminData?.domus ?? [];
  const primeiro = domusList[0];
  const vestaNome = adminData?.vesta?.nome ?? "Cínthia";
  const domusAtual = primeiro?.nome ?? DOMUS_NAME;

  return (
    <>
      <div className="ph">
        <h1>🏛 Gestão do Domus</h1>
        <p className="domus-supervisao">
          <strong>Domus {domusAtual}</strong> · sob supervisão da Vesta {vestaNome}
        </p>
        <p>
          Como Vesta, você é soberana sobre quem vê o quê. Cada membro sempre vê
          a própria carteira; o resto é você quem libera.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Domus cadastrados <span>{domusList.length}</span>
        </div>
        <div className="domus-list">
          {isLoading && <span>Carregando Domus…</span>}
          {!isLoading && domusList.length === 0 && (
            <span className="aitem-det">Nenhum Domus criado ainda.</span>
          )}
          {domusList.map((item) => (
            <div key={item.id} className="domus-pill">
              <strong>{item.nome}</strong>
              <span>/{item.slug}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: "0 16px 16px" }}>
          {!showCreate ? (
            <button
              type="button"
              className="domus-ghost-btn"
              onClick={() => setShowCreate(true)}
            >
              + Criar novo Domus
            </button>
          ) : (
            <form
              className="domus-admin-form"
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate();
              }}
            >
              <label>
                Nome
                <input
                  value={novoNome}
                  placeholder="Ex.: Família Silva"
                  onChange={(e) => setNovoNome(e.target.value)}
                  required
                />
              </label>
              <label>
                Identificador
                <input
                  value={novoSlug}
                  placeholder="familia-silva"
                  onChange={(e) => setNovoSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  required
                />
              </label>
              <label className="wide">
                Descrição
                <textarea
                  value={novaDescricao}
                  placeholder="Um resumo curto do propósito desse Domus."
                  onChange={(e) => setNovaDescricao(e.target.value)}
                  rows={3}
                />
              </label>
              <div className="wide" style={{ display: "flex", gap: 8 }}>
                <button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando…" : "Criar Domus"}
                </button>
                <button
                  type="button"
                  className="domus-ghost-btn"
                  onClick={() => {
                    setShowCreate(false);
                    setNovoNome("");
                    setNovoSlug("");
                    setNovaDescricao("");
                  }}
                >
                  cancelar
                </button>
              </div>
              {createMutation.error && (
                <div className="auth-error wide">
                  {(createMutation.error as Error).message}
                </div>
              )}
            </form>
          )}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Pessoas do Domus <span>{adminData?.members?.length ?? 0} membros</span>
        </div>
        <div className="domus-members-list">
          {isLoading && <div className="aitem-det">Carregando pessoas…</div>}
          {!isLoading && (adminData?.members?.length ?? 0) === 0 && (
            <div className="aitem-det">
              Ninguém aprovado ainda. Quando você aprovar um pedido de entrada,
              a pessoa aparece aqui.
            </div>
          )}
          {adminData?.members?.map((m: any) => (
            <div key={m.id} className="domus-member-row">
              <div className="domus-member-avatar">
                {(m.profile?.nome ?? m.profile?.email ?? "?").charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div className="aitem-name">{m.profile?.nome ?? "Sem nome"}</div>
                <div className="aitem-det">
                  {m.profile?.email} · {m.domus?.nome ?? "—"}
                </div>
              </div>
              <span className="sb sb-g">{m.papel}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Pedidos de entrada <span>{adminData?.requests?.filter((r: any) => r.status === "pendente").length ?? 0} pendentes</span>
        </div>
        <div className="domus-requests">
          {isLoading && <div className="aitem-det">Carregando pedidos…</div>}
          {adminData?.requests?.length === 0 && <div className="aitem-det">Nenhum pedido ainda.</div>}
          {adminData?.requests?.map((pedido: any) => (
            <div key={pedido.id} className="domus-request">
              <div>
                <div className="aitem-name">{pedido.nome}</div>
                <div className="aitem-det">{pedido.email} · {pedido.domus?.nome ?? "Domus a definir"}</div>
                {pedido.mensagem && <p>{pedido.mensagem}</p>}
              </div>
              <span className={`sb ${pedido.status === "pendente" ? "sb-w" : pedido.status === "aprovado" ? "sb-g" : "sb-r"}`}>
                {pedido.status}
              </span>
              {pedido.status === "pendente" && (
                <div className="domus-request-actions">
                  <button
                    onClick={() => approveMutation.mutate(pedido.id)}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? "aprovando…" : "aprovar"}
                  </button>
                  <button
                    onClick={() => recusaMutation.mutate(pedido.id)}
                    disabled={recusaMutation.isPending}
                  >
                    recusar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Membros do Domus <span>{membros.length} personae</span>
        </div>
        <div style={{ padding: 16, display: "grid", gap: 14 }}>
          {membros.map((id) => {
            const p = getPersonaInfo(id);
            const scope = scopes[id] ?? { seeConsolidado: false, seePersonae: [] };
            const isVesta = p.role === "vesta";
            return (
              <div
                key={id}
                style={{
                  border: "1px solid var(--border, #E5DFD3)",
                  borderLeft: `4px solid ${isVesta ? "var(--ring, #D8B36A)" : "var(--accent)"}`,
                  borderRadius: 8,
                  padding: 14,
                  background: "var(--card)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <div
                    className={id === "cinthia" ? "ps-av-cinthia" : "ps-av-paulo"}
                    style={{
                      width: 36, height: 36, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600,
                    }}
                  >
                    {p.initial}
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 600 }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{p.subtitle}</div>
                  </div>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 10, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase",
                      padding: "3px 10px", borderRadius: 12,
                      background: isVesta ? "rgba(216,179,106,.20)" : "rgba(184,115,74,.12)",
                      color: isVesta ? "#8A6B32" : "var(--accent)",
                    }}
                  >
                    {isVesta ? "Vesta · soberana" : "Membro"}
                  </span>
                </div>

                {isVesta ? (
                  <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.6, fontStyle: "italic" }}>
                    Como Vesta, você vê automaticamente todas as carteiras e o consolidado.
                    Esse escopo não é editável — a soberania é implícita ao papel.
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    <label style={rowStyle}>
                      <input type="checkbox" checked disabled />
                      <span style={{ color: "var(--muted)" }}>
                        Ver a própria carteira <em>(mínimo garantido, sempre ligado)</em>
                      </span>
                    </label>

                    <label style={rowStyle}>
                      <input
                        type="checkbox"
                        checked={scope.seeConsolidado}
                        onChange={() => toggleConsolidado(id)}
                      />
                      <span>Ver consolidado do Domus (visão Familiar)</span>
                    </label>

                    {membros
                      .filter((other) => other !== id)
                      .map((other) => (
                        <label key={other} style={rowStyle}>
                          <input
                            type="checkbox"
                            checked={scope.seePersonae.includes(other)}
                            onChange={() => togglePersona(id, other)}
                          />
                          <span>Ver carteira de <strong>{getPersonaInfo(other).name}</strong></span>
                        </label>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          padding: "12px 16px",
          background: "rgba(216,179,106,.10)",
          border: "1px solid rgba(216,179,106,.30)",
          borderRadius: "var(--radius)",
          fontSize: 12,
          color: "var(--muted)",
          lineHeight: 1.6,
        }}
      >
        💡 Ao aprovar um pedido, a Vesta cria o acesso automaticamente com a senha padrão{" "}
        <strong>{DEFAULT_MEMBER_PASSWORD}</strong>. Repasse essa senha ao novo membro por fora —
        ele troca depois em "esqueci a senha".
      </div>

      {approveMutation.error && (
        <div className="auth-error" style={{ marginTop: 10 }}>
          {(approveMutation.error as Error).message}
        </div>
      )}

      {savedFlash && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 18px",
            background: "rgba(216,179,106,.95)",
            color: "#3a2a10",
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 6px 20px rgba(0,0,0,.15)",
            zIndex: 9999,
            letterSpacing: ".02em",
          }}
        >
          ✓ escopo salvo
        </div>
      )}

      {aprovado && (
        <div className="domus-approved-overlay" onClick={() => setAprovado(null)}>
          <div className="domus-approved-card" onClick={(e) => e.stopPropagation()}>
            <p className="public-domus-kicker">Vesta permitiu</p>
            <h3>Acesso concedido</h3>
            <p>Passe estes dados ao novo membro:</p>
            <dl>
              <dt>Email</dt>
              <dd>{aprovado.email}</dd>
              <dt>Senha padrão</dt>
              <dd><code>{aprovado.senha}</code></dd>
            </dl>
            <p style={{ fontSize: 12, color: "var(--muted)" }}>
              No primeiro login ele será saudado pela Deusa. Depois pode trocar a senha em
              "esqueci minha senha".
            </p>
            <button onClick={() => setAprovado(null)}>Entendido</button>
          </div>
        </div>
      )}
    </>
  );
}

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 13,
  cursor: "pointer",
};
