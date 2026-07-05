import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import vestaLineart from "@/assets/vesta-lineart.png";

export const Route = createFileRoute("/auth/mfa-verify")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : "/",
  }),
  component: MfaVerify,
});

function MfaVerify() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        navigate({ to: "/auth" });
        return;
      }
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = data?.totp?.find((f) => f.status === "verified");
      if (!totp) {
        navigate({ to: "/auth/mfa-setup", search: { next } });
        return;
      }
      setFactorId(totp.id);
    })();
  }, [navigate, next]);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setBusy(true);
    const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge(
      { factorId },
    );
    if (cErr || !challenge) {
      setBusy(false);
      setError(cErr?.message ?? "Falha no desafio");
      return;
    }
    const { error: vErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: code.trim(),
    });
    setBusy(false);
    if (vErr) {
      setError("Código inválido. Tente novamente.");
      return;
    }
    navigate({ to: next as "/" });
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-vesta">✦ Vesta ✦</div>
        <div className="auth-title">Código do autenticador</div>
        <div className="auth-subtitle">
          Abra o app e digite os 6 dígitos
        </div>

        <form onSubmit={handleVerify} className="auth-form">
          <label>
            Código
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
              autoComplete="one-time-code"
              autoFocus
            />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" disabled={busy || !factorId}>
            {busy ? "…" : "Entrar"}
          </button>
        </form>

        <button
          type="button"
          className="auth-linkbtn"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/auth" });
          }}
        >
          voltar ao login
        </button>
      </div>
    </div>
  );
}
