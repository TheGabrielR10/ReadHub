// Validaciones puras (sin dependencias de React ni Supabase) para los
// formularios de autenticación. Devuelven un mapa campo -> mensaje de error;
// un objeto vacío significa que la validación pasó.

export interface LoginFields {
  email: string;
  password: string;
}

export interface RegisterFields {
  email: string;
  birthDate: string;
  phone: string;
  password: string;
}

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "El correo electrónico es obligatorio.";
  if (!EMAIL_REGEX.test(email)) return "Ingresa un correo electrónico válido.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "La contraseña es obligatoria.";
  if (password.length < 8)
    return "La contraseña debe tener al menos 8 caracteres.";
  return null;
}

export function validateBirthDate(birthDate: string): string | null {
  if (!birthDate.trim()) return "La fecha de nacimiento es obligatoria.";
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime()))
    return "Ingresa una fecha de nacimiento válida.";
  if (date > new Date())
    return "La fecha de nacimiento no puede ser futura.";
  return null;
}

export function validatePhone(phone: string): string | null {
  if (!phone.trim()) return "El número celular es obligatorio.";
  if (!/^[0-9+\s()-]{7,15}$/.test(phone.trim()))
    return "Ingresa un número celular válido.";
  return null;
}

export function validateLoginFields(
  fields: LoginFields
): FieldErrors<LoginFields> {
  const errors: FieldErrors<LoginFields> = {};
  const emailError = validateEmail(fields.email);
  if (emailError) errors.email = emailError;
  if (!fields.password) errors.password = "La contraseña es obligatoria.";
  return errors;
}

export function validateRegisterFields(
  fields: RegisterFields
): FieldErrors<RegisterFields> {
  const errors: FieldErrors<RegisterFields> = {};
  const emailError = validateEmail(fields.email);
  if (emailError) errors.email = emailError;
  const birthDateError = validateBirthDate(fields.birthDate);
  if (birthDateError) errors.birthDate = birthDateError;
  const phoneError = validatePhone(fields.phone);
  if (phoneError) errors.phone = phoneError;
  const passwordError = validatePassword(fields.password);
  if (passwordError) errors.password = passwordError;
  return errors;
}
