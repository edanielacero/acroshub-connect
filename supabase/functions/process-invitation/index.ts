import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Convert pricing UI type to DB enum value
function toDbAccessType(type: string): string {
  if (type === "monthly" || type === "annual" || type === "subscription") return "subscription";
  return "lifetime"; // one-time, free, lifetime → lifetime
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { email, name, productId, productType, productTitle, profesorName, accessType, appUrl } = body;

    if (!email) throw new Error("El email es obligatorio");

    // 1. Identify the calling profesor
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: authErr } = await supabaseAdmin.auth.getUser(jwt);
    if (authErr || !caller) throw new Error("No se pudo identificar al profesor.");
    const profesorId = caller.id;

    // 2. Check if a user with this email already has an account
    const { data: existingProfile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, status")
      .ilike("email", email.trim())
      .maybeSingle();

    if (profileErr) {
      console.error("Error fetching profile:", profileErr.message);
      throw new Error(`Error buscando perfil: ${profileErr.message}`);
    }

    console.log("Profile lookup result:", existingProfile ? `found (${existingProfile.email})` : "not found");

    if (existingProfile) {
      // USER EXISTS IN ACROSHUB → grant access directly, no invitation email
      const dbAccessType = toDbAccessType(accessType || "lifetime");
      console.log(`User exists. Granting direct enrollment. access_type: ${dbAccessType}, product_id: ${productId}`);

      if (productId) {
        // Check if already enrolled in this product
        const { data: existingEnrollment } = await supabaseAdmin
          .from("enrollments")
          .select("id")
          .eq("alumno_id", existingProfile.id)
          .eq("product_id", productId)
          .maybeSingle();

        if (existingEnrollment) {
          // Already enrolled — update to active
          const { error: updErr } = await supabaseAdmin
            .from("enrollments")
            .update({
              product_type: productType || "course",
              access_type: dbAccessType,
              status: "active",
            })
            .eq("id", existingEnrollment.id);
          
          if (updErr) throw new Error(`Error actualizando enrollment: ${updErr.message}`);
          console.log("Enrollment updated to active");
        } else {
          // No enrollment yet — create it
          const { error: insErr } = await supabaseAdmin
            .from("enrollments")
            .insert({
              alumno_id: existingProfile.id,
              product_id: productId,
              product_type: productType || "course",
              access_type: dbAccessType,
              status: "active",
            });
          
          if (insErr) throw new Error(`Error insertando enrollment: ${insErr.message}`);
          console.log("Enrollment created successfully");
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          is_new: false,
          email_sent: false,
          link: "",
          already_active: true,
          student_name: existingProfile.full_name || name,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // USER DOES NOT EXIST → create invitation and send activation email
    console.log("User not found. Creating invitation...");
    const invToken = crypto.randomUUID().replace(/-/g, "");

    // Check if invitation already exists for this email+profesor combination
    const { data: existingInv } = await supabaseAdmin
      .from("invitations")
      .select("id, token")
      .eq("email", email.trim().toLowerCase())
      .eq("profesor_id", profesorId)
      .maybeSingle();

    let token = invToken;
    
    if (existingInv) {
      // Update existing invitation
      const { error: updInvErr } = await supabaseAdmin
        .from("invitations")
        .update({
          name,
          token: invToken,
          status: "pending",
          product_id: productId || null,
          product_type: productType || null,
          access_type: toDbAccessType(accessType || "lifetime"),
          last_sent_at: new Date().toISOString(),
        })
        .eq("id", existingInv.id);
      
      if (updInvErr) throw new Error(`Error actualizando invitación: ${updInvErr.message}`);
    } else {
      // Create new invitation
      const { error: invErr } = await supabaseAdmin
        .from("invitations")
        .insert({
          email: email.trim().toLowerCase(),
          name,
          profesor_id: profesorId,
          token: invToken,
          status: "pending",
          product_id: productId || null,
          product_type: productType || null,
          access_type: toDbAccessType(accessType || "lifetime"),
          last_sent_at: new Date().toISOString(),
        });
      
      if (invErr) throw new Error(`Error creando invitación: ${invErr.message}`);
    }

    // Send activation email
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const activationLink = `${appUrl}/activar-cuenta?token=${token}`;
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
            from: "Acroshub <onboarding@resend.dev>",
            to: [email.trim()],
            subject: `¡Bienvenido! Activa tu cuenta para acceder a ${productTitle || "tu curso"}`,
            html: `
              <h1>¡Hola ${name}!</h1>
              <p>${profesorName || "Tu profesor"} te ha invitado a <strong>${productTitle || "un curso"}</strong>.</p>
              <p>Para acceder, activa tu cuenta haciendo clic aquí:</p>
              <a href="${activationLink}" style="display:inline-block;padding:12px 24px;background:#16a34a;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Activar mi cuenta</a>
              <br/><br/>
              <p style="color:#888;font-size:12px;">Si no puedes hacer clic, copia y pega este enlace: ${activationLink}</p>
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
      JSON.stringify({ success: true, email_sent: emailSent, link: activationLink, is_new: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("process-invitation error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
