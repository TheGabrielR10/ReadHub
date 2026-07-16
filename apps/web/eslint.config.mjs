import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // next-env.d.ts es autogenerado por Next.js (usa triple-slash reference,
    // que la regla de TS marca como error). No debe editarse ni lintarse.
    ignores: [".next/**", "node_modules/**", "supabase/**", "next-env.d.ts"],
  },
];

export default eslintConfig;
