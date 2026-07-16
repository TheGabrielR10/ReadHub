// Tools de análisis avanzado (Sesión 5, Fase 7). Reutilizan analysisService de
// @readhub/ai (búsqueda vectorial + context-builder + completado), sin duplicar
// lógica. Convierten ReadHub en una base de conocimiento consultable por LLMs.

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { analysisService } from "@readhub/ai/analysis.service";
import { getContext } from "../context";

const asText = (text: string) => ({ content: [{ type: "text" as const, text }] });
const asJson = (data: unknown) => asText(JSON.stringify(data, null, 2));

export function registerAnalysisTools(server: McpServer): void {
  server.registerTool(
    "comparar_articulos",
    {
      title: "Comparar artículos",
      description:
        "Compara dos o más artículos de ReadHub (por sus IDs): similitudes, diferencias y posibles contradicciones.",
      inputSchema: {
        ids: z.array(z.string()).min(2).describe("IDs (UUID) de los artículos a comparar"),
      },
    },
    async ({ ids }) => {
      const { supabase } = getContext();
      return asText(await analysisService.compareArticles(supabase, ids));
    }
  );

  server.registerTool(
    "extraer_temas",
    {
      title: "Extraer temas principales",
      description:
        "Identifica los temas principales transversales a los artículos relevantes para una consulta.",
      inputSchema: {
        consulta: z.string().describe("Tema o consulta a analizar"),
        limite: z.number().int().min(1).max(20).optional().describe("Artículos a considerar (por defecto 8)"),
      },
    },
    async ({ consulta, limite }) => {
      const { supabase } = getContext();
      return asText(await analysisService.extractTopics(supabase, consulta, limite ?? 8));
    }
  );

  server.registerTool(
    "resumen_global",
    {
      title: "Resumen global",
      description:
        "Redacta un resumen global que sintetiza lo que dicen en conjunto los artículos relevantes para un tema, con fuentes citadas.",
      inputSchema: {
        consulta: z.string().describe("Tema a resumir"),
        limite: z.number().int().min(1).max(20).optional().describe("Artículos a considerar (por defecto 8)"),
      },
    },
    async ({ consulta, limite }) => {
      const { supabase } = getContext();
      const { summary, sources } = await analysisService.globalSummary(supabase, consulta, limite ?? 8);
      const fuentes = sources.length
        ? "\n\nFuentes:\n" + sources.map((s) => `[${s.rank}] ${s.title}`).join("\n")
        : "";
      return asText(`${summary}${fuentes}`);
    }
  );

  server.registerTool(
    "documentos_relacionados",
    {
      title: "Documentos relacionados",
      description:
        "Encuentra los artículos de ReadHub semánticamente más relacionados con un artículo dado (por su ID).",
      inputSchema: {
        id: z.string().describe("ID (UUID) del artículo de referencia"),
        limite: z.number().int().min(1).max(20).optional().describe("Nº de relacionados (por defecto 5)"),
      },
    },
    async ({ id, limite }) => {
      const { supabase } = getContext();
      return asJson(await analysisService.relatedDocuments(supabase, id, limite ?? 5));
    }
  );

  server.registerTool(
    "contexto_investigacion",
    {
      title: "Construir contexto de investigación",
      description:
        "Recupera y estructura el contexto (prompt + fuentes) más relevante de ReadHub para investigar una consulta. No genera respuesta: prepara el material.",
      inputSchema: {
        consulta: z.string().describe("Consulta de investigación"),
        limite: z.number().int().min(1).max(20).optional().describe("Documentos a incluir (por defecto 5)"),
      },
    },
    async ({ consulta, limite }) => {
      const { supabase } = getContext();
      return asJson(await analysisService.buildResearchContext(supabase, consulta, limite ?? 5));
    }
  );
}
