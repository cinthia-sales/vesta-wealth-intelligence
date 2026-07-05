import {
  PERSONAE,
  DOMUS_NAME,
  type PersonaId,
  type Scope,
} from "@/state/session";

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
        💡 <strong>Fase 4a — mock em memória.</strong> Mudanças aqui alteram o que cada
        Persona vê ao entrar, mas não persistem entre reloads da página. Nas próximas fases
        entra persistência local (4b) e depois backend real com auth e RLS (4c).
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
