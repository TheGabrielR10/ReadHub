"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

import { cn } from "@readhub/shared/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { navItems } from "@/components/navigation/navItems";
import { NavLink } from "@/components/navigation/NavLink";
import { LogoutButton } from "@/components/navigation/LogoutButton";
import type { CurrentUser } from "@readhub/types/user";

export interface MobileMenuProps {
  user: CurrentUser;
}

export function MobileMenu({ user }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={isOpen}
        aria-controls="mobile-menu-panel"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      <div
        id="mobile-menu-panel"
        className={cn(
          // "absolute top-full" ancla el panel exactamente al borde inferior
          // del <nav> (que ahora es "relative"), sin depender de un alto de
          // navbar fijo/adivinado — se ajusta solo si el navbar cambia de alto.
          "absolute inset-x-0 top-full z-40 origin-top border-b border-border bg-card shadow-lg transition-all duration-base ease-smooth",
          isOpen
            ? "opacity-100 scale-y-100 pointer-events-auto"
            : "opacity-0 scale-y-95 pointer-events-none"
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              onNavigate={() => setIsOpen(false)}
              className="w-full"
            />
          ))}
        </nav>

        <Separator />

        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <span className="truncate text-sm font-medium text-foreground">
            {user.email}
          </span>
          <LogoutButton size="sm" />
        </div>
      </div>
    </div>
  );
}
