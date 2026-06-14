import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={isLoading || props.disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-foreground text-background hover:bg-foreground/90": variant === "primary",
            "bg-surface-hover text-foreground hover:bg-surface-active": variant === "secondary",
            "border border-border bg-transparent hover:bg-surface-hover": variant === "outline",
            "bg-transparent hover:bg-surface-hover text-muted-foreground hover:text-foreground": variant === "ghost",
            "bg-danger text-white hover:bg-danger/90": variant === "danger",
            "h-8 px-3 text-xs": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
