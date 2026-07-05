import {
  PERSONAE,
  DOMUS_NAME,
  type PersonaId,
  type Scope,
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
  scopes: Record<PersonaId, Scope>;
  onUpdateScopes: (next: Record<PersonaId, Scope>) => void;
}) {
  const membros: PersonaId[] = ["cinthia", "paulo"];
  const queryClient = useQueryClient();
  const [novoNome, setNovoNome] = useState(DOMUS_NAME);
  const [novoSlug, setNovoSlug] = useState("familia-malta-furtado");
  const [novaDescricao, setNovaDescricao] = useState("Gestão familiar de patrimônio, permissões e decisões.");

  const { data: adminData, isLoading } = useQuery({
    queryKey: ["domus-admin"],
    queryFn: () => getDomusAdmin(),
  });

  const createMutation = useMutation({
    mutationFn: () => createDomus({ data: { nome: novoNome, slug: novoSlug, descricao: novaDescricao } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["domus-admin"] }),
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

  const toggleConsolidado = (id: PersonaId) => {
    onUpdateScopes({
      ...scopes,
      [id]: { ...scopes[id], seeConsolidado: !scopes[id].seeConsolidado },
    });
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
  };

  return (
    <>
      <div className="ph">
        <h1>🏛 Gestão do Domus</h1>
        <p>
          <strong>{DOMUS_NAME}</strong> · como Vesta, você é soberana sobre quem vê o quê.
          Cada membro sempre vê a própria carteira; o resto é você quem libera.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Criar Domus <span>{adminData?.domus?.length ?? 0} cadastrados</span>
        </div>
        <form
          className="domus-admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
          <label>
            Nome
            <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} required />
          </label>
          <label>
            Identificador
            <input
              value={novoSlug}
              onChange={(e) => setNovoSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              required
            />
          </label>
          <label className="wide">
            Descrição
            <textarea value={novaDescricao} onChange={(e) => setNovaDescricao(e.target.value)} rows={3} />
          </label>
          <button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Criando…" : "Criar Domus"}
          </button>
          {createMutation.error && <div className="auth-error wide">{(createMutation.error as Error).message}</div>}
        </form>
        <div className="domus-list">
          {isLoading && <span>Carregando Domus…</span>}
          {adminData?.domus?.map((item) => (
            <div key={item.id} className="domus-pill">
              <strong>{item.nome}</strong>
              <span>/{item.slug}</span>
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
                  <button onClick={() => statusMutation.mutate({ id: pedido.id, status: "aprovado" })}>aprovar</button>
                  <button onClick={() => statusMutation.mutate({ id: pedido.id, status: "recusado" })}>recusar</button>
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
            const p = PERSONAE[id];
            const scope = scopes[id];
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
                          <span>Ver carteira de <strong>{PERSONAE[other].name}</strong></span>
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
        💡 Os pedidos já ficam salvos no banco. A criação automática de usuário pode entrar no próximo passo,
        depois que você decidir se prefere convite por email ou cadastro manual com senha temporária.
      </div>
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
