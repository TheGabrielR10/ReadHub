import { describe, expect, it } from "vitest";

import { NO_COVERAGE_SIGNAL, type RetrievedArticle } from "@readhub/types/rag";

import { contextBuilderService } from "./context-builder.service";

function article(overrides: Partial<RetrievedArticle> = {}): RetrievedArticle {
  return {
    articleId: "id-1",
    title: "Artículo de prueba",
    summary: "Resumen",
    content: "Contenido del artículo de prueba.",
    similarity: 0.8,
    ...overrides,
  };
}

describe("contextBuilderService.build", () => {
  it("marca hasContext=false y no genera fuentes cuando no hay documentos recuperados", () => {
    const built = contextBuilderService.build("¿de qué tratan los artículos?", []);
    expect(built.hasContext).toBe(false);
    expect(built.sources).toEqual([]);
    expect(built.userPrompt).toContain("No hay artículos de contexto disponibles");
  });

  it("descarta documentos por debajo del umbral de similitud", () => {
    const built = contextBuilderService.build(
      "consulta",
      [article({ similarity: 0.1 })],
      { minSimilarity: 0.3 }
    );
    expect(built.hasContext).toBe(false);
  });

  it("construye contexto con documentos que superan el umbral, citándolos con su ranking", () => {
    const built = contextBuilderService.build("consulta", [
      article({ articleId: "a1", title: "Primero", similarity: 0.9 }),
      article({ articleId: "a2", title: "Segundo", similarity: 0.5 }),
    ]);

    expect(built.hasContext).toBe(true);
    expect(built.sources).toHaveLength(2);
    expect(built.sources[0]).toMatchObject({ articleId: "a1", rank: 1, title: "Primero" });
    expect(built.sources[1]).toMatchObject({ articleId: "a2", rank: 2, title: "Segundo" });
    expect(built.userPrompt).toContain("[1] Título: Primero");
    expect(built.userPrompt).toContain("[2] Título: Segundo");
    expect(built.userPrompt).toContain("consulta");
  });

  it("respeta el límite maxDocuments aunque haya más resultados relevantes", () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      article({ articleId: `a${i}`, title: `Doc ${i}`, similarity: 0.9 })
    );
    const built = contextBuilderService.build("consulta", many, { maxDocuments: 2 });
    expect(built.sources).toHaveLength(2);
  });

  it("recorta el contenido de un documento que excede maxCharsPerDocument", () => {
    const longContent = "x".repeat(500);
    const built = contextBuilderService.build(
      "consulta",
      [article({ content: longContent })],
      { maxCharsPerDocument: 50 }
    );
    // clip() añade "…" al final del texto recortado.
    expect(built.userPrompt).toContain("…");
    expect(built.userPrompt.length).toBeLessThan(longContent.length);
  });

  it("incluye un fragmento recortado del documento que agota el presupuesto, y excluye los siguientes", () => {
    const built = contextBuilderService.build(
      "consulta",
      [
        article({ articleId: "a1", content: "x".repeat(80) }),
        article({ articleId: "a2", content: "y".repeat(80) }),
        article({ articleId: "a3", content: "z".repeat(80) }),
      ],
      { maxContextChars: 100, maxCharsPerDocument: 80 }
    );
    // a1 entra completo (80 de 100). a2 entra pero recortado a los 20 que quedan
    // de presupuesto (+ el "…" de clip()), lo que agota el presupuesto. a3 nunca
    // se procesa: el corte ocurre después de incluir el fragmento de a2.
    expect(built.sources.map((s) => s.articleId)).toEqual(["a1", "a2"]);
    expect(built.userPrompt).toContain("…");
  });

  it("incluye la señal de sin-cobertura en el system prompt para que el LLM la use", () => {
    const built = contextBuilderService.build("consulta", [article()]);
    expect(built.systemPrompt).toContain(NO_COVERAGE_SIGNAL);
  });
});
