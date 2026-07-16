import { Loader2 } from "lucide-react";

import { cn } from "@readhub/shared/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg";
}

const sizeMap = {
  sm: "h-4 w-4",
  default: "h-6 w-6",
  lg: "h-10 w-10",
};

function Spinner({ className, size = "default", ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={cn("inline-flex items-center justify-center", className)}
      {...props}
    >
      <Loader2 className={cn("animate-spin text-primary", sizeMap[size])} />
      <span className="sr-only">Cargando...</span>
    </div>
  );
}

export { Spinner };
