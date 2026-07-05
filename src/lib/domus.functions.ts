import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

async function assertVesta(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "vesta")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Apenas a Vesta pode fazer isso.");
}

export const createDomus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        nome: z.string().trim().min(2).max(100),
        slug: slugSchema,
        descricao: z.string().trim().max(400).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertVesta(context);
    const { data: created, error } = await context.supabase
      .from("domus")
      .insert({
        nome: data.nome,
        slug: data.slug,
        descricao: data.descricao || null,
        created_by: context.userId,
      })
      .select("id,nome,slug,descricao,created_at")
      .single();
    if (error) throw error;
    return created;
  });

export const getDomusAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertVesta(context);
    const [domusResult, requestsResult] = await Promise.all([
      context.supabase
        .from("domus")
        .select("id,nome,slug,descricao,created_at")
        .order("created_at", { ascending: false }),
      context.supabase
        .from("domus_join_requests")
        .select("id,nome,email,mensagem,status,created_at,domus:domus_id(nome)")
        .order("created_at", { ascending: false }),
    ]);
    if (domusResult.error) throw domusResult.error;
    if (requestsResult.error) throw requestsResult.error;
    return {
      domus: domusResult.data ?? [],
      requests: requestsResult.data ?? [],
    };
  });

export const updateJoinRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["aprovado", "recusado"]),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertVesta(context);
    const { error } = await context.supabase
      .from("domus_join_requests")
      .update({
        status: data.status,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const DEFAULT_MEMBER_PASSWORD = "VESTADECIDETUDO";

export const approveJoinRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    await assertVesta(context);

    const { data: pedido, error: fetchError } = await context.supabase
      .from("domus_join_requests")
      .select("id,email,nome,domus_id,status")
      .eq("id", data.id)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!pedido) throw new Error("Pedido não encontrado.");
    if (pedido.status !== "pendente") {
      throw new Error("Esse pedido já foi decidido antes.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Tenta criar o usuário no Auth com a senha padrão.
    let userId: string | null = null;
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: pedido.email,
      password: DEFAULT_MEMBER_PASSWORD,
      email_confirm: true,
      user_metadata: { nome: pedido.nome },
    });

    if (createError) {
      // Se já existe (email duplicado), tenta recuperar o id via listUsers.
      const alreadyExists = /already|exists|registered/i.test(createError.message);
      if (!alreadyExists) throw createError;
      const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) throw listError;
      const found = list.users.find((u) => u.email?.toLowerCase() === pedido.email.toLowerCase());
      if (!found) throw createError;
      userId = found.id;
    } else {
      userId = created.user?.id ?? null;
    }
    if (!userId) throw new Error("Não consegui criar o usuário.");

    // Papel padrão: membro (o trigger handle_new_user já criou o profile).
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "membro" }, { onConflict: "user_id,role" });

    // Vincula ao Domus (se o pedido indicava um).
    if (pedido.domus_id) {
      await supabaseAdmin
        .from("domus_members")
        .upsert(
          { domus_id: pedido.domus_id, profile_id: userId, papel: "membro" },
          { onConflict: "domus_id,profile_id" },
        );
    }

    const { error: updateError } = await context.supabase
      .from("domus_join_requests")
      .update({
        status: "aprovado",
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (updateError) throw updateError;

    return { ok: true, email: pedido.email, senha: DEFAULT_MEMBER_PASSWORD };
  });