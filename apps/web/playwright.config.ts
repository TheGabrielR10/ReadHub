import fs from "node:fs";
import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

// Carga credenciales de prueba desde .env.e2e (gitignored) para desarrollo
// local — Playwright, a diferencia de Next.js, no lee .env.* automáticamente.
// En CI las mismas variables llegan ya inyectadas como GitHub Secrets, por lo
// que NO se sobrescribe nada que ya esté definido en el entorno.
function loadLocalEnvFile(filename: string): void {
  const filePath = path.resolve(__dirname, filename);
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadLocalEnvFile(".env.e2e");

// Configuración de Playwright (Sesión 6, Prompt 4). Infraestructura E2E
// únicamente — todavía no hay specs (llegan en el Prompt 5).
//
// Decisiones:
//   * testDir "./e2e": separado por completo de Vitest (packages/**/*.test.ts),
//     igual que definimos en el plan de testing del Prompt 1.
//   * webServer: arranca la app automáticamente (local y en CI) contra el build
//     de producción — más fiel al comportamiento real que el modo dev, y evita
//     depender de que alguien deje `npm run dev` corriendo a mano.
//   * reuseExistingServer solo fuera de CI: en el runner de GitHub Actions
//     siempre debe arrancar un servidor limpio; en local, si ya tienes uno
//     corriendo (p. ej. para depurar), Playwright lo reutiliza.
//   * screenshot/video "only-on-failure" / "retain-on-failure": evidencia
//     exactamente donde falló, sin generar artefactos pesados en las pruebas
//     que sí pasan.
//   * reporter: "html" para inspección local + "list" para logs legibles en
//     la terminal/CI; el pipeline (Prompt 6) publicará el reporte HTML como
//     artefacto cuando haya fallos.
const PORT = 3000;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // No arranca un servidor propio si ya se apunta a uno externo (p. ej. una
  // URL de Vercel) vía PLAYWRIGHT_BASE_URL.
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run start",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
