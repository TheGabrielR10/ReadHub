import { describe, expect, it } from "vitest";

import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  ALLOWED_IMAGE_EXTENSIONS,
  MAX_DOCUMENT_SIZE,
  MAX_IMAGE_SIZE,
  validateArticleEdit,
  validateArticleForm,
  validateDocument,
  validateImage,
  validateTitle,
} from "./article";

function makeFile(name: string, type: string, size: number): File {
  const content = size > 0 ? new Uint8Array(size) : new Uint8Array(0);
  return new File([content], name, { type });
}

describe("validateTitle", () => {
  it("rechaza un título vacío", () => {
    expect(validateTitle("")).not.toBeNull();
  });

  it("rechaza un título compuesto solo por espacios", () => {
    expect(validateTitle("   ")).not.toBeNull();
  });

  it("acepta un título con contenido", () => {
    expect(validateTitle("Mi primer artículo")).toBeNull();
  });
});

describe("validateDocument", () => {
  it("es opcional: null no produce error", () => {
    expect(validateDocument(null)).toBeNull();
  });

  it.each(ALLOWED_DOCUMENT_EXTENSIONS)("acepta la extensión %s", (ext) => {
    const file = makeFile(`documento${ext}`, "application/octet-stream", 1024);
    expect(validateDocument(file)).toBeNull();
  });

  it("acepta por MIME aunque la extensión no coincida con la allowlist", () => {
    const file = makeFile("documento.raro", "application/pdf", 1024);
    expect(validateDocument(file)).toBeNull();
  });

  it("rechaza un formato no permitido (ni extensión ni MIME)", () => {
    const file = makeFile("imagen.png", "image/png", 1024);
    expect(validateDocument(file)).toMatch(/TXT, DOCX o PDF/);
  });

  it("rechaza un archivo vacío", () => {
    const file = makeFile("documento.txt", "text/plain", 0);
    expect(validateDocument(file)).toMatch(/vacío/);
  });

  it("rechaza un archivo que excede el tamaño máximo", () => {
    const file = makeFile("documento.txt", "text/plain", MAX_DOCUMENT_SIZE + 1);
    expect(validateDocument(file)).toMatch(/tamaño máximo/);
  });

  it("acepta un archivo justo en el límite de tamaño", () => {
    const file = makeFile("documento.txt", "text/plain", MAX_DOCUMENT_SIZE);
    expect(validateDocument(file)).toBeNull();
  });
});

describe("validateImage", () => {
  it("es obligatoria: null produce error", () => {
    expect(validateImage(null)).toMatch(/imagen de portada/);
  });

  it.each(ALLOWED_IMAGE_EXTENSIONS)("acepta la extensión %s", (ext) => {
    const file = makeFile(`portada${ext}`, "application/octet-stream", 1024);
    expect(validateImage(file)).toBeNull();
  });

  it("rechaza un formato no permitido", () => {
    const file = makeFile("portada.pdf", "application/pdf", 1024);
    expect(validateImage(file)).toMatch(/JPG, PNG, WEBP o GIF/);
  });

  it("rechaza una imagen vacía", () => {
    const file = makeFile("portada.jpg", "image/jpeg", 0);
    expect(validateImage(file)).toMatch(/vacía/);
  });

  it("rechaza una imagen que excede el tamaño máximo", () => {
    const file = makeFile("portada.jpg", "image/jpeg", MAX_IMAGE_SIZE + 1);
    expect(validateImage(file)).toMatch(/tamaño máximo/);
  });
});

describe("validateArticleForm", () => {
  const validImage = () => makeFile("portada.jpg", "image/jpeg", 1024);

  it("no produce errores con contenido de texto (sin documento)", () => {
    const errors = validateArticleForm({
      title: "Título",
      content: "Contenido del artículo",
      document: null,
      image: validImage(),
    });
    expect(errors).toEqual({});
  });

  it("no produce errores con documento adjunto (sin contenido de texto)", () => {
    const errors = validateArticleForm({
      title: "Título",
      content: "",
      document: makeFile("doc.txt", "text/plain", 100),
      image: validImage(),
    });
    expect(errors).toEqual({});
  });

  it("exige contenido O documento: sin ninguno de los dos, produce error en 'content'", () => {
    const errors = validateArticleForm({
      title: "Título",
      content: "   ",
      document: null,
      image: validImage(),
    });
    expect(errors.content).toMatch(/contenido del artículo o adjunta/);
  });

  it("acumula errores de varios campos a la vez", () => {
    const errors = validateArticleForm({
      title: "",
      content: "",
      document: null,
      image: null,
    });
    expect(errors.title).toBeDefined();
    expect(errors.content).toBeDefined();
    expect(errors.image).toBeDefined();
    // "document" es opcional: su ausencia sola no genera error propio.
    expect(errors.document).toBeUndefined();
  });
});

describe("validateArticleEdit", () => {
  it("no produce errores con título y contenido válidos", () => {
    expect(validateArticleEdit({ title: "Título", content: "Contenido" })).toEqual({});
  });

  it("exige contenido no vacío (a diferencia del formulario de publicación, aquí no hay documento)", () => {
    const errors = validateArticleEdit({ title: "Título", content: "  " });
    expect(errors.content).toMatch(/no puede estar vacío/);
  });

  it("exige título no vacío", () => {
    const errors = validateArticleEdit({ title: "", content: "Contenido" });
    expect(errors.title).toBeDefined();
  });
});
