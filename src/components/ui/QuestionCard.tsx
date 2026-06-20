"use client";

import { cn } from "@/lib/utils";
import { SpecNumber } from "./SpecNumber";
import { TextArea } from "./TextField";

interface QuestionCardProps {
  id: string;
  text: string;
  whyItMatters: string;
  optional: boolean;
  answer?: string;
  onAnswer?: (value: string) => void;
  className?: string;
}

export function QuestionCard({
  id,
  text,
  whyItMatters,
  optional,
  answer,
  onAnswer,
  className,
}: QuestionCardProps) {
  return (
    <div
      className={cn(
        "border-t border-[var(--mist)] pt-5 pb-6",
        className
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <SpecNumber className="flex-shrink-0 mt-0.5">{id}</SpecNumber>
        {optional && (
          <span className="text-xs font-mono text-[var(--graphite)] border border-[var(--mist)] px-1.5 py-0.5 flex-shrink-0">
            optional
          </span>
        )}
      </div>
      <p className="text-sm font-medium text-[var(--ink)] mb-1.5 leading-snug">
        {text}
      </p>
      <p className="text-xs text-[var(--graphite)] mb-4 leading-relaxed">
        {whyItMatters}
      </p>
      <TextArea
        placeholder="Your answer (press skip to move on)"
        value={answer ?? ""}
        onChange={(e) => onAnswer?.(e.target.value)}
        rows={2}
        aria-label={`Answer for ${id}`}
      />
    </div>
  );
}
