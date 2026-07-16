"use client";

import { cn } from "@readhub/shared/utils";

export interface RegisterFormProps extends React.HTMLAttributes<HTMLFormElement> {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function RegisterForm({
  className,
  onSubmit,
  ...props
}: RegisterFormProps) {
  return (
    <form
      className={cn(
        "space-y-6 w-full max-w-md",
        className
      )}
      onSubmit={onSubmit}
      {...props}
    />
  );
}

export function RegisterFormContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-4", className)} {...props} />
  );
}

export function RegisterFormGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props} />
  );
}
