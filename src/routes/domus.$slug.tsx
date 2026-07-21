import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import vestaLineart from "@/assets/vesta-lineart.png";

type PublicDomus = { id: string; nome: string; slug: string; descricao: string | null };

// Página pública de pedido de entrada num Domus. O login fica só em /auth —
// aqui quem chega já escolheu o Domus e só preenche o pedido.
export const Route = createFileRoute("/domus/$slug")({
  ssr: false,
  component: DomusEntradaPage,
});

function DomusEntradaPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();

  const [domus, setDomus] = useState<PublicDomus | null>(null);

  const [pedidoNome, setPedidoNome] = useState("");
  const [pedidoEmail, setPedidoEmail] = useState("");
  const [pedidoMsg, setPedidoMsg] = useState("");
  const [pedidoFeedback, setPedidoFeedback] = useState<string | null>(null);
  const [pedidoError, setPedidoError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase
      .from("domus")
      .select("id,nome,slug,descricao")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => setDomus(data));
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/app" });
    });
  }, [slug, navigate]);

  async function handlePedido(e: React.FormEvent) {
    e.preventDefault();
    setPedidoError(null);
    setBusy(true);
    const { error: insertError } = await supabase.from("domus_join_requests").insert({
      domus_id: domus?.id ?? null,
      nome: pedidoNome.trim(),
      email: pedidoEmail.trim(),
      mensagem: pedidoMsg.trim() || null,
    });
    setBusy(false);
    if (insertError) {
      setPedidoError("Não consegui enviar agora. Tente de novo.");
      return;
    }
    setPedidoFeedback("Pedido enviado. A Vesta aprova e libera o acesso depois.");
    setPedidoNome("");
    setPedidoEmail("");
    setPedidoMsg("");
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <img src={vestaLineart} alt="" className="auth-lineart" />
        <div className="auth-vesta">Vesta</div>

        <div className="auth-title">Pedir entrada</div>
        <div className="auth-subtitle">{domus?.nome ?? slug}</div>

        {pedidoFeedback ? (
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <div className="public-domus-success">{pedidoFeedback}</div>
            <button
              type="button"
              onClick={() => navigate({ to: "/auth" })}
              style={{
                marginTop: 16,
                background: "none",
                border: "none",
                color: "var(--accent)",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              ← Ir para o login
            </button>
          </div>
        ) : (
          <form onSubmit={handlePedido} className="auth-form">
            <label>
              Nome
              <input
                value={pedidoNome}
                onChange={(e) => setPedidoNome(e.target.value)}
                required
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={pedidoEmail}
                onChange={(e) => setPedidoEmail(e.target.value)}
                required
              />
            </label>
            <label>
              Mensagem (opcional)
              <textarea
                value={pedidoMsg}
                onChange={(e) => setPedidoMsg(e.target.value)}
                rows={3}
              />
            </label>
            {pedidoError && <div className="auth-error">{pedidoError}</div>}
            <button type="submit" disabled={busy}>
              {busy ? "Enviando…" : "Enviar pedido"}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={() => navigate({ to: "/", search: { cadastro: true } })}
          style={{
            marginTop: 14,
            background: "none",
            border: "none",
            color: "var(--muted)",
            fontSize: 12,
            cursor: "pointer",
            opacity: 0.8,
            padding: 0,
          }}
        >
          ← Voltar à escolha de Domus
        </button>
      </div>
    </div>
  );
}
