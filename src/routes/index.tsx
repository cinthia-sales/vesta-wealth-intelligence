import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import vestaHero from "@/assets/vesta-hero.png.asset.json";


type PublicDomus = {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
};

const DEFAULT_DOMUS_NAME = "Família Malta Furtado";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vesta Domus — pedir acesso" },
      {
        name: "description",
        content: "Crie e organize um Domus patrimonial; familiares podem pedir permissão de entrada.",
      },
      { property: "og:title", content: "Vesta Domus — pedir acesso" },
      {
        property: "og:description",
        content: "Página pública para solicitar entrada no Domus e acesso privado para a Vesta.",
      },
    ],
  }),
  component: DomusLanding,
});

function DomusLanding() {
  const [domus, setDomus] = useState<PublicDomus[]>([]);
  const [domusId, setDomusId] = useState("");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("domus")
      .select("id,nome,slug,descricao")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        const list = data ?? [];
        setDomus(list);
        if (list[0]) setDomusId(list[0].id);
      });
  }, []);

  const selectedDomus = useMemo(
    () => domus.find((item) => item.id === domusId) ?? domus[0] ?? null,
    [domus, domusId],
  );

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFeedback(null);
    const { error: insertError } = await supabase.from("domus_join_requests").insert({
      domus_id: selectedDomus?.id ?? null,
      nome: nome.trim(),
      email: email.trim(),
      mensagem: mensagem.trim() || null,
    });
    setBusy(false);
    if (insertError) {
      setError("Não consegui enviar agora. Tente de novo em instantes.");
      return;
    }
    setNome("");
    setEmail("");
    setMensagem("");
    setFeedback("Pedido enviado. A Vesta decide e libera o acesso depois.");
  }

  return (
    <main className="public-domus">
      <section className="public-domus-hero">
        <img src={vestaHero.url} alt="" className="public-domus-lineart" />
        <p className="public-domus-kicker">Vesta · Domus et Patrimonium</p>
        <h1>Entrada no Domus</h1>
        <p className="public-domus-copy">
          Peça permissão para participar. A Vesta recebe seu pedido, aprova quando fizer sentido
          e só então libera o acesso privado.
        </p>
        <div className="public-domus-actions">
          <a href="#pedido">Pedir entrada</a>
          <Link to="/auth">Área da Vesta</Link>
        </div>
      </section>

      <section className="public-domus-panel" id="pedido">
        <div>
          <p className="public-domus-kicker">Solicitação</p>
          <h2>Quero fazer parte</h2>
          <p>
            {selectedDomus
              ? `Pedido direcionado ao Domus ${selectedDomus.nome}.`
              : `Pedido direcionado ao Domus ${DEFAULT_DOMUS_NAME}.`}
          </p>
        </div>

        <form className="public-domus-form" onSubmit={handleRequest}>
          {domus.length > 0 && (
            <label>
              Domus
              <select value={domusId} onChange={(e) => setDomusId(e.target.value)}>
                {domus.map((item) => (
                  <option key={item.id} value={item.id}>{item.nome}</option>
                ))}
              </select>
            </label>
          )}
          <label>
            Nome
            <input value={nome} onChange={(e) => setNome(e.target.value)} required />
          </label>
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Mensagem
            <textarea value={mensagem} onChange={(e) => setMensagem(e.target.value)} rows={4} />
          </label>
          {error && <div className="auth-error">{error}</div>}
          {feedback && <div className="public-domus-success">{feedback}</div>}
          <button type="submit" disabled={busy}>{busy ? "Enviando…" : "Enviar pedido"}</button>
        </form>
      </section>
    </main>
  );
}