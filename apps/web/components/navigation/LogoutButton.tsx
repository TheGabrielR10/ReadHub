"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export interface LogoutButtonProps extends Omit<ButtonProps, "onClick"> {
  showLabel?: boolean;
}

export function LogoutButton({
  showLabel = true,
  variant = "ghost",
  size = "sm",
  ...props
}: LogoutButtonProps) {
  const router = useRouter();
  const { logout, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      // La sesión se invalida en el cliente; el middleware protege el resto.
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleLogout}
      disabled={loading}
      aria-label="Cerrar sesión"
      {...props}
    >
      <LogOut className="h-4 w-4" />
      {showLabel && <span>{loading ? "Cerrando..." : "Cerrar Sesión"}</span>}
    </Button>
  );
}
