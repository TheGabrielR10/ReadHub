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
