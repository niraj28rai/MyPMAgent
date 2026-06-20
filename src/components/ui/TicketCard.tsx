"use client";

import { cn } from "@/lib/utils";
import { SpecNumber } from "./SpecNumber";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type Priority = "P0" | "P1" | "P2";
type Estimate = "S" | "M" | "L";

interface TicketCardProps {
  id: string;
  title: string;
  description?: string;
  acceptanceCriteria?: string[];
  priority: Priority;
  estimate: Estimate;
  labels?: string[];
  className?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

const priorityColors: Record<Priority, string> = {
  P0: "text-[var(--vermilion)] border-[var(--vermilion)]",
  P1: "text-[var(--blueprint)] border-[var(--blueprint)]",
  P2: "text-[var(--graphite)] border-[var(--mist)]",
};

export function TicketCard({
  id,
  title,
  description,
  acceptanceCriteria,
  priority,
  estimate,
  labels,
  className,
  onEdit,
  onDelete,
}: TicketCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={cn(
        "border border-[var(--mist)] bg-[var(--paper-2)] p-4",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <SpecNumber>{id}</SpecNumber>
          <span
            className={cn(
              "text-xs font-mono font-medium border px-1.5 py-0.5",
              priorityColors[priority]
            )}
          >
            {priority}
          </span>
          <span className="text-xs font-mono text-[var(--graphite)] border border-[var(--mist)] px-1.5 py-0.5">
            {estimate}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-xs text-[var(--graphite)] hover:text-[var(--ink)] px-2 py-1"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="text-xs text-[var(--vermilion)] hover:text-[var(--vermilion)] px-2 py-1"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <h3 className="text-sm font-medium text-[var(--ink)] leading-snug mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-[var(--graphite)] leading-relaxed mb-3">
          {description}
        </p>
      )}

      {labels && labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {labels.map((label) => (
            <span
              key={label}
              className="text-xs font-mono text-[var(--graphite)] bg-[var(--paper)] border border-[var(--mist)] px-2 py-0.5"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {acceptanceCriteria && acceptanceCriteria.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-[var(--graphite)] hover:text-[var(--ink)] transition-colors"
          >
            {expanded ? (
              <ChevronUp size={12} />
            ) : (
              <ChevronDown size={12} />
            )}
            <span className="font-mono uppercase tracking-[0.08em]">
              Acceptance criteria ({acceptanceCriteria.length})
            </span>
          </button>
          {expanded && (
            <ul className="mt-2 space-y-1 border-t border-[var(--mist)] pt-2">
              {acceptanceCriteria.map((criterion, i) => (
                <li
                  key={i}
                  className="text-xs text-[var(--graphite)] leading-relaxed flex gap-2"
                >
                  <span className="font-mono text-[var(--mist)] flex-shrink-0">
                    ✓
                  </span>
                  {criterion}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
