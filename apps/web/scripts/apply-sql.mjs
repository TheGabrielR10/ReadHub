// Aplica un archivo .sql a Postgres (Supabase) usando una cadena de conexión.
// Uso:  $env:DATABASE_URL='postgresql://...';  node scripts/apply-sql.mjs <archivo.sql>
//
// Utilidad de mantenimiento (no parte del runtime). Lee la cadena de conexión de
// la variable de entorno DATABASE_URL para no dejarla escrita en disco.

import { readFileSync } from "node:fs";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
const file = process.argv[2];

if (!connectionString) {
  console.error("Falta la variable de entorno DATABASE_URL.");
  process.exit(1);
}
if (!file) {
  console.error("Uso: node scripts/apply-sql.mjs <archivo.sql>");
  process.exit(1);
}

const sql = readFileSync(file, "utf8");

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }, // Supabase exige TLS
});

try {
  await client.connect();
  await client.query(sql);
  console.log(`✓ Aplicado correctamente: ${file}`);
} catch (err) {
  console.error(`✗ Error al aplicar ${file}:`, err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
