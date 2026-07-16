import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

// Page Object del dashboard autenticado (Flujo 4 del spec de ReadHub):
// barra de navegación, correo del usuario y cierre de sesión.
export class DashboardPage {
  readonly page: Page;
  readonly userEmail: Locator;
  readonly logoutButton: Locator;
  readonly homeNavLink: Locator;
  readonly uploadNavLink: Locator;

  constructor(page: Page, email: string) {
    this.page = page;
    // El correo aparece dos veces en el DOM (nav de escritorio + panel del
    // menú móvil, siempre montado): se acota al que esté realmente visible
    // en el viewport actual, en vez de asumir un orden de DOM particular.
    this.userEmail = page.getByText(email, { exact: true }).and(page.locator(":visible"));
    // Mismo caso que userEmail: MobileMenu también renderiza su propio
    // LogoutButton (siempre montado, oculto vía "md:hidden" en su contenedor).
    this.logoutButton = page
      .getByRole("button", { name: "Cerrar sesión" })
      .and(page.locator(":visible"));
    this.homeNavLink = page.getByRole("link", { name: "Inicio" });
    this.uploadNavLink = page.getByRole("link", { name: "Cargar Artículo" });
  }

  // Verifica que la sesión cargó correctamente: el usuario, la navegación
  // principal disponible, y que efectivamente estamos fuera de /login.
  async expectLoaded(): Promise<void> {
    // El login habla con Supabase Auth real por red (signInWithPassword +
    // router.refresh() re-verificando la sesión en el servidor); el timeout
    // por defecto de 5s puede no alcanzar según la latencia real del entorno.
    await expect(this.page).toHaveURL("/", { timeout: 15_000 });
    await expect(this.userEmail).toBeVisible();
    await expect(this.homeNavLink).toBeVisible();
    await expect(this.uploadNavLink).toBeVisible();
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
  }
}
