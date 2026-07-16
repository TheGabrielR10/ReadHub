// Configuración de items de navegación del dashboard
import type { LucideIcon } from "lucide-react";
import { Home, Upload } from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { label: "Inicio", href: "/", icon: Home },
  { label: "Cargar Artículo", href: "/upload", icon: Upload },
];
