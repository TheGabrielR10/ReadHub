import { cn } from "@readhub/shared/utils";
import { Spinner } from "@/components/ui/spinner";

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: React.ReactNode;
  size?: "sm" | "default" | "lg";
}

function LoadingState({
  className,
  message = "Cargando...",
  size = "default",
  ...props
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center",
        className
      )}
      {...props}
    >
      <Spinner size={size} />
      {message && (
        <p className="text-sm font-medium text-muted-foreground">{message}</p>
      )}
    </div>
  );
}

export { LoadingState };
