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
  removeJoinRequest,
  removeMember,
  saveMemberVisibilityScope,
  updateJoinRequestStatus,
} from "@/lib/domus.functions";
import { useState, useEffect } from "react";

const domusLabel = (name: string) => {
  if (/malta[\s-]*furtado/i.test(name)) return "Domus Malta-Furtado";
  return name.replace(/^fam[íi]lia\s+/i, "Domus ");
};

export function DomusPage({
  scopes,
  onUpdateScopes,
  profileIdForScopeKey,
  initialDomusId,
  activeProfileId,
}: {
  scopes: ScopeMap;
  onUpdateScopes: (next: ScopeMap) => void;
  profileIdForScopeKey?: (key: string) => string | null;
  initialDomusId?: string | null;
  activeProfileId?: string | null;
}) {
  const membros: PersonaId[] = ["cinthia", "paulo"];
  const queryClient = useQueryClient();

  const { data: adminData, isLoading } = useQuery({
    queryKey: ["domus-admin"],
    queryFn: () => getDomusAdmin(),
  });

  const [aprovado, setAprovado] = useState<{ email: string; senha: string } | null>(null);
  const [novoDomusNome, setNovoDomusNome] = useState("");
  const [novoDomusSlug, setNovoDomusSlug] = useState("");
  const [novoDomusDescricao, setNovoDomusDescricao] = useState("");

  const slugFromName = (name: string) =>
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60);

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveJoinRequest({ data: { id } }),
    onSuccess: (res) => {
      setAprovado({ email: res.email, senha: res.senha });
      queryClient.invalidateQueries({ queryKey: ["domus-admin"] });
      queryClient.invalidateQueries({ queryKey: ["domus-session"] });
    },
  });

  const recusaMutation = useMutation({
    mutationFn: (id: string) => updateJoinRequestStatus({ data: { id, status: "recusado" } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domus-admin"] });
      queryClient.invalidateQueries({ queryKey: ["domus-session"] });
    },
  });

  const removeRequestMutation = useMutation({
    mutationFn: (id: string) => removeJoinRequest({ data: { id } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["domus-admin"] }),
  });

  const [savedFlash, setSavedFlash] = useState(false);
  const flashSaved = () => {
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
  };

  // ─── Escopos para membros reais de outros Domus ──────────────────────────
  const createMutation = useMutation({
    mutationFn: () =>
      createDomus({
        data: {
          nome: novoDomusNome.trim(),
          slug: (novoDomusSlug.trim() || slugFromName(novoDomusNome)).toLowerCase(),
          descricao: novoDomusDescricao.trim() || null,
        },
      }),
    onSuccess: () => {
      setNovoDomusNome("");
      setNovoDomusSlug("");
      setNovoDomusDescricao("");
      flashSaved();
      queryClient.invalidateQueries({ queryKey: ["domus-admin"] });
      queryClient.invalidateQueries({ queryKey: ["domus-session"] });
    },
  });

  const deleteDomusMutation = useMutation({
    mutationFn: (id: string) => deleteDomus({ data: { id } }),
    onSuccess: () => {
      flashSaved();
      queryClient.invalidateQueries({ queryKey: ["domus-admin"] });
      queryClient.invalidateQueries({ queryKey: ["domus-session"] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ profileId, domusId }: { profileId: string; domusId: string }) =>
      removeMember({ data: { profileId, domusId } }),
    onSuccess: () => {
      flashSaved();
      queryClient.invalidateQueries({ queryKey: ["domus-admin"] });
      queryClient.invalidateQueries({ queryKey: ["domus-session"] });
    },
  });

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
    // Personas de demonstração não existem no banco — escopo fica só local
    if (profileId.startsWith("demo-")) { flashSaved(); return; }
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
    if (ownerProfileId.startsWith("demo-")) { flashSaved(); return; }
    saveExtScopeMutation.mutate({ profileId: ownerProfileId, scope: next });
  };

  // UUIDs dos membros hardcoded (cinthia/paulo) — excluídos da seção externa
  const knownUUIDs = new Set(
    (["cinthia", "paulo"] as PersonaId[])
      .map((id) => profileIdForScopeKey?.(id))
      .filter((v): v is string => Boolean(v)),
  );

  // Domus Exemplum: demonstração fixa no app, gerível pela soberana (dados locais)
  const isDemoDomus = initialDomusId === "demo-exemplum";
  const DEMO_EXEMPLUM_MEMBERS = [
    {
      id: "demo-cornelia-membership",
      domus_id: "demo-exemplum",
      profile_id: "demo-cornelia",
      papel: "vesta",
      created_at: "2026-01-01",
      domus: { nome: "Domus Exemplum" },
      profile: { nome: "Cornelia", email: "cornelia@domus-exemplum.vesta" },
    },
    {
      id: "demo-marcus-membership",
      domus_id: "demo-exemplum",
      profile_id: "demo-marcus",
      papel: "membro",
      created_at: "2026-01-02",
      domus: { nome: "Domus Exemplum" },
      profile: { nome: "Marcus", email: "marcus@domus-exemplum.vesta" },
    },
  ];

  // Membros de outros Domus (não cinthia/paulo)
  const externalMembers = isDemoDomus
    ? DEMO_EXEMPLUM_MEMBERS
    : (adminData?.members ?? []).filter(
        (m: any) => !knownUUIDs.has(m.profile_id),
      );


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

  const domusList = isDemoDomus
    ? [{ id: "demo-exemplum", nome: "Domus Exemplum", slug: "exemplum", descricao: null, created_at: "2026-01-01" }]
    : (adminData?.domus ?? []).filter((domus) => domus.id === initialDomusId);

  // Domus ativo
  const activeDomusId = initialDomusId ?? domusList[0]?.id ?? null;
  const activeDomus = domusList.find((d) => d.id === activeDomusId) ?? domusList[0] ?? null;
  const isFurtadoDomus =
    !activeDomus ||
    activeDomus.nome === DOMUS_NAME ||
    (/malta[\s-]*furtado/i.test(activeDomus.nome ?? "") || /malta[\s-]*furtado/i.test(activeDomus.slug ?? ""));
  const isLocalFurtadoDomus = Boolean(activeDomus && /furtado/i.test(activeDomus.nome ?? "") && !isFurtadoDomus);

  // Membros e pedidos filtrados pelo Domus ativo
  const activeMembers = isDemoDomus
    ? DEMO_EXEMPLUM_MEMBERS
    : (adminData?.members ?? []).filter(
        (m: any) => m.domus_id === activeDomusId || m.domus?.nome === activeDomus?.nome,
      );
  const activeVesta = activeMembers.find((member: any) => {
    if (member.papel !== "vesta") return false;
    if (!isLocalFurtadoDomus) return true;
    const name = `${member.profile?.nome ?? ""} ${member.profile?.email ?? ""}`.toLowerCase();
    return /cristina/.test(name);
  });
  const hasPendingCristinaVesta = Boolean(isLocalFurtadoDomus && !activeVesta);
  const pendingCristinaVesta = hasPendingCristinaVesta
    ? {
        id: `pending-cristina-vesta:${activeDomusId}`,
        domus_id: activeDomusId,
        profile_id: "pending-cristina-vesta",
        papel: "vesta",
        created_at: "",
        domus: { nome: activeDomus?.nome },
        profile: { nome: "Cristina", email: "email pendente" },
        pendingEmail: true,
      }
    : null;
  const vestaNome = isLocalFurtadoDomus
    ? "Cristina"
    : activeVesta?.profile?.nome ?? activeVesta?.profile?.email ?? (hasPendingCristinaVesta ? "Cristina" : adminData?.vesta?.nome) ?? "Vesta";
  const isSovereignVesta =
    (adminData?.vesta?.email ?? "").toLowerCase() === "cinthiavr@yahoo.com.br" &&
    activeProfileId === "cinthia";

  const allRequests: any[] = adminData?.requests ?? [];
  const domusRequests = allRequests.filter((r: any) => {
    const reqNome: string | undefined = r.domus?.nome;
    const reqId: string | undefined = r.domus_id;
    if (!reqNome && !reqId) return isFurtadoDomus;
    return reqNome === activeDomus?.nome || reqId === activeDomusId;
  });
  // Deduplica por email: aprovado > pendente > recusado; desempata pelo mais recente
  const deduplicatedRequests = domusRequests.reduce((acc: any[], r: any) => {
    const idx = acc.findIndex(
      (x) => (x.email ?? "").toLowerCase() === (r.email ?? "").toLowerCase(),
    );
    if (idx === -1) {
      acc.push(r);
    } else {
      const prio = (s: string) => (s === "aprovado" ? 2 : s === "pendente" ? 1 : 0);
      if (prio(r.status) > prio(acc[idx].status)) acc[idx] = r;
    }
    return acc;
  }, []);
  const pendingRequests = deduplicatedRequests.filter((request: any) => request.status === "pendente");

  const activeExternalMembers = [
    ...(pendingCristinaVesta ? [pendingCristinaVesta] : []),
    ...externalMembers.filter(
      (m: any) => m.domus_id === activeDomusId || m.domus?.nome === activeDomus?.nome,
    ),
    // Vestas sempre acima dos membros comuns
  ].sort((a: any, b: any) => (b.papel === "vesta" ? 1 : 0) - (a.papel === "vesta" ? 1 : 0));

  return (
    <>
      <div className="ph">
        <h1>🏛 Gestão do Domus</h1>
        <p className="domus-supervisao">
          {activeDomus ? domusLabel(activeDomus.nome) : "Todos os Domus"} · sob supervisão da Vesta {vestaNome}
        </p>
        <p>
          Como Vesta, você é soberana sobre quem vê o quê. Cada membro sempre vê
          a própria carteira; o resto é você quem libera.
        </p>
      </div>

      {/* ── Pedidos de entrada ────────────────────────────────────────────── */}
      {isSovereignVesta && <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Criar Domus <span>novo núcleo familiar</span>
        </div>
        <form
          className="domus-admin-form"
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
        >
          <label>
            Nome do Domus
            <input
              value={novoDomusNome}
              onChange={(event) => {
                const value = event.target.value;
                setNovoDomusNome(value);
                if (!novoDomusSlug) setNovoDomusSlug(slugFromName(value));
              }}
              placeholder="Domus Abrantes"
              required
            />
          </label>
          <label>
            Slug público
            <input
              value={novoDomusSlug}
              onChange={(event) => setNovoDomusSlug(slugFromName(event.target.value))}
              placeholder="domus-abrantes"
              required
            />
          </label>
          <button type="submit" disabled={createMutation.isPending || !novoDomusNome.trim()}>
            {createMutation.isPending ? "criando..." : "criar"}
          </button>
          <label className="wide">
            Descrição pública (opcional)
            <textarea
              value={novoDomusDescricao}
              onChange={(event) => setNovoDomusDescricao(event.target.value)}
              rows={2}
              placeholder="Texto curto para a página de entrada deste Domus"
            />
          </label>
          {createMutation.error && (
            <div className="auth-error wide">{(createMutation.error as Error).message}</div>
          )}
        </form>
      </div>}

      {isSovereignVesta && activeDomus && !isDemoDomus && (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="card-hdr">
            Excluir Domus <span>acao irreversivel</span>
          </div>
          <div style={{ padding: 16, display: "grid", gap: 10 }}>
            <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
              Remove o Domus <strong>{domusLabel(activeDomus.nome)}</strong> do cadastro.
            </div>
            <button
              type="button"
              disabled={deleteDomusMutation.isPending}
              onClick={() => {
                const ok = window.confirm(`Excluir ${domusLabel(activeDomus.nome)} inteiro? Esta acao nao pode ser desfeita.`);
                if (ok) deleteDomusMutation.mutate(activeDomus.id);
              }}
              style={{
                justifySelf: "start",
                background: "transparent",
                border: "1px solid rgba(161,29,62,.35)",
                color: "var(--accent)",
                borderRadius: 6,
                padding: "7px 12px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {deleteDomusMutation.isPending ? "excluindo..." : "excluir este Domus"}
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Pedidos de entrada{" "}
          <span>
            {pendingRequests.length} pendentes
          </span>
        </div>
        <div className="domus-requests">
          {isLoading && <div className="aitem-det">Carregando pedidos…</div>}
          {!isLoading && pendingRequests.length === 0 && (
            <div className="aitem-det">Nenhum pedido para este Domus.</div>
          )}
          {pendingRequests.map((pedido: any) => (
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
              {pedido.status === "pendente" ? (
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
              ) : (
                <button
                  onClick={() => removeRequestMutation.mutate(pedido.id)}
                  disabled={removeRequestMutation.isPending}
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,.15)",
                    color: "var(--muted)",
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
      </div>

      {/* ── Escopos: Família Malta Furtado (hardcoded) — só quando Furtado ativo ── */}
      {isFurtadoDomus && <div className="card" style={{ marginBottom: 14 }}>
        <div className="card-hdr">
          Escopos · Domus Malta-Furtado <span>{membros.length + activeExternalMembers.length} pessoas</span>
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
      </div>}

      {/* ── Escopos: Domus externo ativo (membros reais do banco) ─────────── */}
      {activeExternalMembers.length > 0 && [(activeDomus ? domusLabel(activeDomus.nome) : "Sem Domus")].map((domusNome) => (
        <div key={domusNome} className={`card${isFurtadoDomus ? " scope-continuation" : ""}`} style={{ marginBottom: 14 }}>
          {!isFurtadoDomus && <div className="card-hdr">
            Escopos · {domusNome}{" "}
            <span>{activeExternalMembers.length} pessoas</span>
          </div>}
          <div style={{ padding: 16, display: "grid", gap: 14 }}>
            {activeExternalMembers.map((m: any) => {
              const memberNameKey = `${m.profile?.nome ?? ""} ${m.profile?.email ?? ""}`.toLowerCase();
              const isVesta = m.papel === "vesta" && (!isLocalFurtadoDomus || /cristina/.test(memberNameKey));
              const extScope = extScopes[m.profile_id] ?? {
                seeConsolidado: false,
                seePersonae: [],
              };
              const otherMembers = activeExternalMembers.filter(
                (o: any) => o.profile_id !== m.profile_id,
              );
              const displayName = m.profile?.nome ?? m.profile?.email ?? "Membro";
              const initial = displayName.charAt(0).toUpperCase();
              const canRemoveMember =
                Boolean(activeDomusId) &&
                !m.pendingEmail &&
                /^[0-9a-f-]{36}$/i.test(m.profile_id);

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
                    {canRemoveMember && (
                      <button
                        type="button"
                        disabled={removeMemberMutation.isPending}
                        onClick={() => {
                          const ok = window.confirm(`Remover ${displayName} do ${domusNome}?`);
                          if (ok && activeDomusId) {
                            removeMemberMutation.mutate({ profileId: m.profile_id, domusId: activeDomusId });
                          }
                        }}
                        style={{
                          border: "1px solid rgba(161,29,62,.25)",
                          background: "transparent",
                          color: "var(--accent)",
                          borderRadius: 6,
                          padding: "4px 8px",
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        remover
                      </button>
                    )}
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
                      {m.pendingEmail
                        ? `Vesta local - pendente acrescentar email antes do acesso definitivo ao ${domusNome}.`
                        : `Vesta local - ve automaticamente todas as carteiras do ${domusNome}.`}
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
                        <span>Ver consolidado do {domusNome}</span>
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
