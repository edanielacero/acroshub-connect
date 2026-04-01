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

    // 1. Authenticate caller and verify super_admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(jwt);
    if (authErr || !caller) throw new Error("No se pudo autenticar.");

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", caller.id)
      .single();

    if (callerProfile?.role !== "super_admin") {
      throw new Error("Solo los superadministradores pueden crear profesores.");
    }

    // 2. Parse body
    const body = await req.json();
    const { email, name, plan, notes } = body;

    if (!email || !name) throw new Error("Email y nombre son obligatorios.");
    if (!plan) throw new Error("Debes seleccionar un plan.");

    const cleanEmail = email.trim().toLowerCase();

    // 3. Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, role")
      .ilike("email", cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      throw new Error(`Ya existe un usuario con el correo ${cleanEmail}.`);
    }

    // 4. Create auth user with temporary password
    const tempPassword = crypto.randomUUID().slice(0, 12) + "Aa1!";
    const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: name }
    });

    if (createErr) throw new Error(`Error creando usuario: ${createErr.message}`);
    if (!newUser.user) throw new Error("No se pudo crear el usuario.");

    // 5. Create/update profile with role=profesor and selected plan
    const { error: profileErr } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: newUser.user.id,
        email: cleanEmail,
        full_name: name,
        role: "profesor",
        plan: plan,
        status: plan === "gratis" ? "gratis" : "activo",
        billing_cycle: null,
        current_period_start: null,
        current_period_end: null,
        scheduled_downgrade_plan: null,
        stripe_connected: false
      }, { onConflict: "id" });

    if (profileErr) throw new Error(`Error creando perfil: ${profileErr.message}`);

    // 6. Send welcome email
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    let emailSent = false;

    if (RESEND_API_KEY) {
      try {
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: Deno.env.get("RESEND_FROM_EMAIL") || "Acroshub <hola@acroshub.com>",
            to: [cleanEmail],
            subject: "¡Tu cuenta de profesor en Acroshub está lista!",
            html: `
              <h1>¡Hola ${name}!</h1>
              <p>Se ha creado tu cuenta de profesor en <strong>Acroshub</strong>.</p>
              <p>Tus credenciales temporales son:</p>
              <ul>
                <li><strong>Email:</strong> ${cleanEmail}</li>
                <li><strong>Contraseña temporal:</strong> ${tempPassword}</li>
              </ul>
              <p>Por favor inicia sesión y cambia tu contraseña lo antes posible.</p>
              <p style="color:#888;font-size:12px;">Plan asignado: ${plan}</p>
            `,
          }),
        });
        emailSent = res.ok;
        if (!res.ok) console.error("Resend error:", await res.text());
      } catch (emailErr) {
        console.error("Email sending failed:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        email_sent: emailSent,
        temp_password: tempPassword,
        user_id: newUser.user.id,
        notes: notes || null
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("create-professor error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
