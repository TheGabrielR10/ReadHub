// Traduce los errores de Supabase Auth (en inglés) a mensajes claros en
// español para el usuario final, sin exponer detalles internos del servidor
// (requisito de Seguridad de la especificación).

import { AuthError } from "@supabase/supabase-js";

export function mapAuthError(error: unknown, fallback: string): string {
  if (error instanceof AuthError) {
    switch (error.code) {
      case "invalid_credentials":
        return "Correo o contraseña incorrectos.";
      case "email_not_confirmed":
        return "Debes confirmar tu correo antes de iniciar sesión.";
      case "user_already_exists":
      case "email_exists":
        return "Este correo electrónico ya se encuentra registrado.";
      case "weak_password":
        return "La contraseña es demasiado débil. Usa al menos 8 caracteres.";
      case "over_email_send_rate_limit":
      case "over_request_rate_limit":
        return "Demasiados intentos. Intenta de nuevo en unos minutos.";
      case "validation_failed":
        return "Los datos ingresados no son válidos. Revísalos e intenta de nuevo.";
      default:
        break;
    }

    // Coincidencias por mensaje para versiones que no exponen `code`.
    const message = error.message.toLowerCase();
    if (message.includes("invalid login credentials"))
      return "Correo o contraseña incorrectos.";
    if (message.includes("already registered") || message.includes("already exists"))
      return "Este correo electrónico ya se encuentra registrado.";
    if (message.includes("email not confirmed"))
      return "Debes confirmar tu correo antes de iniciar sesión.";
  }

  return fallback;
}
