"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-[var(--ink)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-[2px] border border-[var(--mist)] bg-[var(--paper)] px-3 py-2",
            "text-[var(--ink)] placeholder:text-[var(--graphite)]",
            "focus:outline-none focus:border-[var(--blueprint)] focus:ring-1 focus:ring-[var(--blueprint)]",
            "transition-colors duration-150",
            error && "border-[var(--vermilion)] focus:border-[var(--vermilion)] focus:ring-[var(--vermilion)]",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-[var(--vermilion)]">{error}</p>
        )}
      </div>
    );
  }
);
TextField.displayName = "TextField";

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-[var(--ink)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-[2px] border border-[var(--mist)] bg-[var(--paper)] px-3 py-2",
            "text-[var(--ink)] placeholder:text-[var(--graphite)]",
            "focus:outline-none focus:border-[var(--blueprint)] focus:ring-1 focus:ring-[var(--blueprint)]",
            "transition-colors duration-150 resize-none",
            error && "border-[var(--vermilion)] focus:border-[var(--vermilion)] focus:ring-[var(--vermilion)]",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-[var(--vermilion)]">{error}</p>
        )}
      </div>
    );
  }
);
TextArea.displayName = "TextArea";
