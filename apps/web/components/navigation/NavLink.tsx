"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@readhub/shared/utils";
import type { NavItem } from "@/components/navigation/navItems";

export interface NavLinkProps extends NavItem {
  onNavigate?: () => void;
  className?: string;
}

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLink({
  label,
  href,
  icon: Icon,
  onNavigate,
  className,
}: NavLinkProps) {
  const pathname = usePathname();
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium transition-colors duration-base",
        "hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}
