import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import vestaHero from "@/assets/vesta-lineart.png";

type DomusPublic = {
  id: string;
  nome: string;
  slug: string;
  vesta_nome: string | null;
};

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>) => ({
    cadastro: s.cadastro === "1" || s.cadastro === "true",
  }),
  beforeLoad: async ({ search }) => {
    if (!search.cadastro) throw redirect({ to: "/auth" });
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/app" });
  },
  head: () => ({
    meta: [
      { title: "Vesta - Entrar" },
      { name: "description", content: "Entre no Vesta ou solicite acesso ao seu Domus." },
    ],
  }),
  component: PublicEntry,
});

function PublicEntry() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [domusList, setDomusList] = useState<DomusPublic[]>([]);
  const [selected, setSelected] = useState<DomusPublic | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requestMode, setRequestMode] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/app" });
    });

    supabase
      .from("domus")
      .select("id,nome,slug")
      .order("created_at", { ascending: true })
      .then(async ({ data: domusData }) => {
        if (!domusData) {
          setLoading(false);
          return;
        }

        const enriched: DomusPublic[] = await Promise.all(
          domusData.map(async (d) => {
            const { data: vestaRow } = await supabase
              .from("domus_members")
              .select("profile:profile_id(nome,email)")
              .eq("domus_id", d.id)
              .eq("papel", "vesta")
              .limit(1)
              .maybeSingle();

            const profile = vestaRow?.profile as any;
            return { ...d, vesta_nome: profile?.nome ?? profile?.email ?? null };
          }),
        );

        setDomusList(enriched);
        setLoading(false);
      });
  }, [navigate]);

  function nomeDomus(d: DomusPublic) {
    return d.nome.replace(/^familia\s+/i, "Domus ");
  }

  function vestaLabel(d: DomusPublic) {
    const nome = d.vesta_nome ?? (d.slug?.includes("malta") || d.slug?.includes("furtado") ? "Cinthia" : null);
    if (!nome) return "Sob supervisao da Vesta";
    return `Sob supervisao da Vesta ${nome.split(" ")[0]}`;
  }

  function handleSelect(d: DomusPublic) {
    setSelected(d);
    setOpen(false);
  }

  function handlePedido() {
    if (selected) navigate({ to: "/domus/$slug", params: { slug: selected.slug } });
  }

  return (
    <main className="public-domus">
      <section className="public-domus-hero">
        <img src={vestaHero} alt="" className="public-domus-lineart" />
        <p className="public-domus-kicker">Vesta - Domus et Patrimonium</p>
        <h1>{requestMode ? "Escolha o seu Domus" : "Entre no Vesta"}</h1>
        <p className="public-domus-copy">
          {requestMode
            ? "Selecione o Domus ao qual pertence para solicitar acesso."
            : "Acesse sua carteira familiar ou peca entrada no Domus correto."}
        </p>
      </section>

      <section className="public-domus-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {!requestMode ? (
          <div style={{ width: "100%", maxWidth: 420, display: "grid", gap: 12 }}>
            <button
              onClick={() => navigate({ to: "/auth" })}
              style={primaryButtonStyle}
            >
              Fazer login
            </button>
            <button
              onClick={() => setRequestMode(true)}
              style={secondaryButtonStyle}
            >
              Nao tenho login
            </button>
            <button
              onClick={() => navigate({ to: "/auth", search: { mode: "forgot" } as any })}
              style={linkButtonStyle}
            >
              Esqueci minha senha
            </button>
          </div>
        ) : loading ? (
          <div style={{ color: "var(--muted)", fontSize: 14 }}>Carregando...</div>
        ) : domusList.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: 14, textAlign: "center" }}>
            Nenhum Domus encontrado.
          </div>
        ) : (
          <>
            <div style={{ width: "100%", maxWidth: 460 }}>
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setOpen((o) => !o)}
                  style={{
                    width: "100%",
                    padding: "16px 20px",
                    background: "white",
                    border: "1.5px solid " + (open ? "var(--accent)" : "rgba(161,29,62,.2)"),
                    borderRadius: selected && !open ? "12px 12px 0 0" : 12,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 15,
                    fontWeight: 600,
                    color: selected ? "#2A0F14" : "var(--muted)",
                    fontFamily: "var(--font-display)",
                    letterSpacing: ".04em",
                  }}
                >
                  <span>{selected ? nomeDomus(selected) : "Selecione o Domus..."}</span>
                  <span style={{ fontSize: 12, color: "var(--accent)" }}>v</span>
                </button>

                {open && (
                  <div style={dropdownStyle}>
                    {domusList.map((d) => (
                      <div
                        key={d.id}
                        onClick={() => handleSelect(d)}
                        style={dropdownItemStyle}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#FFF9FA")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                      >
                        <div style={{ fontWeight: 600 }}>{nomeDomus(d)}</div>
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{vestaLabel(d)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selected && !open && (
                <div style={selectedCardStyle}>
                  <div style={selectedKickerStyle}>{vestaLabel(selected)}</div>
                  <div style={selectedTitleStyle}>{nomeDomus(selected)}</div>
                  <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24, lineHeight: 1.5 }}>
                    Este Domus esta sob supervisao da Vesta. Ela aprova o acesso e define as visoes permitidas.
                  </div>
                  <button onClick={handlePedido} style={primaryButtonStyle}>
                    Pedir entrada neste Domus
                  </button>
                </div>
              )}
            </div>
            <button type="button" onClick={() => navigate({ to: "/auth" })} style={{ ...linkButtonStyle, marginTop: 18 }}>
              Voltar ao login
            </button>
          </>
        )}
      </section>
    </main>
  );
}

