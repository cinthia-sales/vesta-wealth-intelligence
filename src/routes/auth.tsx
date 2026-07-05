import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isBootstrapAvailable } from "@/lib/auth.functions";
import vestaLineart from "@/assets/vesta-lineart.png";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : "/app",
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bootstrapMode, setBootstrapMode] = useState(false);
  const [nome, setNome] = useState("");

  useEffect(() => {
    // Se já está logado, tenta ir pro destino.
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: next as "/app" });
    });
    // Checa se ainda cabe bootstrap (nenhuma Vesta cadastrada).
    isBootstrapAvailable().then((r) => {
      if (r.available) setBootstrapMode(true);
    });
  }, [navigate, next]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (signInErr) {
      setError(traduzErro(signInErr.message));
      return;
    }
    navigate({ to: next as "/app" });
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
      setBusy(false);
      navigate({ to: next as "/app" });
    } catch (err) {
      setBusy(false);
      setError(
        (err as Error).message === "bootstrap_indisponivel"
          ? "Já existe uma Vesta cadastrada."
          : traduzErro((err as Error).message),
      );
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <img src={vestaLineart} alt="" className="auth-lineart" />
        <div className="auth-vesta">Vesta</div>
        <div className="auth-title">
          {bootstrapMode ? "Fundar o Domus" : "Entrar no Domus"}
        </div>
        <div className="auth-subtitle">
          {bootstrapMode
            ? "Primeira Vesta — defina email e senha"
            : "Email e senha da área privada"}
        </div>

        <form onSubmit={bootstrapMode ? handleBootstrap : handleSignIn} className="auth-form">
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
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
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

        <div className="auth-ornament">
          {bootstrapMode
            ? "depois você cria o primeiro Domus na área privada"
            : "sem autenticador por enquanto — a entrada fica simples"}
        </div>
      </div>
    </div>
  );
}

function traduzErro(msg: string): string {
  if (/invalid login/i.test(msg)) return "Email ou senha inválidos.";
  if (/email not confirmed/i.test(msg)) return "Confirme seu email primeiro.";
  if (/pwned|compromised|leaked/i.test(msg))
    return "Essa senha foi vazada em outro serviço. Escolha outra.";
  if (/signup.*disabled|signups.*disabled/i.test(msg))
    return "Cadastro fechado. Peça convite à Vesta.";
  return msg;
}
