import { Inbox, type LucideIcon } from "lucide-react";

import { cn } from "@readhub/shared/utils";

export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: LucideIcon;
  title?: React.ReactNode;
  message?: React.ReactNode;
  action?: React.ReactNode;
}

function EmptyState({
  className,
  icon: Icon = Inbox,
  title = "No hay elementos",
  message,
  action,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-muted/20 px-6 py-16 text-center",
        className
      )}
      {...props}
    >
      <Icon className="h-10 w-10 text-muted-foreground" />
      <div className="space-y-1">
        <h3 className="text-lg font-display font-bold text-foreground">
          {title}
        </h3>
        {message && (
          <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export { EmptyState };
