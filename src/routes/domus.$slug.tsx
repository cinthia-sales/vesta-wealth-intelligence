import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isBootstrapAvailable } from "@/lib/auth.functions";
import {
  ACCESS_AUTH_KEY,
  ACCESS_DEFAULT_PASSWORD,
  getAccessAccount,
  normalizeAccessEmail,
  validateAccessPassword,
} from "@/lib/vesta-access-keys";
import vestaLineart from "@/assets/vesta-lineart.png";

type PublicDomus = { id: string; nome: string; slug: string; descricao: string | null };

export const Route = createFileRoute("/domus/$slug")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    pedido: s.pedido === "1" || s.pedido === "true" || s.pedido === true,
  }),
  component: DomusEntradaPage,
});

function DomusEntradaPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const [domus, setDomus] = useState<PublicDomus | null>(null);
  const [mode, setMode] = useState<"login" | "pedido">(search.pedido ? "pedido" : "login");
  const [bootstrapMode, setBootstrapMode] = useState(false);

  // login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // pedido
  const [pedidoNome, setPedidoNome] = useState("");
  const [pedidoEmail, setPedidoEmail] = useState("");
  const [pedidoMsg, setPedidoMsg] = useState("");
  const [pedidoFeedback, setPedidoFeedback] = useState<string | null>(null);
  const [pedidoError, setPedidoError] = useState<string | null>(null);

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
    isBootstrapAvailable().then((r) => {
      if (r.available) setBootstrapMode(true);
    });
  }, [slug, navigate]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const normalizedEmail = normalizeAccessEmail(email);
    const accessAccount = getAccessAccount(normalizedEmail);
    if (accessAccount) {
      if (!validateAccessPassword(normalizedEmail, password)) {
        setBusy(false);
        setError(`Senha incorreta. A senha inicial desses acessos é ${ACCESS_DEFAULT_PASSWORD}.`);
        return;
      }
      await supabase.auth.signOut();
      window.localStorage.setItem(ACCESS_AUTH_KEY, normalizedEmail);
      setBusy(false);
      navigate({ to: "/app" });
      return;
    }
    window.localStorage.removeItem(ACCESS_AUTH_KEY);
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInErr) {
      setBusy(false);
      setError(traduzErro(signInErr.message));
      return;
    }

    // A área privada resolve os Domus e as visões permitidas após o login.
    navigate({ to: "/app" });
  }

  async function handleBootstrap(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { bootstrapVesta } = await import("@/lib/auth.functions");
      await bootstrapVesta({ data: { email: email.trim(), password, nome: nome.trim() } });
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInErr) throw signInErr;
      navigate({ to: "/app" });
    } catch (err) {
      setBusy(false);
      setError(
        (err as Error).message === "bootstrap_indisponivel"
          ? "Já existe uma Vesta cadastrada."
          : traduzErro((err as Error).message),
      );
    }
  }

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

        {mode === "login" ? (
          <>
            <div className="auth-title">
              {bootstrapMode ? "Fundar o Domus" : (domus?.nome ?? "Entrar no Domus")}
            </div>
            <div className="auth-subtitle">
              {bootstrapMode
                ? "Primeira Vesta — defina email e senha"
                : "Email e senha da área privada"}
            </div>

            <form
              onSubmit={bootstrapMode ? handleBootstrap : handleSignIn}
              className="auth-form"
            >
              {bootstrapMode && (
                <label>
                  Nome
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </label>
              )}
              <label>
                Email ou usuário
                <input
                  type={bootstrapMode ? "email" : "text"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete={bootstrapMode ? "email" : "username"}
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={bootstrapMode ? "new-password" : "current-password"}
                />
              </label>
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" disabled={busy}>
                {busy ? "…" : bootstrapMode ? "Fundar Vesta" : "Entrar"}
              </button>
            </form>

            {!bootstrapMode && (
              <button
                type="button"
                onClick={() => setMode("pedido")}
                style={{
                  marginTop: 14,
                  background: "none",
                  border: "none",
                  color: "var(--muted)",
                  fontSize: 13,
                  cursor: "pointer",
                  textDecoration: "underline",
                  padding: 0,
                }}
              >
                Não tenho acesso — pedir entrada
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate({ to: "/" })}
              style={{
                marginTop: 10,
                background: "none",
                border: "none",
                color: "var(--muted)",
                fontSize: 12,
                cursor: "pointer",
                opacity: 0.7,
                padding: 0,
              }}
            >
              ← Voltar à escolha de Domus
            </button>
          </>
        ) : (
          <>
            <div className="auth-title">Pedir entrada</div>
            <div className="auth-subtitle">{domus?.nome ?? slug}</div>

            {pedidoFeedback ? (
              <div style={{ marginTop: 20, textAlign: "center" }}>
                <div className="public-domus-success">{pedidoFeedback}</div>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  style={{
                    marginTop: 16,
                    background: "none",
                    border: "none",
                    color: "var(--accent)",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  ← Voltar ao login
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
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  style={{
                    fontSize: 12,
                    background: "none",
                    border: "none",
                    color: "var(--muted)",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  ← Voltar ao login
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function traduzErro(msg: string): string {
  if (/invalid login/i.test(msg)) return "Email ou senha inválidos.";
  if (/email not confirmed/i.test(msg)) return "Confirme seu email primeiro.";
  if (/pwned|compromised|leaked/i.test(msg)) return "Essa senha foi vazada. Escolha outra.";
  if (/signup.*disabled|signups.*disabled/i.test(msg))
    return "Cadastro fechado. Peça convite à Vesta.";
  return msg;
}
