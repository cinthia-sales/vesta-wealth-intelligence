## Objetivo

Trocar o "login" mock por autenticação real, com MFA obrigatório via app autenticador (Google Authenticator — o QR code é padrão, então Authy/1Password também funcionam se ela preferir), cadastro fechado, e mover os dados fixos do código para o banco protegido por RLS.

## Fase 1 — Estrutura de autenticação

1. **Backend (Lovable Cloud)**
   - Signup público desligado.
   - Ativar Google sign-in fica de fora (Paulo não tem Google).
   - Habilitar proteção contra senhas vazadas (HIBP).
2. **Tabelas novas**
   - `profiles` (nome, email, avatar, criado_por) ligada ao usuário.
   - `app_role` enum: `vesta` | `membro`.
   - `user_roles` (user_id, role) — separada por segurança.
   - Função `has_role(user_id, role)` SECURITY DEFINER pra RLS.
3. **Trigger** que cria `profile` automaticamente no signup.

## Fase 2 — Fluxo de login com MFA obrigatório

Telas novas (todas em português, no estilo Vesta atual):

```text
/auth              → email + senha
/auth/mfa-setup    → 1º login: mostra QR code + campo do código de 6 dígitos
/auth/mfa-verify   → logins seguintes: só o campo do código
/auth/reset        → definir senha (usado no convite e no "esqueci")
```

- Após email+senha, o app checa se o usuário já tem fator TOTP.
  - **Sem fator** → força `/auth/mfa-setup`. Só entra depois de escanear o QR e digitar o código correto.
  - **Com fator** → pede o código de 6 dígitos em `/auth/mfa-verify`.
- Sessão só é considerada válida (`aal2`) depois do código. Sem MFA verificado, todas as rotas protegidas redirecionam de volta pro passo faltante.

## Fase 3 — Painel Vesta (só papel `vesta` acessa)

Nova página `/vesta/usuarios`:

- Listar usuários (nome, email, papel, MFA ativo?, último login).
- Botão "Convidar usuário": abre modal com email + papel (`vesta`/`membro`) → dispara convite por email.
- Botão "Resetar MFA" (quando o Paulo perder o celular, você tira o fator dele e ele reconfigura no próximo login).
- Botão "Remover acesso".

Tudo isso via server functions (`createServerFn` + `requireSupabaseAuth`) que verificam `has_role(user, 'vesta')` antes de chamar a Auth Admin API.

## Fase 4 — Migração dos dados mock pro banco

Tabelas por dado (todas com RLS scoped por `owner_id` + policy pra `vesta` ver tudo):

- `carteiras` (owner_id, conta, total, rf, rv, kpi4…)
- `rf_ativos` (owner_id, nome, valor, taxa, cdi, vencimento, status, nota)
- `rv_ativos` (owner_id, ticker, valor, pm, retorno, classe…)
- `alertas` (owner_id, cor, titulo, det)
- `vencimentos` (owner_id, icon, nome, det, badge, cor)
- `resumo_itens` (owner_id, dot, nome, det)

Seed inicial via migration: linhas da Cinthia com `owner_id = <uuid da cinthia>` e do Paulo com `owner_id = <uuid do paulo>` (preenchidos depois que você criar as duas contas pelo painel).

`getUser()` em `src/data/vesta-users.ts` vira server function que:
- Se `profileId === "familiar"` e usuário é `vesta` → agrega as duas carteiras.
- Se `profileId === "paulo"` → só permite se `has_role('vesta')` ou owner.
- Se `profileId === "cinthia"` → mesma regra.

## Fase 5 — Emails de auth

Configurar templates de email do Lovable pra:
- Convite ("Cinthia te convidou pro Vesta — clique pra definir sua senha")
- Reset de senha
- Confirmação de email

## Detalhes técnicos

- Lib usada: Supabase MFA nativo (`supabase.auth.mfa.enroll/challenge/verify`) — o QR gerado é TOTP-padrão, compatível com Google Auth, MS Auth, Authy, 1Password.
- `_authenticated/route.tsx` (gerenciado pela plataforma) já bloqueia rotas privadas; adiciono um gate extra que exige `aal === 'aal2'` (MFA confirmado nesta sessão).
- Rotas Vesta ficam em `_authenticated/_vesta/` com `beforeLoad` chamando `has_role`.
- Todas as tabelas: `GRANT` para `authenticated`, `service_role`; nenhuma pra `anon` (não há leitura pública).

## Fora de escopo (fica pra depois se você quiser)

- Recuperação de MFA por códigos-backup (posso adicionar).
- Login por biometria/passkey no celular.
- Log de auditoria (quem entrou quando, o que a Vesta alterou).

## Ordem de execução

1. Migration (tabelas, roles, RLS, trigger).
2. Configurar auth (signup off, HIBP on).
3. Telas de auth + MFA.
4. Painel Vesta de usuários.
5. Server functions de dados + trocar o mock.
6. Templates de email.
7. Você cria as duas contas (Cinthia e Paulo) pelo painel; seed dos dados atuais é aplicado nas contas criadas.
