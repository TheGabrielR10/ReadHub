import type { UserConfig } from "vitest/config";

// Base compartida de Vitest para todos los paquetes del monorepo (Sesión 6,
// Prompt 2). Cada paquete la importa y fusiona con su propio `include`, en vez
// de repetir estas opciones en cada vitest.config.ts.
//
//   * environment "node": la lógica priorizada para testear (validators,
//     services, context-builder, vector-search, utils) no toca el DOM.
//   * setupFiles neutraliza "server-only": varios servicios de @readhub/ai (y
//     supabase/admin.ts) importan ese paquete, que LANZA un error si se
//     importa fuera de la condición de resolución "react-server" (la que usan
//     los Server Components de Next.js). Bajo Vitest esa condición no está
//     activa — se intentó resolver vía `resolve.conditions`/`noExternal`, pero
//     Vite sigue externalizando el paquete y cargándolo por require() nativo
//     de Node, que ignora esas opciones. La solución robusta es mockearlo
//     directamente (ver vitest.setup.ts): mismo resultado (no-op), sin
//     depender de esos detalles internos de Vite.
//   * passWithNoTests: un paquete sin pruebas todavía (p. ej. @readhub/types,
//     que solo tiene contratos) no debe hacer fallar `turbo run test`.
export const sharedVitestConfig: UserConfig = {
  test: {
    environment: "node",
    passWithNoTests: true,
    // Ruta relativa, NO el specifier de paquete "@readhub/config/vitest.setup":
    // Vite resuelve ese specifier a través de node_modules (aunque sea un
    // symlink de workspace) y lo externaliza, cargando el .ts con el loader
    // nativo de Node — que revienta con ERR_UNKNOWN_FILE_EXTENSION en Node 20
    // (CI). Una ruta relativa evita esa externalización por completo.
    setupFiles: ["../config/vitest.setup.ts"],
  },
};
