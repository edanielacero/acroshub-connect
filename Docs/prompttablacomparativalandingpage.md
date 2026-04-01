# PROMPT: Comparativa Skool vs Hotmart vs Acroshub

## Objetivo

Crear una sección de comparativa para la landing page que demuestre por qué Acroshub es la mejor opción. Incluye una calculadora interactiva y una tabla comparativa.

---

## Datos de la Competencia

### Skool
| Plan | Precio | Comisión |
|---|---|---|
| Hobby | $9/mes | **10%** por venta |
| Pro | $99/mes | **2.9%** por venta |

- Sin Custom URL en plan Hobby
- Sin Afiliados en plan Hobby
- Plataforma en inglés

### Hotmart
| Plan | Precio | Comisión |
|---|---|---|
| Gratis | $0 | **9.9% + $0.50** por venta |

- Fee de retiro: $1.99
- Sin cuota mensual, pero comisión alta

### Acroshub
| Plan | Comisión |
|---|---|
| Todos | **0%** |

- Precios configurables desde el panel de Super Admin
- Plan Pro sugerido: $39/mes

---

## Sección de Comparativa

### Header
```
Título: "¿Por qué pagar comisiones?"
Subtítulo: "Mientras otros te cobran hasta el 10% de cada venta, 
           en Acroshub te quedas con el 100%."
```

### Tabs
Dos opciones que el usuario puede alternar:
1. **💰 Calculadora de ahorro** (activa por defecto)
2. **📊 Comparar características**

---

## Tab 1: Calculadora de Ahorro

### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ¿Cuánto vendes al mes?                         │
│                                                                     │
│                          $2,000                                     │
│                                                                     │
│  $100 ───────────────●─────────────────────────────────── $10,000  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ SKOOL HOBBY  │ │  SKOOL PRO   │ │   HOTMART    │ │  ACROSHUB ⭐ │
│              │ │              │ │              │ │              │
│ 10% comisión │ │ 2.9% comisión│ │9.9% + $0.50  │ │ 0% comisión  │
│              │ │              │ │              │ │              │
│    $209      │ │    $157      │ │    $218      │ │    $39       │
│              │ │              │ │              │ │              │
│ ████████████ │ │ █████████    │ │ █████████████│ │ ██           │
│ (barra roja) │ │(barra naranja│ │(barra amarilla│ │(barra verde) │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    (Fondo verde degradado)                          │
│                                                                     │
│   Ahorras cada mes      Ahorras al año       Te quedas con         │
│       $179                 $2,148                100%               │
│                                              de tus ventas          │
└─────────────────────────────────────────────────────────────────────┘

                    [ Empieza gratis ahora → ]
         Sin tarjeta de crédito · Sin compromiso
```

### Comportamiento

- **Slider:** Rango de $100 a $10,000
- **Cálculos en tiempo real:**
  - Skool Hobby: $9 + (ventas × 10%)
  - Skool Pro: $99 + (ventas × 2.9%)
  - Hotmart: (ventas × 9.9%) + ($0.50 × transacciones estimadas)
  - Acroshub: precio fijo del plan Pro (de la BD)
- **Barras de progreso:** Proporcionales al costo más alto
- **Colores:**
  - Skool Hobby: Rojo
  - Skool Pro: Naranja
  - Hotmart: Amarillo
  - Acroshub: Verde (destacado con borde/ring)

---

## Tab 2: Tabla Comparativa

### Layout

```
                    │ Skool     │ Skool    │           │
                    │ Hobby     │ Pro      │ Hotmart   │ Acroshub ⭐
────────────────────┼───────────┼──────────┼───────────┼─────────────
PRECIOS             │           │          │           │
────────────────────┼───────────┼──────────┼───────────┼─────────────
Precio mensual      │ $9        │ $99      │ $0        │ $39
Comisión por venta  │ 10% ❌    │ 2.9% ❌  │ 9.9%+$0.50❌│ 0% ✅
Fee de retiro       │ $0        │ $0       │ $1.99 ❌  │ $0 ✅
────────────────────┼───────────┼──────────┼───────────┼─────────────
CARACTERÍSTICAS     │           │          │           │
────────────────────┼───────────┼──────────┼───────────┼─────────────
Cursos ilimitados   │ ✅        │ ✅       │ ✅        │ ✅
Alumnos ilimitados  │ ✅        │ ✅       │ ✅        │ ✅
Dominio propio      │ ❌        │ ✅       │ ✅        │ ✅
Códigos mágicos     │ ❌        │ ❌       │ ❌        │ ✅ EXCLUSIVO
Afiliados           │ ❌        │ ✅       │ ✅        │ Próximamente
Comunidad           │ ✅        │ ✅       │ ❌        │ Próximamente
────────────────────┼───────────┼──────────┼───────────┼─────────────
EXPERIENCIA         │           │          │           │
────────────────────┼───────────┼──────────┼───────────┼─────────────
En español          │ ❌        │ ❌       │ ✅        │ ✅
Soporte en español  │ ❌        │ ❌       │ ✅        │ ✅
Pensado para Latam  │ ❌        │ ❌       │ ✅        │ ✅
Pagos manuales      │ ❌        │ ❌       │ ❌        │ ✅ EXCLUSIVO
(efectivo, cripto)  │           │          │           │
```

### Estilos visuales

- **Columna Acroshub:** Fondo verde suave, borde destacado, badge "Recomendado"
- **Valores negativos (comisiones):** Texto rojo
- **Valores positivos de Acroshub:** Texto verde bold
- **Badge "EXCLUSIVO":** Para features únicas (Códigos mágicos, Pagos manuales)
- **"Próximamente":** Texto gris, muestra honestidad

---

## Banner Final (después de la tabla)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    (Fondo verde degradado)                          │
│                                                                     │
│              ¿Por qué elegir Acroshub?                              │
│                                                                     │
│   Precio fijo, sin comisiones, en español, con soporte real.       │
│   Tu dinero es tuyo, no nuestro.                                   │
│                                                                     │
│   [💰 0% comisión] [🇪🇸 100% español] [📱 Códigos mágicos] [💵 Pagos manuales]
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Datos Dinámicos

Los precios de Acroshub deben venir de la base de datos, configurables por el Super Admin:

**Tabla sugerida:** `platform_pricing`
- `plan_key` (freemium, creador, pro)
- `name`
- `price_monthly`
- `price_yearly`
- `is_highlighted` (para marcar cuál es el "recomendado")

El Super Admin puede editar estos precios desde `/admin/precios` y se reflejan automáticamente en la landing.

---

## Resumen de Impacto

El objetivo es que el usuario vea claramente:

1. **"Las comisiones te están costando más de lo que crees"** → Calculadora
2. **"Acroshub tiene todo lo que necesitas"** → Tabla
3. **"Tu dinero es tuyo"** → Mensaje final

---

*— Fin del prompt —*