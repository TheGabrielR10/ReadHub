import { expect, test } from "@playwright/test";

import { assertTestUserConfigured, testUser } from "./fixtures/users";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { expectRedirectedToLogin } from "./utils/navigation";

// E2E del flujo principal de autenticación de ReadHub (Sesión 6, Prompt 5).
// Simula el comportamiento real de un usuario: no se modifica la app, no se
// desactiva ninguna validación ni se crean atajos artificiales — todo pasa
// por la UI real, exactamente como lo haría una persona.
test.describe("Flujo de autenticación", () => {
  test.beforeAll(() => {
    assertTestUserConfigured();
  });

  test("login exitoso, carga del dashboard, navegación disponible y logout", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page, testUser.email);

    // 1-2. Abrir la aplicación y llegar a Login (una ruta protegida sin
    // sesión redirige aquí — comportamiento real, no forzado por el test).
    await page.goto("/");
    await expectRedirectedToLogin(page);

    // 3-4. Ingresar credenciales válidas y autenticarse.
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);

    // 5-7. Redirección al Dashboard, información del usuario cargada, y
    // navegación principal (Inicio / Cargar Artículo) disponible.
    await dashboardPage.expectLoaded();

    // 8. Cerrar sesión.
    await dashboardPage.logout();

    // 9. Comprobar el regreso al Login.
    await expectRedirectedToLogin(page);

    // Refuerzo del Flujo 9 (spec de ReadHub): tras cerrar sesión, la ruta
    // protegida deja de ser accesible directamente por URL (ni con "Atrás").
    await page.goto("/");
    await expectRedirectedToLogin(page);
  });

  test("credenciales inválidas permanecen en Login mostrando un error", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login(testUser.email, "contraseña-incorrecta-a-propósito");

    // Permanece en /login (Flujo 3 del spec): no redirige, y el correo
    // ingresado sigue visible (solo la contraseña se limpia por seguridad).
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(loginPage.emailInput).toHaveValue(testUser.email);
  });
});
