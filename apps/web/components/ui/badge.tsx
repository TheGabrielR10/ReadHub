import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@readhub/shared/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20",
        secondary:
          "border border-secondary/20 bg-secondary/20 text-secondary-foreground hover:bg-secondary/30",
        destructive:
          "border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/20",
        success:
          "border border-success/20 bg-success/10 text-success hover:bg-success/20",
        warning:
          "border border-warning/20 bg-warning/10 text-warning hover:bg-warning/20",
        outline:
          "border border-input bg-background text-foreground hover:bg-secondary",
        ghost: "bg-muted text-muted-foreground hover:bg-muted/80",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
