// Datos de prueba para el flujo de autenticación (Sesión 6, Prompt 5).
//
// Las credenciales NUNCA se hornean en el código: este repositorio es
// público. Se leen de variables de entorno — en desarrollo local desde
// apps/web/.env.e2e (gitignored, ver .env.e2e.example), y en CI desde
// GitHub Secrets con el mismo nombre.

export const testUser = {
  email: process.env.E2E_USER_EMAIL ?? "",
  password: process.env.E2E_USER_PASSWORD ?? "",
};

// Falla rápido con un mensaje claro en vez de dejar que el test tropiece más
// adelante con un "credenciales inválidas" confuso cuando en realidad faltó
// configurar el entorno.
export function assertTestUserConfigured(): void {
  if (!testUser.email || !testUser.password) {
    throw new Error(
      "Faltan las credenciales de prueba E2E. Define E2E_USER_EMAIL y " +
        "E2E_USER_PASSWORD en apps/web/.env.e2e (desarrollo local) o como " +
        "GitHub Secrets (CI)."
    );
  }
}
