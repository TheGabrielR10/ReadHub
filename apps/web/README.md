# ReadHub

Infraestructura base de ReadHub: plataforma de lectura y escritura de artículos. Este repositorio contiene únicamente la capa de infraestructura (proyecto, configuración y base de datos); las funcionalidades de negocio y la interfaz se desarrollarán en sesiones posteriores.

## Stack

- Next.js 15 (App Router)
- React 19
- TypeScript
- TailwindCSS + Shadcn/UI
- Supabase (Auth, Storage, PostgreSQL)

## Estructura del proyecto

```
readhub/
├── app/                    # Rutas (App Router). Solo shell mínimo en esta etapa.
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   └── ui/                 # Primitivos Shadcn/UI (Button, Card, Input, Label).
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # Cliente Supabase para el navegador.
│   │   ├── server.ts       # Cliente Supabase para Server Components/Actions.
│   │   └── middleware.ts   # Refresco de sesión usado por middleware.ts.
│   ├── utils/               # Utilidades compartidas (cn, etc.).
│   ├── validators/          # Validaciones (se implementan en próximas etapas).
│   └── constants/           # Constantes compartidas (se implementan en próximas etapas).
│
├── types/
│   ├── article.ts
│   ├── user.ts
│   ├── comment.ts
│   └── database.ts         # Tipos alineados con el esquema SQL (types de Supabase).
│
├── supabase/
│   ├── migrations/         # Migraciones SQL (fuente ejecutable del esquema completo).
│   ├── schema.sql          # Esquema consolidado (referencia de lectura).
│   ├── policies.sql        # Políticas RLS consolidadas (referencia de lectura).
│   ├── seed.sql            # Datos de prueba.
│   └── validate_rls.sql    # Script de validación de las políticas RLS.
│
├── public/
├── middleware.ts            # Refresca la sesión de Supabase en cada request.
├── components.json          # Configuración de Shadcn/UI.
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

## Modelo relacional

- `profiles` — extiende `auth.users` en relación 1:1 (mismo UUID como PK/FK, `ON DELETE CASCADE`).
- `articles` — pertenece a un `profile` (`author_id`, `ON DELETE CASCADE`). `title` no puede estar vacío (`CHECK`).
- `views`, `likes`, `comments`, `favorites` — pertenecen a un `article` y a un `profile` (`user_id`), todas con `ON DELETE CASCADE` para evitar registros huérfanos.
  - `likes` tiene `UNIQUE (article_id, user_id)`: un usuario solo puede dar un "me gusta" por artículo.
  - `comments.comment` no puede estar vacío ni compuesto solo por espacios (`CHECK`).
- Un trigger (`on_auth_user_created`) crea automáticamente el `profile` correspondiente cuando Supabase Auth registra un usuario, leyendo `birth_date`, `phone` y `role` desde los metadatos del registro.

Índices: `articles.author_id`, `views.article_id`, `comments.article_id`, `favorites.article_id` (el índice de `likes.article_id` queda cubierto por el `UNIQUE (article_id, user_id)`).

El esquema completo está en `supabase/schema.sql` (referencia consolidada) y en `supabase/migrations/` (fuente ejecutable).

## Políticas RLS

Todas las tablas tienen RLS habilitado y políticas definidas en `supabase/policies.sql` (referencia consolidada) y en `supabase/migrations/` (fuente ejecutable):

| Tabla | SELECT | INSERT | UPDATE | DELETE |
| --- | --- | --- | --- | --- |
| `profiles` | solo el propio perfil | — (vía trigger `on_auth_user_created`) | solo el propio perfil | — |
| `articles` | públicos para todos; el autor ve también los suyos privados | autenticado, como autor de sí mismo | solo el autor | solo el autor |
| `comments` | todos | autenticado, como autor de sí mismo | solo el autor | autor o admin |
| `likes` | todos (necesario para mostrar el conteo) | autenticado, como propietario de sí mismo | — | solo el propietario |
| `views` | admin o autor del artículo | autenticado, como propietario de sí mismo | — | — |
| `favorites` | solo el propietario | autenticado, como propietario de sí mismo | — | solo el propietario |

`public.is_admin()` es una función auxiliar (`SECURITY DEFINER`) usada por las políticas de `comments` y `views` para comprobar el rol del usuario sin causar recursión de RLS.

## Datos de prueba

`supabase/seed.sql` puebla la base con 5 usuarios (1 `admin`, 2 `writer`, 2 `reader`), 4 artículos (3 públicos y 1 privado), comentarios, likes, visualizaciones y favoritos, respetando todas las restricciones y relaciones. Se ejecuta automáticamente después de las migraciones con `supabase db reset`.

Contraseña de todos los usuarios de prueba: `Password123!`

| Email | Rol |
| --- | --- |
| `admin@readhub.test` | admin |
| `writer1@readhub.test` | writer (autor de 2 artículos públicos) |
| `writer2@readhub.test` | writer (autor de 1 artículo público y 1 privado) |
| `reader1@readhub.test` | reader |
| `reader2@readhub.test` | reader |

El seed inserta directamente en `auth.users`/`auth.identities` (esquema estándar de Supabase Auth); los `profiles` correspondientes se crean automáticamente mediante el trigger `on_auth_user_created`, no se insertan a mano.

## Validación de las políticas RLS

`supabase/validate_rls.sql` es un script autocontenido que verifica el comportamiento de las políticas RLS de las 6 tablas cubriendo los 5 escenarios requeridos: usuario autenticado, usuario no autenticado, autor del recurso, usuario sin permisos y administrador (30 pruebas en total, por ejemplo: "¿puede un usuario dar like suplantando a otro?", "¿ve un lector las visualizaciones de un artículo ajeno?", "¿puede un admin borrar el comentario de cualquiera?").

Cómo ejecutarlo:

```bash
psql "<connection-string>" -f supabase/validate_rls.sql
```

O pegando el contenido en el SQL Editor de Supabase. El script crea sus propios usuarios y artículos de prueba, imprime `PASS`/`FAIL` por cada caso (con un resumen final) y termina con `ROLLBACK`, por lo que no deja ningún dato de prueba en la base ni interfiere con `seed.sql`.

## Autenticación

La autenticación se gestiona mediante Supabase Auth. `lib/supabase/client.ts` se usa en Client Components, `lib/supabase/server.ts` en Server Components/Actions, y `middleware.ts` refresca la sesión en cada request usando `lib/supabase/middleware.ts`. El acceso a los datos está protegido mediante Row Level Security (RLS) en todas las tablas (ver sección "Políticas RLS").

## Puesta en marcha

1. Copiar `.env.example` a `.env.local` y completar las variables con las credenciales del proyecto Supabase.
2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Aplicar las migraciones al proyecto Supabase vinculado:

   ```bash
   supabase link --project-ref <project-ref>
   supabase db push
   ```

   Para desarrollo local con datos de prueba (aplica migraciones y `seed.sql` sobre la base local):

   ```bash
   supabase db reset
   ```

4. Iniciar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

## Estado actual

Infraestructura base completa: inicialización del proyecto (Next.js, TypeScript, TailwindCSS, Shadcn/UI, clientes de Supabase, tipado centralizado), esquema SQL con sus migraciones (tablas, restricciones, índices e integración con `auth.users`), políticas RLS de las 6 tablas, `seed.sql` con datos de prueba y `validate_rls.sql` para verificar las políticas.

Este proyecto queda en su fase de infraestructura; el desarrollo de funcionalidades de negocio e interfaz de usuario corresponde a sesiones posteriores.

## Sistema RAG — Asistente inteligente (Sesión 4)

ReadHub incorpora un asistente conversacional que responde preguntas en lenguaje natural usando **únicamente** el conocimiento de los artículos publicados (Retrieval-Augmented Generation).

### Cómo funciona

```
Pregunta del usuario
  → embedding de la consulta (Transformers.js, local)
  → búsqueda por similitud (pgvector, función match_article_embeddings)
  → construcción del contexto + fuentes (context-builder)
  → generación de la respuesta (Claude, claude-opus-4-8)
  → respuesta con streaming + fuentes citadas
