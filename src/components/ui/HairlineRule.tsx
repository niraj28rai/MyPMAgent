import { cn } from "@/lib/utils";

interface HairlineRuleProps {
  className?: string;
  vertical?: boolean;
}

export function HairlineRule({ className, vertical }: HairlineRuleProps) {
  if (vertical) {
    return (
      <div
        className={cn("w-px bg-[var(--mist)] self-stretch", className)}
        aria-hidden="true"
      />
    );
  }
  return (
    <hr
      className={cn("border-0 border-t border-[var(--mist)]", className)}
      aria-hidden="true"
    />
  );
}
