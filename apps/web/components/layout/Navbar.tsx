"use client";

import { cn } from "@readhub/shared/utils";

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  sticky?: boolean;
}

export const Navbar = ({
  className,
  sticky = true,
  ...props
}: NavbarProps) => {
  return (
    <nav
      className={cn(
        "bg-card border-b border-border shadow-sm transition-all duration-base",
        // "sticky" (no "static") ya funciona como contenedor de posicionamiento
        // para el panel "absolute" del menú móvil. twMerge trata "relative" y
        // "sticky" como la misma utilidad en conflicto (ambas son `position`),
        // así que solo se agrega "relative" cuando NO hay sticky, para no
        // perder el contenedor de posicionamiento en ese caso.
        sticky ? "sticky top-0 z-50" : "relative",
        className
      )}
      {...props}
    />
  );
};

export const NavbarContainer = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "mx-auto flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8 max-w-7xl",
        className
      )}
      {...props}
    />
  );
};

export const NavbarBrand = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 font-display text-xl font-bold text-foreground",
        className
      )}
      {...props}
    />
  );
};

export const NavbarContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "flex items-center gap-4 sm:gap-6",
        className
      )}
      {...props}
    />
  );
};

export const NavbarMenu = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLUListElement>) => {
  return (
    <ul
      className={cn(
        "hidden md:flex items-center gap-2",
        className
      )}
      {...props}
    />
  );
};

export const NavbarMenuItem = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLLIElement>) => {
  return (
    <li
      className={cn(
        "text-sm font-medium transition-colors duration-base",
        className
      )}
      {...props}
    />
  );
};
