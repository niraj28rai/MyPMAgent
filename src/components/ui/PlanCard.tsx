"use client";

import { useState } from "react";
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

export function PlanCard({ sections, ticketEstimate, onApprove, onEdit, className, isLoading }: PlanCardProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editField, setEditField] = useState<keyof PlanSection | null>(null);
  const [editValue, setEditValue] = useState("");

  function startEdit(id: string, field: keyof PlanSection, current: string) {
    setEditingId(id);
    setEditField(field);
    setEditValue(current);
  }

  function saveEdit() {
    if (editingId && editField) onEdit?.(editingId, editField, editValue);
    setEditingId(null);
    setEditField(null);
  }

  return (
    <div className={cn("border border-[var(--mist)] bg-[var(--paper-2)] p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <SpecNumber>§00 / PROPOSED PLAN</SpecNumber>
        <span className="text-xs text-[var(--graphite)] font-mono">~{ticketEstimate} tickets</span>
      </div>

      <ol className="space-y-5 mb-6">
        {sections.map((section) => {
          const isEditingTitle = editingId === section.id && editField === "title";
          const isEditingScope = editingId === section.id && editField === "what_it_covers";

          return (
            <li key={section.id} className="flex gap-4 group">
              <SpecNumber className="flex-shrink-0 mt-0.5">{section.id}</SpecNumber>
              <div className="flex-1 min-w-0">
                {isEditingTitle ? (
                  <input
                    className="text-sm font-medium text-[var(--ink)] w-full bg-transparent border-b border-[var(--blueprint)] outline-none pb-0.5 mb-0.5"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    autoFocus
                  />
                ) : (
                  <p
                    className="text-sm font-medium text-[var(--ink)] mb-0.5 cursor-text hover:text-[var(--blueprint)] transition-colors"
                    onClick={() => startEdit(section.id, "title", section.title)}
                    title="Click to edit"
                  >
                    {section.title}
                  </p>
                )}
                {isEditingScope ? (
                  <input
                    className="text-xs text-[var(--graphite)] w-full bg-transparent border-b border-[var(--blueprint)] outline-none pb-0.5"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    autoFocus
                  />
                ) : (
                  <p
                    className="text-xs text-[var(--graphite)] leading-relaxed cursor-text hover:text-[var(--ink)] transition-colors"
                    onClick={() => startEdit(section.id, "what_it_covers", section.what_it_covers)}
                    title="Click to edit"
                  >
                    {section.what_it_covers}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <p className="text-xs text-[var(--graphite)] mb-4">Click any title or description above to edit before approving.</p>

      {onApprove && (
        <Button onClick={onApprove} disabled={isLoading} className="w-full">
          {isLoading ? "Drafting PRD…" : "Approve plan"}
        </Button>
      )}
    </div>
  );
}
