import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border border-borda bg-fundo p-6 shadow-[var(--sombra-card)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
