import { defineConfig, mergeConfig } from "vitest/config";

// Ruta relativa (no el specifier de paquete "@readhub/config/vitest.shared"):
// ver el comentario en packages/config/vitest.shared.ts.
import { sharedVitestConfig } from "../config/vitest.shared";

export default mergeConfig(defineConfig(sharedVitestConfig), defineConfig({}));
