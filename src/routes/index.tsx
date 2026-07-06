import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import vestaHero from "@/assets/vesta-lineart.png";

type PublicDomus = { id: string; nome: string; slug: string; descricao: string | null };

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vesta · Escolha o Domus" },
      {
        name: "description",
        content:
          "Selecione a família à qual pertence para entrar ou solicitar acesso ao patrimônio.",
      },
      { property: "og:title", content: "Vesta · Escolha o Domus" },
    ],
  }),
  component: DomusPicker,
});

function DomusPicker() {
  const navigate = useNavigate();
  const [domus, setDomus] = useState<PublicDomus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        navigate({ to: "/app" });
        return;
      }
    });
    supabase
      .from("domus")
      .select("id,nome,slug,descricao")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setDomus(data ?? []);
        setLoading(false);
      });
  }, [navigate]);

  return (
    <main className="public-domus">
      <section className="public-domus-hero">
        <img src={vestaHero} alt="" className="public-domus-lineart" />
        <p className="public-domus-kicker">Vesta · Domus et Patrimonium</p>
        <h1>Escolha o seu Domus</h1>
        <p className="public-domus-copy">
          Selecione a família à qual pertence para entrar ou solicitar acesso.
        </p>
      </section>

      <section
        className="public-domus-panel"
        style={{ display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center" }}
      >
        {loading ? (
          <div style={{ color: "var(--muted)", fontSize: 14 }}>Carregando…</div>
        ) : domus.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: 14, textAlign: "center" }}>
            Nenhum Domus encontrado.
            <br />
            <small>A Vesta ainda não criou um Domus.</small>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 20,
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              maxWidth: 680,
              width: "100%",
            }}
          >
            {domus.map((d) => (
              <DomusCard
                key={d.id}
                domus={d}
                onClick={() => navigate({ to: "/domus/$slug", params: { slug: d.slug } })}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function DomusCard({ domus, onClick }: { domus: PublicDomus; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--card)",
        border: `1px solid ${hovered ? "var(--accent)" : "rgba(255,255,255,.12)"}`,
        borderRadius: 12,
        padding: "28px 24px",
        cursor: "pointer",
        textAlign: "left",
        transition: "border-color .2s, transform .15s",
        transform: hovered ? "translateY(-2px)" : "none",
        width: "100%",
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 10 }}>🏛</div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: ".04em",
          color: "var(--fg, #f0ebe8)",
          marginBottom: 6,
          textTransform: "uppercase",
        }}
      >
        {domus.nome}
      </div>
      {domus.descricao && (
        <div
          style={{
            fontSize: 13,
            color: "var(--muted)",
            marginBottom: 14,
            lineHeight: 1.5,
          }}
        >
          {domus.descricao}
        </div>
      )}
      <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600 }}>Entrar →</div>
    </button>
  );
}
