import { defineConfig, mergeConfig } from "vitest/config";

// Ruta relativa (no el specifier de paquete "@readhub/config/vitest.shared"):
// ver el comentario en packages/config/vitest.shared.ts.
import { sharedVitestConfig } from "./packages/config/vitest.shared";

// Config raíz — conveniencia para `npm run test:watch` (observa TODO el
// monorepo a la vez durante desarrollo local). La ejecución "real" en CI y
// vía `turbo run test` usa el vitest.config.ts propio de cada paquete, que
// permite a Turborepo cachear y paralelizar por paquete.
//
// Playwright vive en apps/web/e2e/ y se excluye explícitamente: Vitest nunca
// debe recoger specs de Playwright (y viceversa).
export default mergeConfig(
  defineConfig(sharedVitestConfig),
  defineConfig({
    test: {
      include: [
        "packages/**/*.{test,spec}.ts",
        "apps/web/**/*.{test,spec}.{ts,tsx}",
      ],
      exclude: [
        "**/node_modules/**",
        "**/.next/**",
        "**/dist/**",
        "apps/web/e2e/**",
      ],
    },
  })
);
