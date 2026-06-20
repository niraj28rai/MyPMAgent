import { z } from "zod";

export const QuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  why_it_matters: z.string(),
  optional: z.boolean(),
});

export const ClarifyOutputSchema = z.object({
  questions: z.array(QuestionSchema).min(3).max(5),
});

export const PlanSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  what_it_covers: z.string(),
});

export const OutlineOutputSchema = z.object({
  sections: z.array(PlanSectionSchema),
  ticket_estimate: z.number().int().positive(),
});

export const DraftSectionSchema = z.object({
  section_id: z.string(),
  content: z.string().min(80),
});

export const DraftOutputSchema = z.array(DraftSectionSchema);

export const TicketSchema = z.object({
  id: z.string(),
  title: z.string().max(80),
  description: z.string().optional().default(""),
  acceptance_criteria: z.array(z.string()).min(1),
  priority: z.enum(["P0", "P1", "P2"]),
  estimate: z.enum(["S", "M", "L"]),
  labels: z.array(z.string()).optional().default([]),
});

export const TicketsOutputSchema = z.object({
  tickets: z.array(TicketSchema).min(1),
});

export type Question = z.infer<typeof QuestionSchema>;
export type PlanSection = z.infer<typeof PlanSectionSchema>;
export type DraftSection = z.infer<typeof DraftSectionSchema>;
export type Ticket = z.infer<typeof TicketSchema>;
