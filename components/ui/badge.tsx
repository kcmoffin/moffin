import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  default: "border-pink-200 bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-900/60",
  secondary: "border-rose-100 bg-rose-50/70 text-rose-600 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/40",
  solid: "border-transparent bg-pink-500 text-white shadow-xs hover:bg-pink-600",
  destructive: "border-transparent bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900",
  outline: "border-pink-200/80 text-foreground bg-transparent",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants;
}

function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors select-none",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
