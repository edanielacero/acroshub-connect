# PROMPT: Implementar Sistema de Códigos Mágicos

## Contexto

Acroshub es un SaaS multi-tenant para educadores digitales. El profesor gestiona sus alumnos y ventas de forma manual (sin Stripe). Los Códigos Mágicos son una forma simplificada de dar acceso a productos.

**Stack:** React 18 + Vite + TypeScript + Tailwind + shadcn/ui + React Query + Supabase

---

## ¿Qué son los Códigos Mágicos?

El profesor genera códigos únicos asociados a un producto y plan de pago, los comparte con sus alumnos (WhatsApp, Instagram, email), y el alumno los ingresa en la plataforma para activar su acceso instantáneamente.

**Flujo simplificado:**
```
Profesor copia código → Lo comparte por WhatsApp → Alumno lo ingresa → Acceso activado + Transacción registrada
```

---

## Reglas de Negocio

### Formato del código
- 6 caracteres alfanuméricos: `XXX-XXX` (ej: A3X-9K2)
- Caracteres permitidos: `A B C D E F G H J K M N P Q R S T U V W X Y Z 2 3 4 5 6 7 8 9`
- Sin caracteres confusos: 0, O, 1, I, L (evitar confusiones)
- Almacenamiento en BD: sin guión → `A3X9K2`
- Display en UI: con guión → `A3X-9K2`

### Piscina de códigos
- Por cada combinación **Producto + Tipo de pago** hay **5 códigos siempre disponibles**
- Cuando se usa un código, se genera uno nuevo automáticamente
- El profesor nunca se queda sin códigos

### Registro de transacción
Cuando el alumno usa un código, se registra automáticamente:
- `method`: `magic_code`
- `amount`: Precio del plan configurado en el producto
- `notes`: "Activado con código mágico: XXX-XXX"

### Expiración del enrollment según tipo de pago
| Tipo | expires_at |
|---|---|
| `one_time` | `NULL` (acceso permanente) |
| `monthly` | `NOW() + 1 mes` |
| `yearly` | `NOW() + 1 año` |

---

## Base de Datos

### Tabla: `magic_codes`

```sql
CREATE TABLE magic_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relaciones
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  -- Datos del código
  code VARCHAR(6) NOT NULL UNIQUE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('one_time', 'monthly', 'yearly')),
  amount DECIMAL(10,2) NOT NULL,
  
  -- Estado
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'used')),
  
  -- Datos de uso (NULL si no se ha usado)
  used_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_magic_codes_product_status ON magic_codes(product_id, status);
CREATE INDEX idx_magic_codes_code ON magic_codes(code) WHERE status = 'available';
```

### Agregar método de pago a student_payments

```sql
-- Si usas ENUM, agregar:
ALTER TYPE student_payment_method ADD VALUE 'magic_code';

-- Si usas TEXT, ya está cubierto
```

### Función: Generar código único

