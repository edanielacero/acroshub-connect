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
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    console.log("Activation request received:", body);
    const { token, userId } = body;

    if (!token || !userId) {
      throw new Error("Token y userId son requeridos");
    }

    // 1. Find and validate invitation
    console.log(`Checking invitation for token: ${token}`);
    const { data: invitation, error: invError } = await supabaseAdmin
      .from("invitations")
      .select("*")
      .eq("token", token)
      .eq("status", "pending")
      .single();

    if (invError || !invitation) {
      console.error("Invitation check error:", invError);
      throw new Error("Invitación no válida o ya aceptada");
    }
    console.log("Invitation found:", invitation.email);

    // 2. Update profile to active
    console.log(`Upserting profile for userId: ${userId}`);
    const { error: profileErr } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      full_name: invitation.name,
      email: invitation.email,
      role: "alumno",
      status: "active",
    });
    
    if (profileErr) {
      console.error("Profile upsert error:", profileErr);
      throw new Error(`Error actualizando perfil: ${profileErr.message}`);
    }

    // 3. Create enrollment if product assigned
    if (invitation.product_id) {
      console.log(`Creating enrollment for product: ${invitation.product_id}`);
      const { error: enrollErr } = await supabaseAdmin
        .from("enrollments")
        .insert({
          alumno_id: userId,
          product_id: invitation.product_id,
          product_type: invitation.product_type,
          access_type: invitation.access_type || "lifetime",
          status: "active",
        });
      
      if (enrollErr) {
        console.warn("Enrollment creation error (might already exist):", enrollErr.message);
        // Non-fatal if already exists
      } else {
        console.log("Enrollment created successfully");
      }
    }

    // 4. Mark invitation as accepted
    console.log("Marking invitation as accepted");
    const { error: finalErr } = await supabaseAdmin
      .from("invitations")
      .update({ 
        status: "accepted", 
        accepted_at: new Date().toISOString(), 
        alumno_id: userId 
      })
      .eq("id", invitation.id);

    if (finalErr) {
      console.error("Final update error:", finalErr);
      throw new Error(`Error marcando invitación como aceptada: ${finalErr.message}`);
    }

    console.log("Activation completed successfully!");
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("activate-account error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
