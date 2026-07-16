import { AlertTriangle, type LucideIcon } from "lucide-react";

import { cn } from "@readhub/shared/utils";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: LucideIcon;
  title?: React.ReactNode;
  message?: React.ReactNode;
  retryLabel?: string;
  onRetry?: () => void;
}

function ErrorState({
  className,
  icon: Icon = AlertTriangle,
  title = "Ocurrió un error",
  message = "No fue posible completar la operación. Inténtalo de nuevo.",
  retryLabel = "Reintentar",
  onRetry,
  children,
  ...props
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-md border border-destructive/20 bg-destructive/5 px-6 py-16 text-center",
        className
      )}
      {...props}
    >
      <Icon className="h-10 w-10 text-destructive" />
      <div className="space-y-1">
        <h3 className="text-lg font-display font-bold text-foreground">
          {title}
        </h3>
        {message && (
          <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
        )}
      </div>
      {onRetry && (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
      {children}
    </div>
  );
}

export { ErrorState };
