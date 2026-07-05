import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Verifica se ainda não existe nenhum usuário Vesta no sistema.
 * Usado pela tela /auth/setup pra permitir a criação do primeiro admin.
 */
export const isBootstrapAvailable = createServerFn({ method: "GET" }).handler(
  async () => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { count, error } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "vesta");
    if (error) throw error;
    return { available: (count ?? 0) === 0 };
  },
);

/**
 * Cria o PRIMEIRO usuário Vesta do sistema.
 * Só funciona enquanto não existe nenhum Vesta cadastrado.
 * Retorna sucesso; o cliente então faz signIn normalmente.
 */
export const bootstrapVesta = createServerFn({ method: "POST" })
  .inputValidator((input) =>
    z
      .object({
        email: z.string().trim().email().max(255),
        password: z.string().min(8).max(128),
        nome: z.string().trim().min(1).max(100),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const { count, error: countErr } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "vesta");
    if (countErr) throw countErr;
    if ((count ?? 0) > 0) {
      throw new Error("bootstrap_indisponivel");
    }

    const { data: created, error: createErr } =
      await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { nome: data.nome },
      });
    if (createErr) throw createErr;
    if (!created.user) throw new Error("usuario_nao_criado");

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "vesta" });
    if (roleErr) throw roleErr;

    return { ok: true };
  });

/**
 * Retorna o papel do usuário logado.
 */
export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return { role: (data?.role ?? null) as "vesta" | "membro" | null };
  });
