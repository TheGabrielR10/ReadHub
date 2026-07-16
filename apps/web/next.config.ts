import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

// Reporte visual del bundle (Sesión 7, pipeline de performance). Solo se activa
// con ANALYZE=true (paso dedicado del workflow de CI); no afecta el build normal.
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  // Solo importa los íconos de lucide-react realmente usados en cada módulo,
  // en vez del paquete completo (Sesión 7, auditoría de performance).
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  // Paquetes TS del monorepo que Next debe transpilar (se consumen como fuente).
  transpilePackages: [
    "@readhub/types",
    "@readhub/shared",
    "@readhub/database",
    "@readhub/ai",
  ],
  // Transformers.js usa onnxruntime-node (binario nativo). Se marca como externo
  // del servidor para que el bundler no intente empaquetarlo (Sesión 4, RAG).
  serverExternalPackages: ["@huggingface/transformers"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
