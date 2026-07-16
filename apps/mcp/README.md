# @readhub/mcp — Servidor MCP de ReadHub

Servidor [MCP](https://modelcontextprotocol.io) que expone las capacidades de ReadHub
(búsqueda, RAG, artículos) a clientes como Claude Desktop. Reutiliza los servicios
del monorepo (`@readhub/database`, `@readhub/ai`) sin duplicar lógica.

## Ejecutar (desarrollo)

Desde la raíz del monorepo:

```bash
npm run start --workspace @readhub/mcp
```

El servidor usa transporte **STDIO**. Los logs van a stderr; stdout es el canal JSON-RPC.

> Nota técnica: se arranca con `tsx --conditions=react-server` para que el paquete
> `server-only` (usado por los servicios de IA para protegerse en el cliente web)
> resuelva a un no-op en Node en vez de lanzar un error.

## Variables de entorno

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` (o `SUPABASE_URL`) | Proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` (o `SUPABASE_ANON_KEY`) | Lectura pública (respeta RLS) |
| `ANTHROPIC_API_KEY` | Requerida por la tool `responder_rag` (Claude) |

Los embeddings se generan **en local** (Transformers.js), sin API key.

## Configuración en Claude Desktop

En `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "readhub": {
      "command": "npx",
      "args": ["tsx", "--conditions=react-server", "<RUTA_ABSOLUTA>/apps/mcp/src/index.ts"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "https://<ref>.supabase.co",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY": "<anon-key>",
        "ANTHROPIC_API_KEY": "<clave-claude>"
      }
    }
  }
}
```

## Tools disponibles (Fase 4)

| Tool | Descripción |
| --- | --- |
| `listar_articulos` | Lista los artículos públicos |
| `obtener_articulo` | Detalle de un artículo por ID |
| `buscar_articulos` | Búsqueda por texto (título/resumen) |
| `buscar_semantica` | Búsqueda semántica (embeddings + pgvector) |
| `responder_rag` | Responde con RAG usando solo el conocimiento de ReadHub |

Resources (Fase 5), Prompts (Fase 6) y Tools avanzadas (Fase 7) se añaden en fases posteriores.