```sql
CREATE OR REPLACE FUNCTION generate_magic_code()
RETURNS VARCHAR(6) AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  result VARCHAR(6) := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### Función: Asegurar piscina de 5 códigos

```sql
CREATE OR REPLACE FUNCTION ensure_magic_codes_pool(
  p_tenant_id UUID,
  p_product_id UUID,
  p_payment_type TEXT,
  p_amount DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
  current_count INTEGER;
  codes_needed INTEGER;
  new_code VARCHAR(6);
  i INTEGER;
  codes_generated INTEGER := 0;
BEGIN
  SELECT COUNT(*) INTO current_count
  FROM magic_codes
  WHERE product_id = p_product_id
    AND payment_type = p_payment_type
    AND status = 'available';
  
  codes_needed := 5 - current_count;
  
  FOR i IN 1..codes_needed LOOP
    LOOP
      new_code := generate_magic_code();
      EXIT WHEN NOT EXISTS (SELECT 1 FROM magic_codes WHERE code = new_code);
    END LOOP;
    
    INSERT INTO magic_codes (tenant_id, product_id, code, payment_type, amount, status)
    VALUES (p_tenant_id, p_product_id, new_code, p_payment_type, p_amount, 'available');
    
    codes_generated := codes_generated + 1;
  END LOOP;
  
  RETURN codes_generated;
END;
$$ LANGUAGE plpgsql;
```

### Función: Usar código mágico

```sql
CREATE OR REPLACE FUNCTION use_magic_code(
  p_code TEXT,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_clean_code VARCHAR(6);
  v_magic_code RECORD;
  v_enrollment_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  v_clean_code := UPPER(REPLACE(p_code, '-', ''));
  
  IF LENGTH(v_clean_code) != 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'El código debe tener 6 caracteres');
  END IF;
  
  SELECT mc.*, p.name as product_name, p.type as product_type, h.slug as hub_slug
  INTO v_magic_code
  FROM magic_codes mc
  JOIN products p ON mc.product_id = p.id
  JOIN hubs h ON p.hub_id = h.id
  WHERE mc.code = v_clean_code AND mc.status = 'available'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Código inválido o ya utilizado');
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM enrollments 
    WHERE user_id = p_user_id AND product_id = v_magic_code.product_id AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ya tienes acceso a este producto');
  END IF;
  
  v_expires_at := CASE v_magic_code.payment_type
    WHEN 'one_time' THEN NULL
    WHEN 'monthly' THEN NOW() + INTERVAL '1 month'
    WHEN 'yearly' THEN NOW() + INTERVAL '1 year'
  END;
  
  INSERT INTO enrollments (user_id, product_id, tenant_id, origin, payment_type, is_active, expires_at)
  VALUES (p_user_id, v_magic_code.product_id, v_magic_code.tenant_id, 'manual', v_magic_code.payment_type, true, v_expires_at)
  RETURNING id INTO v_enrollment_id;
  
  INSERT INTO student_payments (tenant_id, user_id, product_id, amount, method, notes)
  VALUES (v_magic_code.tenant_id, p_user_id, v_magic_code.product_id, v_magic_code.amount, 'magic_code', 'Activado con código mágico: ' || v_clean_code);
  
  UPDATE magic_codes
  SET status = 'used', used_by_user_id = p_user_id, used_at = NOW(), enrollment_id = v_enrollment_id
  WHERE id = v_magic_code.id;
  
  PERFORM ensure_magic_codes_pool(v_magic_code.tenant_id, v_magic_code.product_id, v_magic_code.payment_type, v_magic_code.amount);
  
  RETURN jsonb_build_object(
    'success', true,
    'product', jsonb_build_object('id', v_magic_code.product_id, 'name', v_magic_code.product_name, 'type', v_magic_code.product_type),
    'payment_type', v_magic_code.payment_type,
    'hub_slug', v_magic_code.hub_slug
  );
END;
$$ LANGUAGE plpgsql;
```

### Función: Regenerar códigos manualmente

```sql
CREATE OR REPLACE FUNCTION regenerate_magic_codes(
  p_product_id UUID,
  p_payment_type TEXT,
  p_tenant_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_amount DECIMAL;
BEGIN
  DELETE FROM magic_codes
  WHERE product_id = p_product_id AND payment_type = p_payment_type AND status = 'available';
  
  SELECT CASE p_payment_type
    WHEN 'one_time' THEN price_one_time
    WHEN 'monthly' THEN price_monthly
    WHEN 'yearly' THEN price_yearly
  END INTO v_amount
  FROM products WHERE id = p_product_id;
  
  RETURN ensure_magic_codes_pool(p_tenant_id, p_product_id, p_payment_type, v_amount);
END;
$$ LANGUAGE plpgsql;
```

### Trigger: Auto-generar códigos al crear/actualizar producto

```sql
CREATE OR REPLACE FUNCTION auto_generate_magic_codes()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT h.tenant_id INTO v_tenant_id FROM hubs h WHERE h.id = NEW.hub_id;
  
  IF NEW.price_one_time IS NOT NULL THEN
    PERFORM ensure_magic_codes_pool(v_tenant_id, NEW.id, 'one_time', NEW.price_one_time);
  END IF;
  
  IF NEW.price_monthly IS NOT NULL THEN
    PERFORM ensure_magic_codes_pool(v_tenant_id, NEW.id, 'monthly', NEW.price_monthly);
  END IF;
  
  IF NEW.price_yearly IS NOT NULL THEN
    PERFORM ensure_magic_codes_pool(v_tenant_id, NEW.id, 'yearly', NEW.price_yearly);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_magic_codes
AFTER INSERT OR UPDATE OF price_one_time, price_monthly, price_yearly ON products
FOR EACH ROW EXECUTE FUNCTION auto_generate_magic_codes();
```

---

## Rutas

```
PROFESOR:
/dashboard/cursos/:id/codigos   → Vista de códigos mágicos del curso
/dashboard/ebooks/:id/codigos   → Vista de códigos mágicos del ebook

ALUMNO:
/activar-codigo                 → Página para ingresar código
```

---

## UI del Profesor

### 1. Agregar botón en lista de cursos/ebooks

En `/dashboard/cursos` y `/dashboard/ebooks`, agregar botón "Códigos Mágicos" en cada fila de producto:

```tsx
<Button variant="outline" size="sm" asChild>
  <Link to={`/dashboard/cursos/${curso.id}/codigos`}>
    <Sparkles className="h-4 w-4 mr-1" />
    Códigos Mágicos
  </Link>
</Button>
```

### 2. Vista de Códigos Mágicos (`/dashboard/cursos/:id/codigos`)

**Layout:**
```
[← Atrás]

✨ Códigos Mágicos
{Nombre del producto}

Comparte un código con tu alumno para darle acceso directo.
El código se usa una sola vez y se regenera automáticamente.

┌─────────────────────────────────────────────────────────────┐
│ 💰 PAGO ÚNICO · $97 · Acceso permanente           [⋮]      │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────┐ │
│  │ A3X-9K2 │ │ B7M-4P1 │ │ C2N-8L5 │ │ D5Q-3R7 │ │E1W-6T9│ │
│  │   📋    │ │   📋    │ │   📋    │ │   📋    │ │  📋   │ │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────┘ │
└─────────────────────────────────────────────────────────────┘

(Repetir para Mensual y Anual si están configurados)

📜 Historial de códigos usados

┌────────┬──────────────┬─────────────────┬────────┬────────┬────────────┐
│ Código │ Alumno       │ Email           │ Plan   │ Monto  │ Fecha      │
├────────┼──────────────┼─────────────────┼────────┼────────┼────────────┤
│X9Z-3A1 │ Ana López    │ ana@mail.com    │ Único  │ $97    │ Hoy 14:30  │
│        │              │ [Ver perfil]    │        │        │            │
└────────┴──────────────┴─────────────────┴────────┴────────┴────────────┘

                                           [← Anterior] [Siguiente →]
```

**Comportamiento:**
- Clic en código → copia al portapapeles + toast "Código copiado"
- Menú de 3 puntos [⋮] → "Regenerar todos los códigos" (con confirmación)
- Solo mostrar secciones de planes que estén configurados en el producto
- Historial paginado (5 por página)
- Link "Ver perfil" lleva a `/dashboard/alumnos/:id`

### 3. Componente CodigoCard

```tsx
function CodigoCard({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const displayCode = `${code.slice(0, 3)}-${code.slice(3)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayCode);
    setCopied(true);
    toast.success('Código copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'flex items-center gap-2 px-4 py-3 rounded-lg border-2 transition-all',
        'hover:border-primary hover:bg-primary/5',
        copied ? 'border-green-500 bg-green-50' : 'border-border'
      )}
    >
      <span className="font-mono text-lg font-semibold tracking-wider">
        {displayCode}
      </span>
      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}
```

---

## UI del Alumno

### 1. Agregar botón en Dashboard del Alumno

En `/mi-cuenta`, agregar botón en el header:

```tsx
<Button asChild>
  <Link to="/activar-codigo">
    <Sparkles className="h-4 w-4 mr-2" />
    Activar con código
  </Link>
</Button>
```

### 2. Página Activar Código (`/activar-codigo`)

**3 pasos:**

**Paso 1 - Ingresar código:**
```
┌──────────────────────────────────────┐
│         ✨ Activar con código        │
│                                      │
│   Ingresa el código que te           │
│   compartió tu profesor              │
│                                      │
│   ┌────────────────────────┐         │
│   │       A3X-9K2          │         │
│   └────────────────────────┘         │
│                                      │
│        [Validar código]              │
│            [Volver]                  │
└──────────────────────────────────────┘
```

**Paso 2 - Confirmar producto:**
```
┌──────────────────────────────────────┐
│         ✅ ¡Código válido!           │
│                                      │
│   ┌────────────────────────────┐     │
│   │ 📚 Curso Trading Avanzado  │     │
│   │                            │     │
│   │ Tipo: Curso                │     │
│   │ Plan: Pago único           │     │
│   │ Acceso: ♾️ Permanente      │     │
│   └────────────────────────────┘     │
│                                      │
│        [Activar acceso]              │
│       [Usar otro código]             │
└──────────────────────────────────────┘
```

**Paso 3 - Éxito:**
```
┌──────────────────────────────────────┐
│           🎉 ¡Listo!                 │
│                                      │
│   Ya tienes acceso a:                │
│   Curso Trading Avanzado             │
│   Acceso permanente                  │
│                                      │
│          [Ir al curso]               │
└──────────────────────────────────────┘
```

**Comportamiento del input:**
- Auto-formato: insertar guión después del 3er carácter
- Convertir a mayúsculas automáticamente
- Solo permitir caracteres válidos

```tsx
const handleCodeChange = (e) => {
  let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (value.length > 3) {
    value = value.slice(0, 3) + '-' + value.slice(3, 6);
  }
  setCode(value);
};
```

---

## Hooks de React Query

### useMagicCodes

```tsx
export function useMagicCodes(productId: string) {
  return useQuery({
    queryKey: ['magic-codes', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('magic_codes')
        .select('id, code, payment_type, amount')
        .eq('product_id', productId)
        .eq('status', 'available')
        .order('payment_type')
        .order('created_at');

      if (error) throw error;

      return {
        one_time: data.filter(c => c.payment_type === 'one_time'),
        monthly: data.filter(c => c.payment_type === 'monthly'),
        yearly: data.filter(c => c.payment_type === 'yearly'),
      };
    },
  });
}
```

### useMagicCodesHistory

```tsx
export function useMagicCodesHistory(productId: string, page: number, limit = 5) {
  return useQuery({
    queryKey: ['magic-codes-history', productId, page],
    queryFn: async () => {
      const offset = (page - 1) * limit;

      const { data, count, error } = await supabase
        .from('magic_codes')
        .select('code, payment_type, amount, used_at, used_by_user_id, profiles!used_by_user_id(name, email)', { count: 'exact' })
        .eq('product_id', productId)
        .eq('status', 'used')
        .order('used_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        data: data.map(item => ({
          code: item.code,
          payment_type: item.payment_type,
          amount: item.amount,
          used_at: item.used_at,
          student: {
            id: item.used_by_user_id,
            name: item.profiles?.name || 'Sin nombre',
            email: item.profiles?.email || '',
          },
        })),
        pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
      };
    },
  });
}
```

### useActivateMagicCode

```tsx
export function useActivateMagicCode() {
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('use_magic_code', {
        p_code: code,
        p_user_id: user.id,
      });
      if (error) throw error;
      return data;
    },
  });
}
```

---

## Archivos a Crear

```
src/
├── pages/
│   ├── dashboard/
│   │   └── ProfesorCodigosMagicos.tsx   ← NUEVA
│   └── alumno/
│       └── ActivarCodigo.tsx            ← NUEVA
├── components/
│   └── codigos-magicos/
│       ├── CodigoCard.tsx               ← NUEVA
│       ├── CodigosPool.tsx              ← NUEVA
│       └── CodigosHistorial.tsx         ← NUEVA
└── hooks/
    ├── useMagicCodes.ts                 ← NUEVA
    ├── useMagicCodesHistory.ts          ← NUEVA
    └── useActivateMagicCode.ts          ← NUEVA
```

## Archivos a Modificar

```
src/
├── pages/
│   ├── dashboard/
│   │   ├── ProfesorCursos.tsx           ← Agregar botón "Códigos Mágicos"
│   │   └── ProfesorEbooks.tsx           ← Agregar botón "Códigos Mágicos"
│   └── alumno/
│       └── AlumnoDashboard.tsx          ← Agregar botón "Activar con código"
└── App.tsx                              ← Agregar rutas nuevas
```

---

## Orden de Implementación

1. **Base de datos:** Crear tabla `magic_codes` y funciones SQL
2. **Hooks:** Crear los 3 hooks de React Query
3. **Componentes:** CodigoCard, CodigosPool, CodigosHistorial
4. **Página profesor:** ProfesorCodigosMagicos.tsx
5. **Página alumno:** ActivarCodigo.tsx
6. **Integración:** Agregar botones y rutas

---

*— Fin del prompt —*