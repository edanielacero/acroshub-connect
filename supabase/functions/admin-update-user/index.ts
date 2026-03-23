import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Missing env vars");

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Authenticate caller
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(jwt);
    if (authErr || !caller) throw new Error("No se pudo autenticar al administrador.");

    // 2. Verify caller is super_admin
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (callerProfile?.role !== "super_admin") {
      throw new Error("Solo los superadministradores pueden realizar esta acción.");
    }

    // 3. Verify caller password (re-authentication)
    const body = await req.json();
    const { targetUserId, adminPassword, newEmail, newPassword, newName, newStatus } = body;

    if (!targetUserId) throw new Error("targetUserId es obligatorio.");
    if (!adminPassword) throw new Error("Debes ingresar tu contraseña de administrador.");

    // Re-authenticate admin with their own password
    const { error: reAuthErr } = await supabaseAdmin.auth.signInWithPassword({
      email: caller.email!,
      password: adminPassword,
    });

    if (reAuthErr) {
      throw new Error("Contraseña de administrador incorrecta.");
    }

    // 4. Build update payload for auth.users
    const authUpdate: Record<string, any> = {};
    if (newEmail && newEmail.trim()) authUpdate.email = newEmail.trim();
    if (newPassword && newPassword.trim()) authUpdate.password = newPassword.trim();

    if (Object.keys(authUpdate).length > 0) {
      const { error: updAuthErr } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, authUpdate);
      if (updAuthErr) throw new Error(`Error actualizando credenciales: ${updAuthErr.message}`);
    }

    // 5. Update profile table
    const profileUpdate: Record<string, any> = {};
    if (newName !== undefined) profileUpdate.full_name = newName;
    if (newStatus !== undefined) profileUpdate.status = newStatus;
    if (newEmail && newEmail.trim()) profileUpdate.email = newEmail.trim();

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profErr } = await supabaseAdmin
        .from("profiles")
        .update(profileUpdate)
        .eq("id", targetUserId);
      if (profErr) throw new Error(`Error actualizando perfil: ${profErr.message}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("admin-update-user error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
