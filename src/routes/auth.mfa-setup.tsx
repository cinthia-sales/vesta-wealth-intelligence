import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import vestaLineart from "@/assets/vesta-lineart.png";

export const Route = createFileRoute("/auth/mfa-setup")({
  ssr: false,
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
        <img src={vestaLineart} alt="" className="auth-lineart" />
        <div className="auth-vesta">Vesta</div>
        <div className="auth-title">Vincular o celular</div>
        <div className="auth-subtitle">
          Isso troca a senha por um código que muda a cada 30 segundos — só quem tem o seu celular consegue entrar.
        </div>

        <ol className="auth-steps">
          <li>Baixe o <b>Google Authenticator</b> (ou Microsoft Authenticator / Authy) no celular.</li>
          <li>Abra o app, toque em <b>+</b> e escolha <b>Ler QR code</b>.</li>
          <li>Aponte a câmera pro QR abaixo.</li>
          <li>Digite aqui o código de 6 dígitos que aparecer no app.</li>
        </ol>

        {qr ? (
          <div className="auth-qr">
            <img src={qr} alt="QR code" width={220} height={220} />
            {secret && (
              <details>
                <summary>não consigo escanear — digitar código manual</summary>
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
