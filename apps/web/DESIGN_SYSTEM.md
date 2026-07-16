# ReadHub Design System

Un sistema visual moderno, minimalista e inspirado en plataformas de contenido como Medium, Dev.to y Hashnode.

## 🎨 Paleta de Colores

### Colores Primarios
- **Primary (Azul)**: `hsl(217 91% 60%)` - Color principal de acción
  - Usado en botones primarios, links, focus states
  - Variantes: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900

- **Accent (Ámbar/Naranja)**: `hsl(39 100% 57%)` - Highlights y acentos
  - Usado para botones accent, badges destacados
  - Variantes: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900

### Colores Neutrales
- **Foreground**: `hsl(210 8% 14%)` - Texto principal (light), `hsl(210 9% 95%)` (dark)
- **Background**: `hsl(0 0% 100%)` (light), `hsl(215 13% 9%)` (dark)
- **Muted**: `hsl(210 5% 85%)` - Elementos deshabilitados
- **Border**: `hsl(210 7% 92%)` - Bordes y separadores

### Colores Semánticos
- **Success (Verde)**: `hsl(142 71% 45%)`
- **Destructive (Rojo)**: `hsl(0 84% 60%)`
- **Warning (Ámbar)**: `hsl(38 92% 50%)`

## 🔤 Tipografía

### Font Stack
- **Display**: "Geist Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
  - Usado en: h1-h6, títulos de cards, navegación
- **Body**: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
  - Usado en: texto regular, párrafos, labels
- **Mono**: "Fira Code", "Courier New", monospace
  - Usado en: código, snippets

### Escalas de Tamaño
```
xs:    0.75rem  (12px)
sm:    0.875rem (14px)
base:  1rem     (16px)
lg:    1.125rem (18px)
xl:    1.25rem  (20px)
2xl:   1.5rem   (24px)
3xl:   1.875rem (30px)
4xl:   2.25rem  (36px)
5xl:   3rem     (48px)
6xl:   3.75rem  (60px)
```

### Estilos Predefinidos
- **h1-h6**: font-display, font-bold, tracking-tight, responsive
- **.text-caption**: text-xs, font-medium, uppercase, tracking-wider
- **.text-label**: text-sm, font-semibold
- **.text-body**: text-base, font-normal, leading-relaxed
- **.text-body-small**: text-sm, font-normal, text-muted-foreground

## 📏 Spacing

Basado en escala de 4px:
```
xs: 0.25rem (4px)
sm: 0.5rem  (8px)
md: 1rem    (16px)
lg: 1.5rem  (24px)
xl: 2rem    (32px)
2xl: 3rem   (48px)
```

## 🔷 Border Radius

- **lg**: 0.375rem (6px) - Cards, containers
- **md**: 0.5rem (8px) - Inputs, buttons
- **sm**: 0.25rem (4px) - Small elements

## 💫 Sombras

- **xs**: 0 1px 2px rgba(0,0,0,0.05)
- **sm**: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)
- **md**: 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)
- **lg**: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)
- **xl**: 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)

## 🎯 Componentes

### Button

**Variantes:**
- `default` - Azul sólido, primary action
- `secondary` - Gris suave, secondary action
- `outline` - Borde, low emphasis
- `ghost` - Sin fondo, minimal
- `accent` - Naranja, special action
- `destructive` - Rojo, danger action
- `link` - Solo texto underline

**Tamaños:**
- `sm` - 9px height, pequeños espacios
- `default` - 10px height, estándar
- `lg` - 11px height, importante
- `xl` - 12px height, muy importante
- `icon`, `icon-sm`, `icon-lg` - Botones de ícono

**Estados:**
- `hover` - Opacidad reducida
- `active` - Opacidad más reducida
- `focus` - Ring de 2px
- `disabled` - Opacidad 50%, cursor not-allowed

### Input

- **Height**: 40px
- **Padding**: 16px (4 sides)
- **Border**: 1px solid border
- **Radius**: 0.375rem (6px)
- **Shadow**: xs
- **Focus**: ring-2 ring-ring ring-offset-2

**Estados:**
- `hover` - Border más claro
- `focus` - Ring visible
- `disabled` - Opacidad 50%, background muted

### Card

- **Border**: 1px solid border
- **Radius**: 0.375rem (6px)
- **Shadow**: sm
- **Hover**: shadow-md (si es hover-able)
- **Padding**: 24px (6 default)

**Partes:**
- `CardHeader` - Con border-bottom, padding-bottom
- `CardTitle` - text-xl, font-bold
- `CardDescription` - text-sm, muted
- `CardContent` - Contenido principal
- `CardFooter` - Con border-top

