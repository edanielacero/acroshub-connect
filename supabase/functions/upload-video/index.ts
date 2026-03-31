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
      throw new Error("Solo profesores pueden subir videos.");
    }

    // 2. Parse multipart form data
    const formData = await req.formData();
    const videoFile = formData.get("video") as File | null;
    const title = (formData.get("title") as string) || "Video sin título";

    if (!videoFile) {
      throw new Error("No se recibió ningún archivo de video.");
    }

    // Validate file size (max 500MB)
    if (videoFile.size > 500 * 1024 * 1024) {
      throw new Error("El video supera el límite de 500MB.");
    }

    // 3. Step 1: Create video object in Bunny.net
    const createRes = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
      {
        method: "POST",
        headers: {
          AccessKey: BUNNY_API_KEY,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      }
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Error al crear video en Bunny: ${errText}`);
    }

    const videoData = await createRes.json();
    const videoId = videoData.guid;

    if (!videoId) {
      throw new Error("Bunny.net no retornó un ID de video válido.");
    }

    // 4. Step 2: Upload binary data to Bunny.net
    const videoBuffer = await videoFile.arrayBuffer();

    const uploadRes = await fetch(
      `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos/${videoId}`,
      {
        method: "PUT",
        headers: {
          AccessKey: BUNNY_API_KEY,
          "Content-Type": "application/octet-stream",
        },
        body: videoBuffer,
      }
    );

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Error al subir video a Bunny: ${errText}`);
    }

    // 5. Return embed URL
    const embedUrl = `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}`;

    return new Response(
      JSON.stringify({
        success: true,
        videoId,
        embedUrl,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    console.error("upload-video error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
