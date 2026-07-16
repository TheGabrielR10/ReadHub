"use client";

// Client Component: renderiza los iconos de la navegación (funciones de Lucide)
// que no pueden cruzar la frontera Server -> Client como props. Recibe `user`
// (objeto plano serializable) desde el layout del dashboard (Server Component).

import Link from "next/link";
import { BookOpen } from "lucide-react";

import {
  Navbar,
  NavbarContainer,
  NavbarBrand,
  NavbarContent,
  NavbarMenu,
} from "@/components/layout/Navbar";
import { NavLink } from "@/components/navigation/NavLink";
import { LogoutButton } from "@/components/navigation/LogoutButton";
import { MobileMenu } from "@/components/navigation/MobileMenu";
import { navItems } from "@/components/navigation/navItems";
import { Separator } from "@/components/ui/separator";
import type { CurrentUser } from "@readhub/types/user";

export interface AppNavbarProps {
  user: CurrentUser;
}

export function AppNavbar({ user }: AppNavbarProps) {
  return (
    <Navbar>
      <NavbarContainer>
        <NavbarBrand>
          <Link href="/" className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <span>ReadHub</span>
          </Link>
        </NavbarBrand>

        <NavbarContent>
          <NavbarMenu>
            {navItems.map((item) => (
              <li key={item.href}>
                <NavLink {...item} />
              </li>
            ))}
          </NavbarMenu>

          <div className="hidden md:flex items-center gap-4">
            <Separator orientation="vertical" className="h-6" />
            <span className="max-w-[160px] truncate text-sm font-medium text-foreground">
              {user.email}
            </span>
            <LogoutButton />
          </div>

          <MobileMenu user={user} />
        </NavbarContent>
      </NavbarContainer>
    </Navbar>
  );
}