const primaryButtonStyle: CSSProperties = {
  background: "var(--accent)",
  color: "white",
  border: "none",
  borderRadius: 8,
  padding: "13px 28px",
  fontSize: 13,
  fontFamily: "var(--font-display)",
  letterSpacing: ".1em",
  cursor: "pointer",
  fontWeight: 700,
  textTransform: "uppercase",
};

const secondaryButtonStyle: CSSProperties = {
  background: "white",
  color: "var(--accent)",
  border: "1.5px solid rgba(161,29,62,.25)",
  borderRadius: 8,
  padding: "12px 28px",
  fontSize: 13,
  fontFamily: "var(--font-display)",
  letterSpacing: ".08em",
  cursor: "pointer",
  fontWeight: 700,
  textTransform: "uppercase",
};

const linkButtonStyle: CSSProperties = {
  background: "transparent",
  border: "none",
  color: "var(--muted)",
  fontSize: 13,
  cursor: "pointer",
  textDecoration: "underline",
};

const dropdownStyle: CSSProperties = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  background: "white",
  border: "1.5px solid var(--accent)",
  borderTop: "none",
  borderRadius: "0 0 12px 12px",
  zIndex: 100,
  overflow: "hidden",
};

const dropdownItemStyle: CSSProperties = {
  padding: "14px 20px",
  cursor: "pointer",
  borderTop: "1px solid rgba(161,29,62,.08)",
  fontSize: 14,
  fontFamily: "var(--font-display)",
  letterSpacing: ".03em",
  color: "#2A0F14",
};

const selectedCardStyle: CSSProperties = {
  background: "white",
  border: "1.5px solid var(--accent)",
  borderTop: "none",
  borderRadius: "0 0 12px 12px",
  padding: "28px 28px 24px",
  textAlign: "center",
};

const selectedKickerStyle: CSSProperties = {
  fontSize: 10,
  letterSpacing: ".22em",
  color: "var(--muted)",
  fontFamily: "var(--font-display)",
  marginBottom: 8,
  textTransform: "uppercase",
};

const selectedTitleStyle: CSSProperties = {
  fontFamily: "var(--font-elegant)",
  fontSize: 28,
  color: "#2A0F14",
  marginBottom: 6,
  fontWeight: 400,
};
