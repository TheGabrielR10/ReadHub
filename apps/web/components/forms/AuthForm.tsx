"use client";

// Componente cliente que orquesta el flujo de autenticación (login + registro)
// con un toggle dinámico de modo, sin abandonar la página (Flujo 1/2 del spec).
// Toda la lógica de negocio vive en useAuth; aquí solo hay estado de UI y
// composición de los componentes de presentación.

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import {
  validateLoginFields,
  validateRegisterFields,
  type FieldErrors,
  type LoginFields,
  type RegisterFields,
} from "@readhub/shared/validators/auth";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { FormField } from "@/components/forms/FormField";
import {
  LoginForm,
  LoginFormContent,
} from "@/components/forms/LoginForm";
import {
  RegisterForm,
  RegisterFormContent,
} from "@/components/forms/RegisterForm";

type Mode = "login" | "register";

export interface AuthFormProps {
  initialMode?: Mode;
}

export function AuthForm({ initialMode = "login" }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const { login, register, loading, error, clearError } = useAuth();

  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    FieldErrors<LoginFields & RegisterFields>
  >({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cambio dinámico de modo sin recargar la página: conserva el correo,
  // descarta la contraseña por seguridad y limpia mensajes previos.
  function switchMode(next: Mode) {
    setMode(next);
    setPassword("");
    setFieldErrors({});
    setSuccessMessage(null);
    clearError();
  }

  function updateField(
    setter: (value: string) => void,
    key: keyof (LoginFields & RegisterFields)
  ) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setter(event.target.value);
      if (fieldErrors[key]) {
        setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
      }
      if (error) clearError();
    };
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);

    const errors = validateLoginFields({ email, password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await login(email, password);
      // Sesión creada: redirige al destino solicitado (o home) y refresca los
      // Server Components para que lean la nueva cookie de sesión.
      router.push(redirectTo);
      router.refresh();
    } catch {
      // El mensaje ya está en `error` (useAuth). Por seguridad se limpia la
      // contraseña; el correo permanece visible (Flujo 3).
      setPassword("");
    }
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);

    const errors = validateRegisterFields({ email, birthDate, phone, password });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const { hasSession } = await register(email, birthDate, phone, password);

      if (hasSession) {
        setSuccessMessage("¡Registro exitoso! Redirigiendo…");
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1200);
      } else {
        // Confirmación por email activada: no hay sesión todavía.
        setSuccessMessage(
          "¡Registro exitoso! Te enviamos un correo para confirmar tu cuenta. Inicia sesión una vez confirmada."
        );
        setMode("login");
        setPassword("");
        setFieldErrors({});
      }
    } catch {
      // El mensaje de error ya está en `error` (useAuth).
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
          {mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === "login"
            ? "Accede para explorar y publicar artículos."
            : "Regístrate para comenzar a publicar en ReadHub."}
        </p>
      </div>

      {successMessage && (
        <Alert variant="success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {mode === "login" ? (
        <LoginForm onSubmit={handleLogin} className="max-w-none">
          <LoginFormContent>
            <FormField
              label="Correo electrónico"
              htmlFor="email"
              required
              error={fieldErrors.email}
            >
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="tucorreo@email.com"
                value={email}
                onChange={updateField(setEmail, "email")}
                disabled={loading}
              />
            </FormField>

            <FormField
              label="Contraseña"
              htmlFor="password"
              required
              error={fieldErrors.password}
            >
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                placeholder="Tu contraseña"
                value={password}
                onChange={updateField(setPassword, "password")}
                disabled={loading}
              />
            </FormField>
          </LoginFormContent>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Iniciando sesión…" : "Iniciar Sesión"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ¿No tienes una cuenta?{" "}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 align-baseline"
              onClick={() => switchMode("register")}
              disabled={loading}
            >
              Registrarse
            </Button>
          </p>
        </LoginForm>
      ) : (
        <RegisterForm onSubmit={handleRegister} className="max-w-none">
          <RegisterFormContent>
            <FormField
              label="Correo electrónico"
              htmlFor="email"
              required
              error={fieldErrors.email}
            >
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="tucorreo@email.com"
                value={email}
                onChange={updateField(setEmail, "email")}
                disabled={loading}
              />
            </FormField>

            <FormField
              label="Fecha de nacimiento"
              htmlFor="birthDate"
              required
              error={fieldErrors.birthDate}
            >
              <Input
                id="birthDate"
                name="birthDate"
                type="date"
                autoComplete="bday"
                value={birthDate}
                onChange={updateField(setBirthDate, "birthDate")}
                disabled={loading}
              />
            </FormField>

            <FormField
              label="Número celular"
              htmlFor="phone"
              required
              error={fieldErrors.phone}
            >
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="3001234567"
                value={phone}
                onChange={updateField(setPhone, "phone")}
                disabled={loading}
              />
            </FormField>

            <FormField
              label="Contraseña"
              htmlFor="password"
              required
              error={fieldErrors.password}
              description="Mínimo 8 caracteres."
            >
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                placeholder="Crea una contraseña"
                value={password}
                onChange={updateField(setPassword, "password")}
                disabled={loading}
              />
            </FormField>
          </RegisterFormContent>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Registrando…" : "Registrarse"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            ¿Ya tienes una cuenta?{" "}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 align-baseline"
              onClick={() => switchMode("login")}
              disabled={loading}
            >
              Iniciar Sesión
            </Button>
          </p>
        </RegisterForm>
      )}
    </div>
  );
}
