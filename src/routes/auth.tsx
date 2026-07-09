import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isBootstrapAvailable } from "@/lib/auth.functions";
import {
  ACCESS_AUTH_KEY,
  ACCESS_DEFAULT_PASSWORD,
  getAccessAccount,
  normalizeAccessEmail,
  resetAccessPassword,
  setAccessPassword,
  validateAccessPassword,
} from "@/lib/vesta-access-keys";
import vestaLineart from "@/assets/vesta-lineart.png";

export const Route = createFileRoute("/auth")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : "/app",
  }),
  component: AuthPage,
});

function AuthPage() {
  const search = Route.useSearch();
  const nextTarget = search.next && search.next.startsWith("/") && !search.next.startsWith("//") ? search.next : "/app";
  const [mode, setMode] = useState<"login" | "forgot" | "change">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bootstrapMode, setBootstrapMode] = useState(false);
  const [nome, setNome] = useState("");

  const enterApp = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("Não foi possível confirmar a sessão.");
    window.location.replace(nextTarget);
  };

  useEffect(() => {
    // Uma navegação completa evita o flash da rota protegida durante a troca de sessão.
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) window.location.replace(nextTarget);
    });
    // Checa se ainda cabe bootstrap (nenhuma Vesta cadastrada).
    isBootstrapAvailable().then((r) => {
      if (r.available) setBootstrapMode(true);
    });
  }, [nextTarget]);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
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
      window.location.replace(nextTarget);
      return;
    }
    window.localStorage.removeItem(ACCESS_AUTH_KEY);
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (signInErr) {
      setError(traduzErro(signInErr.message));
      return;
    }
    try {
      await enterApp();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleBootstrap(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      window.localStorage.removeItem(ACCESS_AUTH_KEY);
      const { bootstrapVesta } = await import("@/lib/auth.functions");
      await bootstrapVesta({ data: { email: email.trim(), password, nome: nome.trim() } });
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInErr) throw signInErr;
      setBusy(false);
      await enterApp();
    } catch (err) {
      setBusy(false);
      setError(
        (err as Error).message === "bootstrap_indisponivel"
          ? "Já existe uma Vesta cadastrada."
          : traduzErro((err as Error).message),
      );
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    const normalizedEmail = normalizeAccessEmail(email);
    const accessAccount = getAccessAccount(normalizedEmail);
    if (accessAccount) {
      resetAccessPassword(normalizedEmail);
      setBusy(false);
      setSuccess(`Chave de ${accessAccount.name} redefinida para ${ACCESS_DEFAULT_PASSWORD}.`);
      setMode("login");
      return;
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth`,
    });
    setBusy(false);
    if (resetError) {
      setError(traduzErro(resetError.message));
      return;
    }
    setSuccess("Enviei um link de redefinição para este email.");
    setMode("login");
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (newPassword.length < 8) {
      setError("A nova senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    setBusy(true);
    const normalizedEmail = normalizeAccessEmail(email);
    const accessAccount = getAccessAccount(normalizedEmail);
    if (accessAccount) {
      if (!validateAccessPassword(normalizedEmail, password)) {
        setBusy(false);
        setError("Senha atual incorreta para esta chave de acesso.");
        return;
      }
      setAccessPassword(normalizedEmail, newPassword);
      setPassword("");
      setNewPassword("");
      setBusy(false);
      setSuccess(`Senha de ${accessAccount.name} atualizada neste navegador.`);
      setMode("login");
      return;
    }
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (signInErr) {
      setBusy(false);
      setError(traduzErro(signInErr.message));
      return;
    }
    const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword });
    await supabase.auth.signOut();
    setBusy(false);
    if (updateErr) {
      setError(traduzErro(updateErr.message));
      return;
    }
    setPassword("");
    setNewPassword("");
    setSuccess("Senha atualizada. Entre novamente com a nova senha.");
    setMode("login");
  }

  const formHandler =
    mode === "forgot"
      ? handleForgotPassword
      : mode === "change"
        ? handleChangePassword
        : bootstrapMode
          ? handleBootstrap
          : handleSignIn;

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <img src={vestaLineart} alt="" className="auth-lineart" />
        <div className="auth-vesta">Vesta</div>
        <div className="auth-title">
          {mode === "forgot"
            ? "Recuperar acesso"
            : mode === "change"
              ? "Trocar senha"
              : bootstrapMode
                ? "Fundar o Domus"
                : "Entrar no Vesta"}
        </div>
        <div className="auth-subtitle">
          {mode === "forgot"
            ? "Informe o email para redefinir a senha"
            : mode === "change"
              ? "Use a senha atual para escolher uma nova"
              : bootstrapMode
                ? "Primeira Vesta — defina email e senha"
                : "Identifique-se para acessar seus Domus"}
        </div>

        <form onSubmit={formHandler} className="auth-form">
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
          {mode !== "forgot" && (
            <label>
              {mode === "change" ? "Senha atual" : "Senha"}
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={bootstrapMode ? 8 : 1}
                autoComplete={bootstrapMode ? "new-password" : "current-password"}
              />
            </label>
          )}
          {mode === "change" && (
            <label>
              Nova senha
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </label>
          )}
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}
          <button type="submit" disabled={busy}>
            {busy
              ? "…"
              : mode === "forgot"
                ? "Redefinir"
                : mode === "change"
                  ? "Salvar nova senha"
                  : bootstrapMode
                    ? "Fundar Vesta"
                    : "Entrar"}
          </button>
        </form>

        {!bootstrapMode && (
          <div className="auth-actions">
            {mode !== "login" ? (
              <button type="button" className="auth-linkbtn" onClick={() => { setMode("login"); setError(null); setSuccess(null); }}>
                Voltar ao login
              </button>
            ) : (
              <>
                <button type="button" className="auth-linkbtn" onClick={() => { setMode("forgot"); setError(null); setSuccess(null); }}>
                  Esqueci minha senha
                </button>
                <button type="button" className="auth-linkbtn" onClick={() => { setMode("change"); setError(null); setSuccess(null); }}>
                  Trocar senha
                </button>
              </>
            )}
          </div>
        )}

        {bootstrapMode && (
          <div className="auth-ornament">
            depois você cria o primeiro Domus na área privada
          </div>
        )}
        {!bootstrapMode && (
          <div className="auth-ornament">Login · Domus permitido · Visão permitida</div>
        )}
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
