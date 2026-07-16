// Backfill de embeddings (Sesión 4, RAG).
//
// Genera el embedding de los artículos YA existentes (creados antes de activar
// la indexación automática). Ejecutar UNA vez, después de aplicar las migraciones
// de pgvector (supabase/rag_apply.sql) y con las dependencias instaladas:
//
//   node scripts/backfill-embeddings.mjs
//
// Reutiliza la misma estrategia que services/embedding.service.ts + indexing.service.ts,
// pero de forma autocontenida (script de mantenimiento, no parte del runtime).
// Usa la service_role key para escribir en article_embeddings saltando la RLS.

import { readFileSync } from "node:fs";
import { pipeline } from "@huggingface/transformers";
import { createClient } from "@supabase/supabase-js";

const EMBEDDING_MODEL = "Supabase/gte-small";
const EMBEDDING_DIMENSIONS = 384;

// --- Cargar .env.local ---
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// --- Pipeline de embeddings (local) ---
console.log("Cargando modelo de embeddings (primera vez descarga ~120 MB)…");
const extractor = await pipeline("feature-extraction", EMBEDDING_MODEL);

async function embed(text) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const out = await extractor(normalized, { pooling: "mean", normalize: true });
  const vector = Array.from(out.data);
  if (vector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(`Dimensión inesperada: ${vector.length}`);
  }
  return vector;
}

async function fetchDocText(documentPath) {
  if (!documentPath?.toLowerCase().endsWith(".txt")) return null;
  try {
    const { data, error } = await supabase.storage
      .from("article-documents")
      .download(documentPath);
    if (error || !data) return null;
    return (await data.text()).slice(0, 8000);
  } catch {
    return null;
  }
}

// --- Backfill ---
const { data: articles, error } = await supabase
  .from("articles")
  .select("id, title, summary, document_path");

if (error) {
  console.error("Error al leer artículos:", error.message);
  process.exit(1);
}

console.log(`Indexando ${articles.length} artículos…`);
let ok = 0;
for (const article of articles) {
  try {
    const docText = await fetchDocText(article.document_path);
    const content = [article.title, article.summary, docText]
      .map((p) => p?.trim())
      .filter(Boolean)
      .join("\n\n");
    const embedding = await embed(content);

    const { error: upsertError } = await supabase.from("article_embeddings").upsert(
      {
        article_id: article.id,
        content,
        embedding: JSON.stringify(embedding),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "article_id" }
    );
    if (upsertError) throw upsertError;

    ok++;
    console.log(`  ✓ ${article.title}`);
  } catch (err) {
    console.log(`  ✗ ${article.title} — ${err.message}`);
  }
}

console.log(`\nListo: ${ok}/${articles.length} artículos indexados.`);
