import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import React from "react";

interface CardProps extends HTMLMotionProps<"div"> {
  hoverEffect?: boolean;
  glowEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverEffect, glowEffect, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "bg-surface border border-border rounded-xl overflow-hidden",
          hoverEffect && "transition-all duration-300 hover:border-border-hover hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
          glowEffect && "relative before:absolute before:inset-0 before:-z-10 before:rounded-xl before:bg-accent/10 before:blur-xl before:opacity-0 hover:before:opacity-100 before:transition-opacity",
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);
Card.displayName = "Card";
