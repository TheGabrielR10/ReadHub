import { cn } from "@readhub/shared/utils";

// Encabezado de página reutilizable (título + descripción). Unifica la
// tipografía y el espaciado entre pantallas del dashboard (Home, Upload) para
// garantizar consistencia visual sin duplicar el mismo markup en cada una.
export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
}

export function PageHeader({
  title,
  description,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-1", className)} {...props}>
      <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-foreground">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
