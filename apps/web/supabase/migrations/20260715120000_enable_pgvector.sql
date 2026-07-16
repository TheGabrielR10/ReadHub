-- Sesión 4 (RAG) — Infraestructura vectorial, fase 1: habilitar pgvector.
-- Extensión oficial de Supabase para almacenar y consultar vectores (embeddings).
-- Se instala en el esquema "extensions" (convención de Supabase) para no
-- contaminar "public". Migración nueva: no altera ninguna migración previa.
create extension if not exists vector with schema extensions;
