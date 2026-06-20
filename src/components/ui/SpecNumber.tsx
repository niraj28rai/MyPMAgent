import { cn } from "@/lib/utils";

interface SpecNumberProps {
  children: React.ReactNode;
  className?: string;
}

export function SpecNumber({ children, className }: SpecNumberProps) {
  return (
    <span
      className={cn(
        "font-mono text-xs font-medium uppercase tracking-[0.08em] text-[var(--graphite)]",
        className
      )}
    >
      {children}
    </span>
  );
}
