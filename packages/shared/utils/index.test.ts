import { describe, expect, it } from "vitest";

import { cn, formatDate } from "./index";

describe("cn", () => {
  it("concatena clases simples", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("ignora valores falsy (condicionales típicos de className)", () => {
    expect(cn("a", false && "b", null, undefined, "c")).toBe("a c");
  });

  it("resuelve conflictos de Tailwind quedándose con la última clase (tailwind-merge)", () => {
    // Caso real de uso: un componente base con "p-4" sobrescrito por el caller.
    expect(cn("p-4", "p-2")).toBe("p-2");
  });
});

describe("formatDate", () => {
  it("formatea una fecha ISO incluyendo día, mes y año", () => {
    // Mediodía UTC evita que el desfase de zona horaria del entorno de
    // ejecución (local o CI) empuje la fecha al día anterior/siguiente.
    const result = formatDate("2026-07-15T12:00:00.000Z");
    expect(result).toContain("2026");
    expect(result).toMatch(/^\d{1,2}\s\S+\.?\s2026$/);
  });

  it("usa el mismo formato para fechas de distintos meses", () => {
    const result = formatDate("2026-01-01T12:00:00.000Z");
    expect(result).toContain("2026");
    expect(result).toMatch(/^1\s/);
  });
});
