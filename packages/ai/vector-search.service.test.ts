import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@readhub/types/database";

// Se mockea el proveedor de embeddings para no depender de Transformers.js
// (modelo real, descarga, ~140s de carga) — igual que exige el laboratorio.
vi.mock("@readhub/ai/embedding.service", () => ({
  embeddingService: {
    generateEmbedding: vi.fn(),
  },
}));

import { embeddingService } from "@readhub/ai/embedding.service";
import {
  DEFAULT_MATCH_COUNT,
  DEFAULT_MATCH_THRESHOLD,
  vectorSearchService,
} from "./vector-search.service";

type Client = SupabaseClient<Database>;

const mockGenerateEmbedding = vi.mocked(embeddingService.generateEmbedding);

function makeClient(rpcImpl: (...args: unknown[]) => unknown): Client {
  return { rpc: vi.fn(rpcImpl) } as unknown as Client;
}

beforeEach(() => {
  mockGenerateEmbedding.mockReset();
});

describe("vectorSearchService.search", () => {
  it("devuelve [] sin llamar a Supabase ni generar embedding para una consulta vacía", async () => {
    const client = makeClient(() => {
      throw new Error("no debería llamarse");
    });

    const result = await vectorSearchService.search(client, "   ");

    expect(result).toEqual([]);
    expect(mockGenerateEmbedding).not.toHaveBeenCalled();
  });

  it("genera el embedding de la consulta normalizada y consulta la función RPC con los defaults", async () => {
    mockGenerateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
    let capturedArgs: unknown;
    const client = makeClient((_fn, args) => {
      capturedArgs = args;
      return { data: [], error: null };
    });

    await vectorSearchService.search(client, "  ¿qué es ReadHub?  ");

    expect(mockGenerateEmbedding).toHaveBeenCalledWith("¿qué es ReadHub?");
    expect(capturedArgs).toEqual({
      query_embedding: JSON.stringify([0.1, 0.2, 0.3]),
      match_threshold: DEFAULT_MATCH_THRESHOLD,
      match_count: DEFAULT_MATCH_COUNT,
    });
  });

  it("respeta matchCount/matchThreshold cuando se pasan explícitamente", async () => {
    mockGenerateEmbedding.mockResolvedValue([0.1]);
    let capturedArgs: unknown;
    const client = makeClient((_fn, args) => {
      capturedArgs = args;
      return { data: [], error: null };
    });

    await vectorSearchService.search(client, "consulta", {
      matchCount: 10,
      matchThreshold: 0.5,
    });

    expect(capturedArgs).toMatchObject({ match_threshold: 0.5, match_count: 10 });
  });

  it("mapea las filas devueltas al formato RetrievedArticle", async () => {
    mockGenerateEmbedding.mockResolvedValue([0.1]);
    const client = makeClient(() => ({
      data: [
        {
          article_id: "abc",
          title: "Título",
          summary: "Resumen",
          content: "Contenido",
          similarity: 0.87,
        },
      ],
      error: null,
    }));

    const result = await vectorSearchService.search(client, "consulta");

    expect(result).toEqual([
      {
        articleId: "abc",
        title: "Título",
        summary: "Resumen",
        content: "Contenido",
        similarity: 0.87,
      },
    ]);
  });

  it("devuelve [] cuando la RPC no reporta error pero data es null", async () => {
    mockGenerateEmbedding.mockResolvedValue([0.1]);
    const client = makeClient(() => ({ data: null, error: null }));

    expect(await vectorSearchService.search(client, "consulta")).toEqual([]);
  });

  it("propaga el error cuando la RPC de Supabase falla", async () => {
    mockGenerateEmbedding.mockResolvedValue([0.1]);
    const dbError = new Error("relation does not exist");
    const client = makeClient(() => ({ data: null, error: dbError }));

    await expect(vectorSearchService.search(client, "consulta")).rejects.toThrow(
      "relation does not exist"
    );
  });
});
