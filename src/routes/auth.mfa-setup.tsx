import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/mfa-setup")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : "/",
  }),
  component: MfaSetup,
});

function MfaSetup() {
  const navigate = useNavigate();
  const { next } = Route.useSearch();
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
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
      // Limpa fatores TOTP não verificados (retentativa).
      const { data: existing } = await supabase.auth.mfa.listFactors();
      for (const f of existing?.totp ?? []) {
        if (f.status !== "verified") {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }
      const verified = existing?.totp?.find((f) => f.status === "verified");
      if (verified) {
        // Já configurado — vai pra verify.
        navigate({ to: "/auth/mfa-verify", search: { next } });
        return;
      }
      const { data, error: err } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Vesta",
      });
      if (err || !data) {
        setError(err?.message ?? "Falha ao gerar QR");
        return;
      }
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
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
        <div className="auth-title">Configurar autenticador</div>
        <div className="auth-subtitle">
          Escaneie com Google Authenticator, Authy ou 1Password
        </div>

        {qr ? (
          <div className="auth-qr">
            <img src={qr} alt="QR code" width={220} height={220} />
            {secret && (
              <details>
                <summary>não consigo escanear</summary>
                <code>{secret}</code>
              </details>
            )}
          </div>
        ) : (
          <div className="auth-subtitle">Gerando QR…</div>
        )}

        <form onSubmit={handleVerify} className="auth-form">
          <label>
            Código de 6 dígitos
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
            {busy ? "…" : "Confirmar"}
          </button>
        </form>

        <div className="auth-ornament">
          esse app vai pedir o código todo login
        </div>
      </div>
    </div>
  );
}
