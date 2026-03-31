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
    const BUNNY_API_KEY = Deno.env.get("BUNNY_STREAM_API_KEY");
    const BUNNY_LIBRARY_ID = Deno.env.get("BUNNY_STREAM_LIBRARY_ID");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!BUNNY_API_KEY || !BUNNY_LIBRARY_ID) {
      throw new Error("Bunny.net credentials not configured");
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase env vars");
    }

    // 1. Authenticate caller — must be a logged-in profesor
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(jwt);
    if (authErr || !user) throw new Error("No autenticado.");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "profesor" && profile.role !== "super_admin")) {
      throw new Error("Solo profesores pueden subir miniaturas.");
    }

    // 2. Parse multipart form data
    const formData = await req.formData();
    const thumbnailFile = formData.get("thumbnail") as File | null;
    const videoId = formData.get("videoId") as string | null;

    if (!thumbnailFile) {
      throw new Error("No se recibió ningún archivo de imagen.");
    }
    if (!videoId) {
      throw new Error("No se recibió el videoId.");
    }

    // Validate file type
    if (!thumbnailFile.type.startsWith("image/")) {
      throw new Error("El archivo no es una imagen válida.");
    }

    // Validate file size (max 5MB)
    if (thumbnailFile.size > 5 * 1024 * 1024) {
      throw new Error("La imagen supera el límite de 5MB.");
    }

    // 3. Convert image to ArrayBuffer to send to Bunny
    const fileBuffer = await thumbnailFile.arrayBuffer();

    // 4. Upload to Bunny.net Thumbnail API
    const uploadRes = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}/thumbnail`,
      {
        method: "POST",
        headers: {
          AccessKey: BUNNY_API_KEY,
          "Content-Type": "image/jpeg", // Usually works for standard images in Bunny
        },
        body: fileBuffer,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Error al subir miniatura a Bunny: ${errText}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Miniatura actualizada correctamente.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("upload-thumbnail error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
