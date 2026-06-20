import { cn } from "@/lib/utils";
import { SpecNumber } from "./SpecNumber";

interface SectionCardProps {
  specId: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export function SectionCard({
  specId,
  title,
  children,
  className,
  actions,
}: SectionCardProps) {
  return (
    <div
      className={cn(
        "border-t border-[var(--mist)] pt-6 pb-8",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <SpecNumber>{specId}</SpecNumber>
          <h2 className="text-lg font-medium text-[var(--ink)] tracking-[-0.01em]">
            {title}
          </h2>
        </div>
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
        )}
      </div>
      {children && (
        <div className="text-[var(--ink)] leading-relaxed">{children}</div>
      )}
    </div>
  );
}
