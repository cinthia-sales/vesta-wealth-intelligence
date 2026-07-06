import { PERSONAE, type KnownPersonaId, type PersonaId, DOMUS_NAME } from "@/state/session";

/* ============================================================
   LoginScreen — mock. Escolha de Persona para "entrar" no app.
   Reutiliza o visual do ProfileSelector.
   ============================================================ */
export function LoginScreen({ onLogin }: { onLogin: (id: PersonaId) => void }) {
  const list: KnownPersonaId[] = ["cinthia", "paulo"];
  return (
    <div id="profile-screen">
      <div className="ps-vesta">✦ Vesta ✦</div>
      <div className="ps-title">Entrar no Domus</div>
      <div className="ps-subtitle">{DOMUS_NAME} · escolha sua identidade</div>

      <div className="ps-profiles">
        {list.map((id) => {
          const p = PERSONAE[id];
          const isVesta = p.role === "vesta";
          return (
            <div key={id} className="ps-card" onClick={() => onLogin(id)}>
              <div
                className={"ps-avatar " + (id === "cinthia" ? "ps-av-cinthia" : "ps-av-paulo")}
              >
                {p.initial}
              </div>
              <div>
                <div className="ps-card-name">
                  {p.name.toUpperCase()}
                  <br />
                  {isVesta ? "VESTA" : "PERSONA"}
                </div>
                <div className="ps-card-desc" style={{ margin: "6px 0 10px" }}>
                  {isVesta ? (
                    <>Soberana do Domus<br />vê tudo · gere escopos<br />&nbsp;</>
                  ) : (
                    <>Membro do Domus<br />vê o que a Vesta permitir<br />&nbsp;</>
                  )}
                </div>
                <div
                  className={"ps-card-badge " + (isVesta ? "ps-badge-fam" : "ps-badge-ind")}
                >
                  {isVesta ? <>Acesso total - Vestæ Tantum</> : <>Escopo variável - Membrum</>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="ps-ornament">Fase 4a · sessão mockada · não persiste entre reloads</div>
    </div>
  );
}
