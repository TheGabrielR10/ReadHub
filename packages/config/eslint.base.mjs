// Configuración base de ESLint compartida en el monorepo (@readhub/config).
// Las apps/paquetes pueden extenderla. La app web mantiene además su propia
// config de Next (apps/web/eslint.config.mjs).
export default [
  {
    ignores: ["**/dist/**", "**/.next/**", "**/node_modules/**"],
  },
];
