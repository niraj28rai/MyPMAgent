"use client";

import { cn } from "@/lib/utils";
import { SpecNumber } from "./SpecNumber";
import { Button } from "./Button";

interface PlanSection {
  id: string;
  title: string;
  what_it_covers: string;
}

interface PlanCardProps {
  sections: PlanSection[];
  ticketEstimate: number;
  onApprove?: () => void;
  onEdit?: (id: string, field: keyof PlanSection, value: string) => void;
  className?: string;
  isLoading?: boolean;
}

export function PlanCard({
  sections,
  ticketEstimate,
  onApprove,
  className,
  isLoading,
}: PlanCardProps) {
  return (
    <div
      className={cn(
        "border border-[var(--mist)] bg-[var(--paper-2)] p-6",
        className
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <SpecNumber>§00 / PROPOSED PLAN</SpecNumber>
        <span className="text-xs text-[var(--graphite)] font-mono">
          ~{ticketEstimate} tickets
        </span>
      </div>

      <ol className="space-y-4 mb-6">
        {sections.map((section) => (
          <li key={section.id} className="flex gap-4">
            <SpecNumber className="flex-shrink-0 mt-0.5 w-6">
              {section.id}
            </SpecNumber>
            <div>
              <p className="text-sm font-medium text-[var(--ink)] mb-0.5">
                {section.title}
              </p>
              <p className="text-xs text-[var(--graphite)] leading-relaxed">
                {section.what_it_covers}
              </p>
            </div>
          </li>
        ))}
      </ol>

      {onApprove && (
        <Button onClick={onApprove} disabled={isLoading} className="w-full">
          {isLoading ? "Drafting PRD…" : "Approve plan"}
        </Button>
      )}
    </div>
  );
}
