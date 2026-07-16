import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

// Page Object de la pantalla de login (Flujo 1/3 del spec de ReadHub).
// Encapsula los selectores; los tests no deben conocer la estructura del DOM.
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // getByLabel: selector accesible, resiliente a cambios de estilos/clases.
    this.emailInput = page.getByLabel("Correo electrónico");
    // No usa getByLabel: "Contraseña" es substring de "Mostrar contraseña"
    // (el botón de mostrar/ocultar), y getByLabel matchea por substring —
    // resolvería a 2 elementos. Se acota por rol "textbox" para excluir el
    // botón (role="button"), que no participa de ese rol en absoluto.
    this.passwordInput = page.getByRole("textbox", { name: /Contraseña/i });
    this.submitButton = page.getByRole("button", { name: "Iniciar Sesión" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/login");
    await expect(this.emailInput).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}
