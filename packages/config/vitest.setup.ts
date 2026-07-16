import { vi } from "vitest";

// "server-only" lanza un error si se importa fuera de una condición de
// resolución "react-server" (la que usan los Server Components de Next.js).
// Bajo Vitest no existe tal condición activa, así que se neutraliza como
// no-op para todos los tests — igual de efectivo que resolver la condición
// real, pero sin depender de los detalles internos (frágiles entre versiones)
// de cómo Vite externaliza/inlinea dependencias de node_modules.
vi.mock("server-only", () => ({}));
