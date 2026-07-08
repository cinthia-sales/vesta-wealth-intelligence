import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
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
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/app" });
    throw redirect({ to: "/auth", search: { next: "/app" } });
  },
  head: () => ({
    meta: [
      { title: "Vesta · Escolha o Domus" },
      { name: "description", content: "Selecione a família à qual pertence para entrar ou solicitar acesso ao patrimônio." },
    ],
  }),
  component: DomusPicker,
});

function DomusPicker() {
  const navigate = useNavigate();
  const [domusList, setDomusList] = useState<DomusPublic[]>([]);
  const [selected, setSelected] = useState<DomusPublic | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/app" });
    });

    // Busca Domus + nome da Vesta de cada um
    supabase
      .from("domus")
      .select("id,nome,slug")
      .order("created_at", { ascending: true })
      .then(async ({ data: domusData }) => {
        if (!domusData) { setLoading(false); return; }

        const enriched: DomusPublic[] = await Promise.all(
          domusData.map(async (d) => {
            // Tenta buscar o membro com papel 'vesta' nesse domus
            const { data: vestaRow } = await supabase
              .from("domus_members")
              .select("profile:profile_id(nome,email)")
              .eq("domus_id", d.id)
              .eq("papel", "vesta")
              .limit(1)
              .maybeSingle();

            const profile = vestaRow?.profile as any;
            const vesta_nome = profile?.nome ?? profile?.email ?? null;
            return { ...d, vesta_nome };
          }),
        );

        setDomusList(enriched);
        setLoading(false);
      });
  }, [navigate]);

  function nomeDomus(d: DomusPublic) {
    return d.nome.replace(/^famíl[íi]a\s+/i, "Domus ").replace(/^família\s+/i, "Domus ");
  }

  function vestaLabel(d: DomusPublic) {
    const nome = d.vesta_nome ?? (d.slug?.includes("malta") || d.slug?.includes("furtado") ? "Cínthia" : null);
    if (!nome) return "Sob supervisão da Vesta";
    return `Sob supervisão da Vesta ${nome.split(" ")[0]}`;
  }

  function handleSelect(d: DomusPublic) {
    setSelected(d);
    setOpen(false);
  }

  function handleEntrar() {
    if (selected) navigate({ to: "/domus/$slug", params: { slug: selected.slug } });
  }

  return (
    <main className="public-domus">
      <section className="public-domus-hero">
        <img src={vestaHero} alt="" className="public-domus-lineart" />
        <p className="public-domus-kicker">Vesta · Domus et Patrimonium</p>
        <h1>Escolha o seu Domus</h1>
        <p className="public-domus-copy">
          Selecione o Domus ao qual pertence para entrar ou solicitar acesso.
        </p>
      </section>

      <section className="public-domus-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {loading ? (
          <div style={{ color: "var(--muted)", fontSize: 14 }}>Carregando…</div>
        ) : domusList.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: 14, textAlign: "center" }}>
            Nenhum Domus encontrado.
          </div>
        ) : (
          <div style={{ width: "100%", maxWidth: 460 }}>
            {/* Dropdown */}
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
                  transition: "border-color .2s",
                }}
              >
                <span>{selected ? nomeDomus(selected) : "Selecione o Domus…"}</span>
                <span style={{
                  fontSize: 12,
                  transition: "transform .2s",
                  transform: open ? "rotate(180deg)" : "none",
                  color: "var(--accent)",
                }}>▼</span>
              </button>

              {open && (
                <div style={{
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
                }}>
                  {domusList.map((d) => (
                    <div
                      key={d.id}
                      onClick={() => handleSelect(d)}
                      style={{
                        padding: "14px 20px",
                        cursor: "pointer",
                        borderTop: "1px solid rgba(161,29,62,.08)",
                        fontSize: 14,
                        fontFamily: "var(--font-display)",
                        letterSpacing: ".03em",
                        color: "#2A0F14",
                        transition: "background .15s",
                      }}
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

            {/* Card expandido quando selecionado */}
            {selected && !open && (
              <div style={{
                background: "white",
                border: "1.5px solid var(--accent)",
                borderTop: "none",
                borderRadius: "0 0 12px 12px",
                padding: "28px 28px 24px",
                textAlign: "center",
                animation: "fadeIn .2s ease",
              }}>
                <div style={{
                  fontSize: 10,
                  letterSpacing: ".22em",
                  color: "var(--muted)",
                  fontFamily: "var(--font-display)",
                  marginBottom: 8,
                  textTransform: "uppercase",
                }}>
                  {vestaLabel(selected)}
                </div>
                <div style={{
                  fontFamily: "var(--font-elegant)",
                  fontSize: 28,
                  color: "#2A0F14",
                  marginBottom: 6,
                  fontWeight: 400,
                }}>
                  {nomeDomus(selected)}
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 24, lineHeight: 1.5 }}>
                  {vestaLabel(selected).replace("Sob supervisão da", "Este Domus está sob supervisão da")} —
                  quem decide sobre o acesso e a gestão patrimonial.
                </div>
                <button
                  onClick={handleEntrar}
                  style={{
                    background: "var(--accent)",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    padding: "12px 32px",
                    fontSize: 13,
                    fontFamily: "var(--font-display)",
                    letterSpacing: ".1em",
                    cursor: "pointer",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    transition: "opacity .15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = ".85")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                >
                  Entrar neste Domus →
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
