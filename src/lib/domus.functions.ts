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
    const [domusResult, requestsResult, membersResult, scopesResult, vestaResult] = await Promise.all([
      context.supabase
        .from("domus")
        .select("id,nome,slug,descricao,created_at")
        .order("created_at", { ascending: false }),
      context.supabase
        .from("domus_join_requests")
        .select("id,nome,email,mensagem,status,created_at,domus:domus_id(nome)")
        .order("created_at", { ascending: false }),
      context.supabase
        .from("domus_members")
        .select("id,domus_id,profile_id,papel,created_at,domus:domus_id(nome),profile:profile_id(nome,email)")
        .order("created_at", { ascending: false }),
      context.supabase
        .from("domus_visibility_scopes")
        .select("id,domus_id,member_profile_id,can_see_consolidado,can_see_member_profile_ids,updated_at"),
      context.supabase
        .from("profiles")
        .select("id,nome,email")
        .eq("id", context.userId)
        .maybeSingle(),
    ]);
    if (domusResult.error) throw domusResult.error;
    if (requestsResult.error) throw requestsResult.error;
    if (membersResult.error) throw membersResult.error;
    if (scopesResult.error) throw scopesResult.error;
    return {
      domus: domusResult.data ?? [],
      requests: requestsResult.data ?? [],
      members: membersResult.data ?? [],
      scopes: scopesResult.data ?? [],
      vesta: vestaResult.data ?? null,
    };
  });

export const getDomusSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [roleResult, profileResult, membershipResult, membersResult] = await Promise.all([
      context.supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("profiles")
        .select("id,nome,email,primeiro_acesso")
        .eq("id", context.userId)
        .maybeSingle(),
      context.supabase
        .from("domus_members")
        .select("id,domus_id,profile_id,papel,created_at,domus:domus_id(nome),profile:profile_id(nome,email)")
        .eq("profile_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      context.supabase
        .from("domus_members")
        .select("id,domus_id,profile_id,papel,created_at,domus:domus_id(nome),profile:profile_id(nome,email)")
        .order("created_at", { ascending: false }),
    ]);

    if (roleResult.error) throw roleResult.error;
    if (profileResult.error) throw profileResult.error;
    if (membershipResult.error) throw membershipResult.error;
    if (membersResult.error) throw membersResult.error;

    let scope = null;
    if (membershipResult.data) {
      const { data, error } = await context.supabase
        .from("domus_visibility_scopes")
        .select("id,domus_id,member_profile_id,can_see_consolidado,can_see_member_profile_ids,updated_at")
        .eq("domus_id", membershipResult.data.domus_id)
        .eq("member_profile_id", context.userId)
        .maybeSingle();
      if (error) throw error;
      scope = data;
    }

    return {
      role: roleResult.data?.role ?? null,
      profile: profileResult.data ?? null,
      membership: membershipResult.data ?? null,
      members: membersResult.data ?? [],
      scope,
    };
  });

export const listDomusPersonae = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // RLS trata visibilidade: Vesta ve todos, membro ve so a propria linha.
    const { data, error } = await context.supabase
      .from("domus_members")
      .select("id,papel,profile_id,domus:domus_id(nome),profile:profile_id(nome,email)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const saveMemberVisibilityScope = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        memberProfileId: z.string().uuid(),
        canSeeConsolidado: z.boolean(),
        canSeeMemberProfileIds: z.array(z.string().uuid()).default([]),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    await assertVesta(context);

    const { data: member, error: memberError } = await context.supabase
      .from("domus_members")
      .select("domus_id,profile_id")
      .eq("profile_id", data.memberProfileId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (memberError) throw memberError;

    let domusId = member?.domus_id ?? null;
    if (!domusId) {
      const { data: firstDomus, error: domusError } = await context.supabase
        .from("domus")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (domusError) throw domusError;
      domusId = firstDomus?.id ?? null;
    }
    if (!domusId) throw new Error("Crie um Domus antes de salvar regras.");

    const visibleIds = Array.from(new Set(data.canSeeMemberProfileIds)).filter(
      (id) => id !== data.memberProfileId,
    );

    const { data: saved, error } = await context.supabase
      .from("domus_visibility_scopes")
      .upsert(
        {
          domus_id: domusId,
          member_profile_id: data.memberProfileId,
          can_see_consolidado: data.canSeeConsolidado,
          can_see_member_profile_ids: visibleIds,
        },
        { onConflict: "domus_id,member_profile_id" },
      )
      .select("id,domus_id,member_profile_id,can_see_consolidado,can_see_member_profile_ids,updated_at")
      .single();
    if (error) throw error;
    return saved;
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

    let domusId = pedido.domus_id;
    if (!domusId) {
      const { data: firstDomus, error: domusError } = await supabaseAdmin
        .from("domus")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (domusError) throw domusError;
      domusId = firstDomus?.id ?? null;
    }
    if (!domusId) throw new Error("Crie um Domus antes de aprovar pessoas.");

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

    const normalizedEmail = pedido.email.trim().toLowerCase();

    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: normalizedEmail,
          nome: pedido.nome,
        },
        { onConflict: "id" },
      );
    if (profileError) throw profileError;

    // Papel padrão: membro.
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "membro" }, { onConflict: "user_id,role" });
    if (roleError) throw roleError;

    // Vincula ao Domus e deixa a carteira em branco até a Vesta subir dados.
    const { error: memberError } = await supabaseAdmin
      .from("domus_members")
      .upsert(
        { domus_id: domusId, profile_id: userId, papel: "membro" },
        { onConflict: "domus_id,profile_id" },
      );
    if (memberError) throw memberError;

    const { error: scopeError } = await supabaseAdmin
      .from("domus_visibility_scopes")
      .upsert(
        {
          domus_id: domusId,
          member_profile_id: userId,
          can_see_consolidado: false,
          can_see_member_profile_ids: [],
        },
        { onConflict: "domus_id,member_profile_id" },
      );
    if (scopeError) throw scopeError;

    const { error: updateError } = await context.supabase
      .from("domus_join_requests")
      .update({
        domus_id: domusId,
        status: "aprovado",
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (updateError) throw updateError;

    return { ok: true, email: pedido.email, senha: DEFAULT_MEMBER_PASSWORD };
  });