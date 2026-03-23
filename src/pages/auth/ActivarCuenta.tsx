import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AcroshubLogo } from "@/components/brand/AcroshubLogo";
import { Loader2, CheckCircle, XCircle, Eye, EyeOff, BookOpen, GraduationCap } from "lucide-react";
import { toast } from "sonner";

export default function ActivarCuenta() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<any>(null);
  const [productTitle, setProductTitle] = useState<string>("");
  const [loadingInv, setLoadingInv] = useState(true);
  const [tokenInvalid, setTokenInvalid] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setLoadingInv(false); setTokenInvalid(true); return; }
    (async () => {
      const { data, error } = await supabase
        .from("invitations")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      setLoadingInv(false);
      if (error || !data) { setTokenInvalid(true); return; }
      if (data.status === "accepted") { setTokenInvalid(true); return; }
      setInvitation(data);

      // Fetch actual product name
      if (data.product_id) {
        const table = data.product_type === 'ebook' ? 'ebooks' : 'courses';
        const { data: product } = await supabase
          .from(table)
          .select('title')
          .eq('id', data.product_id)
          .maybeSingle();
        if (product?.title) setProductTitle(product.title);
      }
    })();
  }, [token]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) { setError("La contraseña debe tener al menos 8 caracteres."); return; }
    if (password !== confirmPassword) { setError("Las contraseñas no coinciden."); return; }

    setActivating(true);

    try {
      // 0. Sign out any existing session (e.g., professor testing in same browser)
      await supabase.auth.signOut();

      // 1. Create auth account via signUp
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            full_name: invitation.name,
            role: "alumno",
            status: "active",
          },
        },
      });

      let userId = signUpData?.user?.id;

      if (signUpErr) {
        if (signUpErr.message.includes("already") || signUpErr.message.includes("registered")) {
          // User already exists — just sign in
        } else {
          setError(signUpErr.message);
          setActivating(false);
          return;
        }
      }

      // 2. Sign in to get a proper session
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: invitation.email,
        password,
      });

      if (signInErr) {
        setError("Cuenta creada pero no se pudo iniciar sesión. Intenta desde /login.");
        setActivating(false);
        return;
      }

      userId = signInData?.user?.id || userId;

      // 3. Complete activation via Edge Function (uses service_role — reliable)
      if (userId && token) {
        const { data: fnData, error: fnErr } = await supabase.functions.invoke("activate-account", {
          body: { token, userId },
        });

        if (fnErr) {
          let msg = "Error al completar la activación.";
          try { const b = await fnErr.context?.json?.(); msg = b?.error || msg; } catch {}
          throw new Error(msg);
        } else if (fnData?.error) {
          throw new Error(fnData.error);
        }
      }

    } catch (err: any) {
      setError(err?.message || "Error al activar la cuenta.");
      setActivating(false);
      return;
    }

    setActivating(false);
    setDone(true);
    toast.success("¡Cuenta activada correctamente!");

    // Auto-redirect after a delay
    setTimeout(() => navigate("/mi-cuenta"), 2500);
  };

  // ---- LOADING STATE ----
  if (loadingInv) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ---- INVALID TOKEN ----
  if (tokenInvalid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <XCircle className="h-14 w-14 text-destructive mx-auto mb-4" />
            <h1 className="text-xl font-bold">Link inválido o ya utilizado</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Este link de activación no es válido o ya fue utilizado.
            </p>
            <Button className="mt-6 w-full" asChild>
              <Link to="/login">Ir a iniciar sesión</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- SUCCESS STATE ----
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold">¡Cuenta activada!</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Redirigiendo a tu cuenta...
            </p>
            <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---- ACTIVATION FORM ----
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center pb-2">
          <Link to="/" className="mb-3 inline-flex items-center justify-center gap-2 text-lg font-bold text-primary">
            <AcroshubLogo className="h-7 w-7" /> Acroshub
          </Link>
          <CardTitle className="text-2xl">Activa tu cuenta</CardTitle>
          <CardDescription>
            {invitation.name && <span>Hola <strong>{invitation.name}</strong>, </span>}
            crea tu contraseña para acceder.
          </CardDescription>
        </CardHeader>

        {/* Product info */}
        {invitation.product_id && (
          <div className="mx-6 mb-2 flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
            {invitation.product_type === 'ebook' ? (
              <BookOpen className="h-5 w-5 text-green-600 shrink-0" />
            ) : (
              <GraduationCap className="h-5 w-5 text-green-600 shrink-0" />
            )}
            <div className="text-sm">
              <p className="font-semibold text-green-800">Tienes acceso asignado</p>
              <p className="text-green-700">{productTitle || (invitation.product_type === 'ebook' ? 'Ebook' : 'Curso')}</p>
            </div>
          </div>
        )}

        <CardContent>
          <form onSubmit={handleActivate} className="space-y-4">
            {/* Email (read-only) */}
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={invitation.email} disabled className="bg-muted text-muted-foreground" />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password">Crea tu contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label htmlFor="confirm">Confirma tu contraseña</Label>
              <Input
                id="confirm"
                type="password"
                placeholder="Repite la contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {/* Error */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={activating}>
              {activating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Activando...</>
              ) : (
                "Activar mi cuenta"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center pb-6">
          <p className="text-xs text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