### Badge

**Variantes:**
- `default` - Primary color con 10% opacity bg
- `secondary` - Secondary color
- `success` - Success color
- `destructive` - Destructive color
- `warning` - Warning color
- `outline` - Borde sin fondo
- `ghost` - Muted background

- **Padding**: 12px 12px (3 4)
- **Radius**: 9999px (fully rounded)
- **Size**: text-xs, font-semibold

### Navbar

- **Height**: 64px (py-4)
- **Border**: bottom border
- **Shadow**: sm
- **Sticky**: sticky top-0 z-50 (opcional)

**Componentes:**
- `NavbarContainer` - max-w-7xl, centered, responsive padding
- `NavbarBrand` - Logo y nombre
- `NavbarContent` - Acciones y menú
- `NavbarMenu` - Links (hidden on mobile)
- `NavbarMenuItem` - Items de menú

### MainLayout

**Estructura:**
```
<MainLayout>
  header={<Navbar />}
  sidebar={<Sidebar />}
  footer={<Footer />}
  children={<Content />}
</MainLayout>
```

- **Flex layout**: Min height 100vh
- **Dark-aware**: Respeta modo oscuro
- **Responsive**: Sidebar hidden on mobile

### ArticleCard

- **Hover effect**: scale-105 en imagen, shadow increase
- **Image**: height-48, aspect-square cover
- **Content**: padding-5, space-y-3
- **Meta**: flex, gap-4, text-xs, border-top

**Componentes:**
- `ArticleCardImage` - Imagen con hover effect
- `ArticleCardContent` - Wrapper principal
- `ArticleCardTitle` - Texto limitado a 2 líneas
- `ArticleCardDescription` - Resumen limitado a 2 líneas
- `ArticleCardMeta` - Autor, fecha, vistas, likes

### CommentList

- **Empty state**: Borde dashed, fondo muted, centered text
- **Items**: divide-y, space-y-4

### CommentItem

- **Layout**: flex gap-4
- **Avatar**: 40px rounded-full
- **Header**: Autor + fecha con justify-between
- **Actions**: flex gap-3 pt-2

### ArticleContent

**Tipografía:**
- Prose styling automático
- Links: primary color, underline
- Code: muted bg, accent text
- Blockquote: primary left border
- Imágenes: rounded-md, shadow-md

## ⚡ Transiciones

- **fast**: 150ms
- **base**: 200ms (default)
- **slow**: 300ms
- **Timing**: cubic-bezier(0.4, 0, 0.2, 1) (ease-smooth)

Aplicadas a:
- Colores de fondo (transition-colors)
- Transformaciones (transition-transform)
- Todo (transition-all) en cards y buttons

## 🌙 Dark Mode

Modo oscuro automático con CSS variables:
- Colores inversión automática
- Backgrounds oscuros (#1a1a1a base)
- Texto claro (95% white)
- Borders más sutiles en dark mode

Activar: `<html class="dark">`

## 📱 Responsive

- **Mobile-first** approach
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- **Padding**: 1rem (mobile), aumenta a 2rem (desktop)
- **Max-width**: 1280px (max-w-7xl)
- **Texto escalable**: responsive font-sizes en headings

## ✨ Mejores Prácticas

1. **Usa clases predefinidas** en lugar de tailwind classes sueltas
2. **Respetar hierarchy**: h1 > h2 > h3, etc.
3. **Spacing consistente**: Usa escalas, no valores arbitrarios
4. **Focus states**: Siempre incluir focus-visible para a11y
5. **Shadows sutiles**: No abusar, solo en cards y botones
6. **Colores semánticos**: Usa success/warning/destructive, no hardcoded
7. **Tipografía**: Display para headings, sans para body
8. **Dark mode**: Probar siempre en modo oscuro

## 🎭 Estados

### Hover
- Botones: opacidad reducida + shadow aumento
- Cards: shadow aumento + border más visible
- Links: color más visible + underline

### Focus
- Ring de 2px en color ring
- Offset de 2px
- Visible sin hover

### Disabled
- Opacidad 50%
- cursor-not-allowed
- Interacción bloqueada (pointer-events-none)

### Active
- Presionado visualmente
- Opacidad más reducida que hover
- Sin cambio de shadow

## 📦 Importar Componentes

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Navbar, NavbarContainer, NavbarBrand } from "@/components/layout/Navbar";
```

---

**Versión**: 1.0
**Última actualización**: 2026-07-03
**Inspiración**: Medium, Dev.to, Hashnode
