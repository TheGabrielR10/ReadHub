import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

// Utilidad reutilizable: confirma que el usuario terminó en /login (p. ej.
// tras cerrar sesión, o al intentar acceder a una ruta protegida sin sesión).
// Centralizada para no repetir la aserción en cada spec futuro.
export async function expectRedirectedToLogin(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("button", { name: "Iniciar Sesión" })).toBeVisible();
}
