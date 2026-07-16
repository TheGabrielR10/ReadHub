"use client";

import { cn } from "@readhub/shared/utils";

export interface LoginFormProps extends React.HTMLAttributes<HTMLFormElement> {
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function LoginForm({
  className,
  onSubmit,
  ...props
}: LoginFormProps) {
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

export function LoginFormContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-4", className)} {...props} />
  );
}

export function LoginFormGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-2", className)} {...props} />
  );
}
