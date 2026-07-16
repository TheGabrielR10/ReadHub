import { describe, expect, it } from "vitest";

import {
  validateBirthDate,
  validateEmail,
  validateLoginFields,
  validatePassword,
  validatePhone,
  validateRegisterFields,
} from "./auth";

describe("validateEmail", () => {
  it("rechaza un correo vacío", () => {
    expect(validateEmail("")).toMatch(/obligatorio/);
  });

  it("rechaza un correo sin arroba", () => {
    expect(validateEmail("usuario.example.com")).toMatch(/válido/);
  });

  it("rechaza un correo sin dominio", () => {
    expect(validateEmail("usuario@")).toMatch(/válido/);
  });

  it("acepta un correo válido", () => {
    expect(validateEmail("usuario@example.com")).toBeNull();
  });
});

describe("validatePassword", () => {
  it("rechaza una contraseña vacía", () => {
    expect(validatePassword("")).toMatch(/obligatoria/);
  });

  it("rechaza una contraseña de menos de 8 caracteres", () => {
    expect(validatePassword("abc123")).toMatch(/al menos 8/);
  });

  it("acepta una contraseña de exactamente 8 caracteres", () => {
    expect(validatePassword("abcd1234")).toBeNull();
  });
});

describe("validateBirthDate", () => {
  it("rechaza una fecha vacía", () => {
    expect(validateBirthDate("")).toMatch(/obligatoria/);
  });

  it("rechaza una fecha con formato inválido", () => {
    expect(validateBirthDate("no-es-una-fecha")).toMatch(/válida/);
  });

  it("rechaza una fecha futura", () => {
    const futureYear = new Date().getFullYear() + 5;
    expect(validateBirthDate(`${futureYear}-01-01`)).toMatch(/no puede ser futura/);
  });

  it("acepta una fecha pasada válida", () => {
    expect(validateBirthDate("2000-01-15")).toBeNull();
  });
});

describe("validatePhone", () => {
  it("rechaza un teléfono vacío", () => {
    expect(validatePhone("")).toMatch(/obligatorio/);
  });

  it("rechaza un teléfono demasiado corto", () => {
    expect(validatePhone("123")).toMatch(/válido/);
  });

  it("rechaza un teléfono con letras", () => {
    expect(validatePhone("abcdefghij")).toMatch(/válido/);
  });

  it("acepta un teléfono con formato numérico simple", () => {
    expect(validatePhone("3001234567")).toBeNull();
  });

  it("acepta un teléfono con separadores comunes (dentro del límite de 15 caracteres)", () => {
    expect(validatePhone("+573001234567")).toBeNull();
  });

  it("rechaza un teléfono con separadores que supere los 15 caracteres permitidos", () => {
    // "+57 (300) 123-4567" son 18 caracteres: formato válido, pero excede el límite.
    expect(validatePhone("+57 (300) 123-4567")).toMatch(/válido/);
  });
});

describe("validateLoginFields", () => {
  it("no produce errores con credenciales válidas", () => {
    expect(
      validateLoginFields({ email: "usuario@example.com", password: "cualquier-cosa" })
    ).toEqual({});
  });

  it("reporta ambos campos cuando faltan", () => {
    const errors = validateLoginFields({ email: "", password: "" });
    expect(errors.email).toBeDefined();
    expect(errors.password).toBeDefined();
  });
});

describe("validateRegisterFields", () => {
  it("no produce errores con datos válidos", () => {
    const errors = validateRegisterFields({
      email: "usuario@example.com",
      birthDate: "2000-01-15",
      phone: "3001234567",
      password: "abcd1234",
    });
    expect(errors).toEqual({});
  });

  it("acumula errores de todos los campos inválidos a la vez", () => {
    const errors = validateRegisterFields({
      email: "invalido",
      birthDate: "",
      phone: "1",
      password: "123",
    });
    expect(errors.email).toBeDefined();
    expect(errors.birthDate).toBeDefined();
    expect(errors.phone).toBeDefined();
    expect(errors.password).toBeDefined();
  });
});
