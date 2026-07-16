import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
