"use client";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "rounded-[2px] text-sm font-medium",
    "transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--blueprint)] focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-40",
    "cursor-pointer",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-[var(--blueprint)] text-white",
          "hover:bg-[#162d6e] active:bg-[#0f1f4d]",
          "px-4 py-2",
        ],
        ghost: [
          "text-[var(--graphite)] bg-transparent",
          "hover:text-[var(--ink)] hover:bg-[var(--paper-2)]",
          "px-4 py-2",
        ],
        destructive: [
          "text-[var(--vermilion)] bg-transparent border border-[var(--vermilion)]",
          "hover:bg-[var(--vermilion)] hover:text-white",
          "px-4 py-2",
        ],
      },
      size: {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