```

- **Embeddings**: se generan **en local** con [Transformers.js](https://huggingface.co/docs/transformers.js) y el modelo `Supabase/gte-small` (384 dimensiones). Sin API keys ni costo. Claude **no** genera embeddings; solo produce la respuesta final.
- **Almacenamiento vectorial**: extensión `pgvector` + tabla `article_embeddings` (1:1 con `articles`, `ON DELETE CASCADE`), índice **HNSW** con distancia coseno. La búsqueda respeta la RLS existente (solo artículos visibles) porque `match_article_embeddings` es `SECURITY INVOKER` y une contra `articles`.
- **Indexación automática**: al crear o editar un artículo se (re)genera su embedding server-side (`/api/v1/rag/index`, service_role). El borrado limpia el vector vía cascade.

### Arquitectura (respeta Components → Hooks → Services)

| Capa | Archivos |
| --- | --- |
| Services (servidor) | `embedding.service.ts`, `indexing.service.ts`, `vector-search.service.ts`, `context-builder.service.ts`, `chat.service.ts` |
| Services (cliente) | `indexing.client.ts` |
| Route Handlers | `app/api/v1/rag/index`, `app/api/v1/rag/chat` |
| Hooks | `useChat.ts` |
| Componentes | `components/chat/*` (widget flotante, mensajes, panel de fuentes) |
| BD | `supabase/migrations/2026071512000{0,1,2}_*.sql` |

La integración con Claude queda **totalmente encapsulada** en `chat.service.ts` (ningún otro módulo importa `@anthropic-ai/sdk`), y el proveedor de embeddings en `embedding.service.ts`, de modo que cualquiera puede sustituirse tocando un solo archivo.

### Puesta en marcha del RAG

1. Añade `ANTHROPIC_API_KEY` a `.env.local` (ver `.env.example`).
2. Aplica la infraestructura vectorial a Supabase: pega `supabase/rag_apply.sql` en el **SQL Editor**, o aplica las migraciones con la CLI.
3. (Solo la primera vez) indexa los artículos ya existentes:

   ```bash
   node scripts/backfill-embeddings.mjs
   ```

4. `npm run dev` → el asistente aparece como botón flotante en el dashboard.

> La primera generación de embeddings descarga el modelo (~120 MB) y queda cacheado.

## Testing y CI/CD (Sesión 6)

### Pruebas unitarias (Vitest)

Cada paquete (`packages/shared`, `packages/ai`, `packages/database`) corre sus propias pruebas con Vitest sobre una configuración compartida (`packages/config/vitest.shared.ts`). Desde la raíz del monorepo:

```bash
npm run test        # turbo run test — todos los paquetes
npm run test:watch  # modo watch
```

### Pruebas E2E (Playwright)

Cubren el flujo real de autenticación (login, dashboard, logout, protección de rutas) contra un build de producción real y Supabase real — sin mocks ni atajos.

```bash
cd apps/web
cp .env.e2e.example .env.e2e   # completar con un usuario de prueba real
npx playwright install --with-deps chromium
npm run build && npm run test:e2e
```

`.env.e2e` está en `.gitignore` (el repositorio es público): nunca debe commitearse. En CI, las mismas variables se inyectan como GitHub Secrets.

### GitHub Actions

`.github/workflows/ci.yml` corre en cada `pull_request` y en cada `push` a `main`, con tres jobs secuenciales (cada uno depende de que el anterior pase):

1. **Lint, build y pruebas unitarias** — lint → build (incluye chequeo de tipos) → Vitest.
2. **Pruebas E2E (Playwright)** — instala Chromium, build de producción, corre `auth.spec.ts` contra Supabase real; publica el reporte de Playwright como artefacto si falla.
3. **Bundle size + Lighthouse (Core Web Vitals)** (Sesión 7) — ver más abajo.

Ninguno de los tres jobs despliega nada — el deploy lo gestiona la integración nativa de Vercel con el repo (ver "Estado del deploy" en la sección de Sesión 7).

Secrets requeridos en **Settings → Secrets and variables → Actions**:

| Secret | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Build y runtime (cliente/servidor) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Build y runtime (cliente/servidor) |
| `SUPABASE_SERVICE_ROLE_KEY` | Runtime servidor (administración, validación RLS) |
| `ANTHROPIC_API_KEY` | Runtime servidor (asistente RAG) |
| `E2E_USER_EMAIL` | Usuario de prueba real para el login del E2E |
| `E2E_USER_PASSWORD` | Contraseña del usuario de prueba del E2E |

## Performance y pipeline de Core Web Vitals (Sesión 7)

### Optimizaciones aplicadas

A partir de una auditoría completa de performance (Core Web Vitals, RSC, bundle, imágenes, fuentes, caché, re-renderizados — ver el informe de la Sesión 7), se aplicaron únicamente las optimizaciones de bajo riesgo que no tocan lógica de negocio, el flujo RAG, APIs ni arquitectura:

- **Imágenes de artículos** (`ArticleImage`, `ArticleCardImage`) migradas de `<img>` crudo a `next/image` (`fill` + `sizes`): resize automático, formatos modernos y lazy loading nativo por viewport. Impacto esperado: mejora directa de LCP (la imagen del artículo es el elemento LCP más probable) y de CLS.
- **`ChatMessage` memoizado** (`React.memo`): el streaming del asistente RAG reemplaza el array completo de mensajes en cada token recibido; sin memo, cada burbuja ya renderizada se re-renderizaba en cada chunk. El reductor (`useChat.ts`) ya preserva la identidad de los mensajes no modificados, así que el memo es efectivo. Impacto esperado: menos jank/INP en respuestas largas del asistente.
- **`@huggingface/transformers` movido a `dependencies`** en `apps/web/package.json`: estaba en `devDependencies` pese a requerirse en runtime de producción (los 3 route handlers del RAG) — corrige un riesgo real de que el RAG se rompiera en un install de producción que omitiera dev deps.
- **`experimental.optimizePackageImports: ["lucide-react"]`** en `next.config.ts`: mejora marginal de tree-shaking (ya era efectivo vía imports nombrados, esto lo refuerza a nivel de build).

Optimizaciones identificadas en la auditoría pero **no aplicadas** (requieren decisiones de arquitectura o diseño fuera del alcance de "solo performance"): convertir las páginas del dashboard a Server Components, deduplicar el `useEffect` con guardia `mounted` repetido en 6 archivos, compartir una sola instancia de cliente de Supabase entre tarjetas de artículo, cargar realmente la fuente "Geist Display" referenciada en Tailwind, y reducir las llamadas redundantes a `auth.getUser()` entre el middleware y cada handler/layout (código sensible de autenticación — cambiarlo sin revisión dedicada es un riesgo que no vale la pena para una ganancia de performance).

### Pipeline extendido: bundle size + Lighthouse CI

El job **"Bundle size + Lighthouse (Core Web Vitals)"** se agregó a `.github/workflows/ci.yml` sin tocar ni reemplazar los jobs existentes; solo corre después de que lint/build/unit tests y E2E ya pasaron (evita gastar minutos de CI auditando código que de todas formas fallaría las validaciones funcionales):

1. **Build con análisis de bundle** (`ANALYZE=true npm run build`, `@next/bundle-analyzer` en `next.config.ts`, activo solo con esa variable): genera reportes HTML del bundle de cliente/edge, publicados como artefacto `bundle-analysis`.
2. **Lighthouse CI** (`lighthouserc.json`): levanta el servidor de producción y audita `/login` y `/register` (las únicas rutas sin autenticación — auditar el dashboard requeriría un flujo de login vía Puppeteer dentro de Lighthouse, fuera de alcance de este laboratorio). Bloquea el job (falla el pipeline) si no se cumplen los umbrales:

   | Métrica | Umbral |
   | --- | --- |
   | Performance score | ≥ 0.80 |
   | LCP | ≤ 2.5 s |
   | CLS | ≤ 0.1 |
   | Total Blocking Time | ≤ 300 ms |

   El reporte completo de Lighthouse se publica como artefacto `lighthouse-report` siempre, pase o falle.

Validado en un run real de GitHub Actions (Ubuntu), no simulado: los tres jobs (incluyendo este) pasaron en verde.

### Estado del deploy a Vercel

El deploy a producción sigue gestionado por la integración nativa de Vercel con el repo de GitHub (auto-deploy en cada push), **no** por este pipeline. Agregar un paso `vercel deploy --prod` gated por este workflow es el siguiente paso natural, pero requiere primero **desactivar el auto-deploy nativo de la rama `main` en Vercel** (Project Settings → Git) — de lo contrario ambos mecanismos desplegarían de forma independiente y el gate de CI no bloquearía nada realmente. Variables necesarias para ese paso futuro (Vercel CLI):

| Variable | Origen |
| --- | --- |
| `VERCEL_TOKEN` | Token personal, generado en vercel.com/account/tokens (pendiente de agregar) |
| `VERCEL_ORG_ID` | `.vercel/project.json` (no sensible) |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` (no sensible) |

### Buenas prácticas para mantener el rendimiento

- Cualquier imagen nueva que venga de Supabase Storage debe usar `next/image`, no `<img>`.
- Los componentes sin `useState`/`useEffect`/manejadores de eventos propios no necesitan `"use client"` — evalúa si pueden ser Server Components antes de agregar la directiva por defecto.
- Si se agrega un mensaje nuevo al streaming del chat (`useChat.ts`), mantener la invariante de que `patch()` no debe recrear objetos de mensajes no afectados (necesario para que `React.memo` en `ChatMessage` siga siendo efectivo).
- Antes de agregar una librería pesada, revisar si ya existe una alternativa nativa o una ya usada en el proyecto (ver hallazgo de bundle en la auditoría de Sesión 7).
- Cualquier cambio en `next.config.ts`/`lighthouserc.json` que relaje los umbrales de Lighthouse debe justificarse explícitamente en el PR — el gate existe para prevenir regresiones silenciosas de Core Web Vitals.
