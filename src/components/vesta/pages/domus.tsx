import {
  DOMUS_NAME,
  getPersonaInfo,
  type PersonaId,
  type Scope,
  type ScopeMap,
} from "@/state/session";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveJoinRequest,
  createDomus,
  DEFAULT_MEMBER_PASSWORD,
  deleteDomus,
  getDomusAdmin,
  removeMember,
  saveMemberVisibilityScope,
  updateJoinRequestStatus,
} from "@/lib/domus.functions";
import { useState, useEffect } from "react";

export function DomusPage({
  scopes,
  onUpdateScopes,
  profileIdForScopeKey,
}: {
  scopes: ScopeMap;
  onUpdateScopes: (next: ScopeMap) => void;
  profileIdForScopeKey?: (key: string) => string | null;
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

  const removeMemberMutation = useMutation({
    mutationFn: (profileId: string) => removeMember({ data: { profileId } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["domus-admin"] }),
  });

  const deleteDomusMutation = useMutation({
    mutationFn: (id: string) => deleteDomus({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["domus-admin"] }),
  });

  const handleRemoveMember = (m: any) => {
    const nome = m.profile?.nome ?? m.profile?.email ?? "este membro";
    if (!window.confirm(`Remover ${nome} do Domus? O acesso será revogado.`)) return;
    removeMemberMutation.mutate(m.profile_id);
  };

  const handleDeleteDomus = (item: any) => {
    if (!window.confirm(`Excluir o Domus "${item.nome}"?\nTodos os membros serão desvinculados.`)) return;
    deleteDomusMutation.mutate(item.id);
  };

  const [savedFlash, setSavedFlash] = useState(false);
  const flashSaved = () => {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
  };

  // ─── Escopos para membros reais de outros Domus ──────────────────────────
  const [extScopes, setExtScopes] = useState<
    Record<string, { seeConsolidado: boolean; seePersonae: string[] }>
  >({});

  useEffect(() => {
    if (!adminData?.scopes) return;
    setExtScopes((prev) => {
      const next = { ...prev };
      for (const s of adminData.scopes) {
        next[s.member_profile_id] = {
          seeConsolidado: s.can_see_consolidado ?? false,
          seePersonae: s.can_see_member_profile_ids ?? [],
        };
      }
      return next;
    });
  }, [adminData]);

  const saveExtScopeMutation = useMutation({
    mutationFn: ({
      profileId,
      scope,
    }: {
      profileId: string;
      scope: { seeConsolidado: boolean; seePersonae: string[] };
    }) =>
      saveMemberVisibilityScope({
        data: {
          memberProfileId: profileId,
          canSeeConsolidado: scope.seeConsolidado,
          canSeeMemberProfileIds: scope.seePersonae,
        },
      }),
    onSuccess: () => {
      flashSaved();
      queryClient.invalidateQueries({ queryKey: ["domus-admin"] });
      queryClient.invalidateQueries({ queryKey: ["domus-session"] });
    },
  });

  const toggleExtConsolidado = (profileId: string) => {
    const current = extScopes[profileId] ?? { seeConsolidado: false, seePersonae: [] };
    const next = { ...current, seeConsolidado: !current.seeConsolidado };
    setExtScopes((s) => ({ ...s, [profileId]: next }));
    saveExtScopeMutation.mutate({ profileId, scope: next });
  };

  const toggleExtPersona = (ownerProfileId: string, targetProfileId: string) => {
    const current = extScopes[ownerProfileId] ?? { seeConsolidado: false, seePersonae: [] };
    const has = current.seePersonae.includes(targetProfileId);
    const next = {
      ...current,
      seePersonae: has
        ? current.seePersonae.filter((p) => p !== targetProfileId)
        : [...current.seePersonae, targetProfileId],
    };
    setExtScopes((s) => ({ ...s, [ownerProfileId]: next }));
    saveExtScopeMutation.mutate({ profileId: ownerProfileId, scope: next });
  };

  // UUIDs dos membros hardcoded (cinthia/paulo) — excluídos da seção externa
  const knownUUIDs = new Set(
    (["cinthia", "paulo"] as PersonaId[])
      .map((id) => profileIdForScopeKey?.(id))
      .filter((v): v is string => Boolean(v)),
  );

  // Membros de outros Domus (não cinthia/paulo)
  const externalMembers = (adminData?.members ?? []).filter(
    (m: any) => !knownUUIDs.has(m.profile_id),
  );

  const externalByDomus = externalMembers.reduce(
    (acc: Record<string, any[]>, m: any) => {
      const key = m.domus?.nome ?? "Sem Domus";
      acc[key] = acc[key] ?? [];
      acc[key].push(m);
      return acc;
    },
    {},
  );

  // Todos os membros agrupados por Domus (para a lista de pessoas)
  const membersByDomus = (adminData?.members ?? []).reduce(
    (acc: Record<string, any[]>, m: any) => {
      const key = m.domus?.nome ?? "Sem Domus";
      acc[key] = acc[key] ?? [];
      acc[key].push(m);
      return acc;
    },
    {},
  );
  // ─────────────────────────────────────────────────────────────────────────

  const saveScopeMutation = useMutation({
    mutationFn: ({ id, scope }: { id: PersonaId; scope: Scope }) => {
      const memberProfileId = profileIdForScopeKey?.(id);
      if (!memberProfileId) throw new Error("Não encontrei esse membro no backend.");
      const visibleIds = scope.seePersonae
        .map((personaId) => profileIdForScopeKey?.(personaId))
        .filter((value): value is string => Boolean(value));
      return saveMemberVisibilityScope({
        data: {
          memberProfileId,
          canSeeConsolidado: scope.seeConsolidado,
          canSeeMemberProfileIds: visibleIds,
        },
      });
    },
    onSuccess: () => {
      flashSaved();
      queryClient.invalidateQueries({ queryKey: ["domus-admin"] });
      queryClient.invalidateQueries({ queryKey: ["domus-session"] });
    },
  });

  const toggleConsolidado = (id: PersonaId) => {
    const current = scopes[id] ?? { seeConsolidado: false, seePersonae: [] };
    const nextScope = { ...current, seeConsolidado: !current.seeConsolidado };
    onUpdateScopes({ ...scopes, [id]: nextScope });
    saveScopeMutation.mutate({ id, scope: nextScope });
  };

  const togglePersona = (owner: PersonaId, target: PersonaId) => {
    const current = scopes[owner] ?? { seeConsolidado: false, seePersonae: [] };
    const cur = current.seePersonae;
    const next = cur.includes(target) ? cur.filter((p) => p !== target) : [...cur, target];
    const nextScope = { ...current, seePersonae: next };
    onUpdateScopes({ ...scopes, [owner]: nextScope });
    saveScopeMutation.mutate({ id: owner, scope: nextScope });
  };

  const domusList = adminData?.domus ?? [];
  const vestaNome = adminData?.vesta?.nome ?? "Cínthia";

  return (
    <>
      <div className="ph">
        <h1>🏛 Gestão do Domus</h1>
        <p className="domus-supervisao">
          Todos os Domus · sob supervisão da Vesta {vestaNome}
        </p>
        <p>
          Como Vesta, você é soberana sobre quem vê o quê. Cada membro sempre vê
          a própria carteira; o resto é você quem libera.
        </p>
      </div>

      {/* ── Domus cadastrados ─────────────────────────────────────────────── */}
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
            <div key={item.id} className="domus-pill" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <strong>{item.nome}</strong>
              <span>/{item.slug}</span>
              <button
                onClick={() => handleDeleteDomus(item)}
                disabled={deleteDomusMutation.isPending}
                title="Excluir Domus"
                style={{
                  marginLeft: "auto",
                  background: "transparent",
                  border: "1px solid rgba(161,29,62,.35)",
                  color: "var(--accent)",
                  borderRadius: 5,
                  padding: "2px 8px",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                excluir
              </button>
            </div>
          ))}
        </div>
        <div style={{ padding: "0 16px 16px" }}>
          {!showCreate ? (
            <button type="button" className="domus-ghost-btn" onClick={() => setShowCreate(true)}>
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
                  onChange={(e) =>
                    setNovoSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))
                  }
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

      {/* ── Pessoas por Domus ─────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Pessoas por Domus <span>{adminData?.members?.length ?? 0} membros</span>
        </div>
        <div className="domus-members-list">
          {isLoading && <div className="aitem-det">Carregando pessoas…</div>}
          {!isLoading && (adminData?.members?.length ?? 0) === 0 && (
            <div className="aitem-det">
              Ninguém aprovado ainda. Quando você aprovar um pedido, a pessoa aparece aqui.
            </div>
          )}
          {Object.entries(membersByDomus).map(([domusNome, members]) => (
            <div key={domusNome}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  color: "var(--muted)",
                  padding: "10px 16px 4px",
                  borderTop: "1px solid rgba(255,255,255,.06)",
                }}
              >
                {domusNome}
              </div>
              {(members as any[]).map((m: any) => (
                <div key={m.id} className="domus-member-row">
                  <div className="domus-member-avatar">
                    {(m.profile?.nome ?? m.profile?.email ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="aitem-name">{m.profile?.nome ?? "Sem nome"}</div>
                    <div className="aitem-det">{m.profile?.email}</div>
                  </div>
                  <span className={`sb ${m.papel === "vesta" ? "sb-w" : "sb-g"}`}>
                    {m.papel}
                  </span>
                  {m.papel !== "vesta" && (
                    <button
                      onClick={() => handleRemoveMember(m)}
                      disabled={removeMemberMutation.isPending}
                      title="Remover membro"
                      style={{
                        marginLeft: 8,
                        background: "transparent",
                        border: "1px solid rgba(161,29,62,.35)",
                        color: "var(--accent)",
                        borderRadius: 5,
                        padding: "2px 8px",
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      remover
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Pedidos de entrada ────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Pedidos de entrada{" "}
          <span>
            {adminData?.requests?.filter((r: any) => r.status === "pendente").length ?? 0} pendentes
          </span>
        </div>
        <div className="domus-requests">
          {isLoading && <div className="aitem-det">Carregando pedidos…</div>}
          {adminData?.requests?.length === 0 && (
            <div className="aitem-det">Nenhum pedido ainda.</div>
          )}
          {adminData?.requests?.map((pedido: any) => (
            <div key={pedido.id} className="domus-request">
              <div>
                <div className="aitem-name">{pedido.nome}</div>
                <div className="aitem-det">
                  {pedido.email} · {pedido.domus?.nome ?? "Domus a definir"}
                </div>
                {pedido.mensagem && <p>{pedido.mensagem}</p>}
              </div>
              <span
                className={`sb ${
                  pedido.status === "pendente"
                    ? "sb-w"
                    : pedido.status === "aprovado"
                      ? "sb-g"
                      : "sb-r"
                }`}
              >
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

      {/* ── Escopos: Família Malta Furtado (hardcoded) ────────────────────── */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Escopos · {DOMUS_NAME} <span>{membros.length} personae</span>
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
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--font-display)",
                      fontSize: 16,
                      fontWeight: 600,
                    }}
                  >
                    {p.initial}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: 15,
                        fontWeight: 600,
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>{p.subtitle}</div>
                  </div>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      padding: "3px 10px",
                      borderRadius: 12,
                      background: isVesta
                        ? "rgba(216,179,106,.20)"
                        : "rgba(184,115,74,.12)",
                      color: isVesta ? "#8A6B32" : "var(--accent)",
                    }}
                  >
                    {isVesta ? "Vesta · soberana" : "Membro"}
                  </span>
                </div>

                {isVesta ? (
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--muted)",
                      lineHeight: 1.6,
                      fontStyle: "italic",
                    }}
                  >
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
                          <span>
                            Ver carteira de <strong>{getPersonaInfo(other).name}</strong>
                          </span>
                        </label>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Escopos: outros Domus (membros reais do banco) ────────────────── */}
      {Object.entries(externalByDomus).map(([domusNome, domusMembers]) => (
        <div key={domusNome} className="card" style={{ marginBottom: 14 }}>
          <div className="card-hdr">
            Escopos · {domusNome}{" "}
            <span>{(domusMembers as any[]).length} membros</span>
          </div>
          <div style={{ padding: 16, display: "grid", gap: 14 }}>
            {(domusMembers as any[]).map((m: any) => {
              const isVesta = m.papel === "vesta";
              const extScope = extScopes[m.profile_id] ?? {
                seeConsolidado: false,
                seePersonae: [],
              };
              const otherMembers = (domusMembers as any[]).filter(
                (o: any) => o.profile_id !== m.profile_id,
              );
              const displayName = m.profile?.nome ?? m.profile?.email ?? "Membro";
              const initial = displayName.charAt(0).toUpperCase();

              return (
                <div
                  key={m.id}
                  style={{
                    border: "1px solid var(--border, #E5DFD3)",
                    borderLeft: `4px solid ${isVesta ? "var(--ring, #D8B36A)" : "var(--accent)"}`,
                    borderRadius: 8,
                    padding: 14,
                    background: "var(--card)",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(161,29,62,.15)",
                        fontFamily: "var(--font-display)",
                        fontSize: 16,
                        fontWeight: 600,
                        color: "var(--accent)",
                      }}
                    >
                      {initial}
                    </div>
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 15,
                          fontWeight: 600,
                        }}
                      >
                        {displayName}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>
                        {m.profile?.email} · {domusNome}
                      </div>
                    </div>
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: ".06em",
                        textTransform: "uppercase",
                        padding: "3px 10px",
                        borderRadius: 12,
                        background: isVesta
                          ? "rgba(216,179,106,.20)"
                          : "rgba(184,115,74,.12)",
                        color: isVesta ? "#8A6B32" : "var(--accent)",
                      }}
                    >
                      {isVesta ? "Vesta local" : "Membro"}
                    </span>
                  </div>

                  {isVesta ? (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--muted)",
                        lineHeight: 1.6,
                        fontStyle: "italic",
                      }}
                    >
                      Vesta local — vê automaticamente todas as carteiras do Domus{" "}
                      {domusNome}.
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
                          checked={extScope.seeConsolidado}
                          onChange={() => toggleExtConsolidado(m.profile_id)}
                        />
                        <span>Ver consolidado do Domus {domusNome}</span>
                      </label>

                      {otherMembers.map((other: any) => {
                        const otherName =
                          other.profile?.nome ?? other.profile?.email ?? "Membro";
                        return (
                          <label key={other.id} style={rowStyle}>
                            <input
                              type="checkbox"
                              checked={extScope.seePersonae.includes(other.profile_id)}
                              onChange={() =>
                                toggleExtPersona(m.profile_id, other.profile_id)
                              }
                            />
                            <span>
                              Ver carteira de <strong>{otherName}</strong>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

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
        <strong>{DEFAULT_MEMBER_PASSWORD}</strong>. Repasse essa senha ao novo membro por fora
        — ele troca depois em "esqueci a senha".
      </div>

      {approveMutation.error && (
        <div className="auth-error" style={{ marginTop: 10 }}>
          {(approveMutation.error as Error).message}
        </div>
      )}

      {saveScopeMutation.error && (
        <div className="auth-error" style={{ marginTop: 10 }}>
          {(saveScopeMutation.error as Error).message}
        </div>
      )}

      {saveExtScopeMutation.error && (
        <div className="auth-error" style={{ marginTop: 10 }}>
          {(saveExtScopeMutation.error as Error).message}
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
              <dd>
                <code>{aprovado.senha}</code>
              </dd>
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
