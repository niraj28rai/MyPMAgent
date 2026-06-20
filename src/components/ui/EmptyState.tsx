import { cn } from "@/lib/utils";
import { SpecNumber } from "./SpecNumber";

interface EmptyStateProps {
  specId?: string;
  heading: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  specId,
  heading,
  body,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center text-center py-16 px-8 border border-dashed border-[var(--mist)]",
        className
      )}
    >
      {specId && (
        <SpecNumber className="mb-4">{specId}</SpecNumber>
      )}
      <p className="text-base font-medium text-[var(--ink)] mb-2">{heading}</p>
      {body && (
        <p className="text-sm text-[var(--graphite)] mb-6 max-w-sm leading-relaxed">
          {body}
        </p>
      )}
      {action}
    </div>
  );
}
