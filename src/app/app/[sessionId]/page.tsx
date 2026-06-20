"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { HairlineRule } from "@/components/ui/HairlineRule";
import { PlanCard } from "@/components/ui/PlanCard";
import { QuestionCard } from "@/components/ui/QuestionCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { SpecNumber } from "@/components/ui/SpecNumber";
import { StreamingMarkdown } from "@/components/ui/StreamingMarkdown";
import { TicketCard } from "@/components/ui/TicketCard";
import type { DraftSection, PlanSection, Question, Ticket } from "@/lib/schemas";

type Step = "loading" | "clarify" | "generating-plan" | "plan" | "generating-draft" | "draft" | "generating-tickets" | "tickets";

export default function SessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [step, setStep] = useState<Step>("loading");
  const [rawIdea, setRawIdea] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [plan, setPlan] = useState<{ sections: PlanSection[]; ticket_estimate: number } | null>(null);
  const [prdSections, setPrdSections] = useState<DraftSection[]>([]);
  const [revealedCount, setRevealedCount] = useState(0);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"md" | "csv" | null>(null);

  const loadSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (!res.ok) { router.push("/app"); return; }
    const data = await res.json();
    setRawIdea(data.raw_idea ?? "");

    if (data.state === "tickets" && data.tickets?.length) {
      setTickets(data.tickets.map((t: { ticket_id: string; title: string; description: string; acceptance_criteria: string[]; priority: "P0"|"P1"|"P2"; estimate: "S"|"M"|"L"; labels: string[] }) => ({
        id: t.ticket_id, title: t.title, description: t.description,
        acceptance_criteria: t.acceptance_criteria, priority: t.priority,
        estimate: t.estimate, labels: t.labels,
      })));
      setStep("tickets");
    } else if (data.state === "draft" && data.prd_sections?.length) {
      const sorted = [...data.prd_sections].sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index);
      setPrdSections(sorted.map((s: { spec_number: string; content_md: string }) => ({ section_id: s.spec_number, content: s.content_md })));
      setRevealedCount(sorted.length);
      setStep("draft");
    } else if (data.clarifications?.length) {
      setQuestions(
        [...data.clarifications]
          .sort((a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index)
          .map((c: { order_index: number; question: string; why_it_matters: string; optional: boolean }, i: number) => ({
            id: `Q${i + 1}`, text: c.question, why_it_matters: c.why_it_matters, optional: c.optional,
          }))
      );
      setStep("clarify");
    } else {
      setStep("clarify");
    }
  }, [sessionId, router]);

  useEffect(() => { loadSession(); }, [loadSession]);

  // Stagger-reveal PRD sections
  useEffect(() => {
    if (step === "draft" && revealedCount < prdSections.length) {
      const t = setTimeout(() => setRevealedCount((c) => c + 1), 500);
      return () => clearTimeout(t);
    }
  }, [step, revealedCount, prdSections.length]);

  async function handleContinueToplan() {
    setStep("generating-plan");
    setError("");
    try {
      const res = await fetch(`/api/sessions/${sessionId}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPlan(data);
      setStep("plan");
    } catch (e) {
      setError(String(e));
      setStep("clarify");
    }
  }

  async function handleApprovePlan() {
    if (!plan) return;
    setStep("generating-draft");
    setError("");
    try {
      const res = await fetch(`/api/sessions/${sessionId}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: plan.sections, answers }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPrdSections(data.sections);
      setRevealedCount(0);
      setStep("draft");
    } catch (e) {
      setError(String(e));
      setStep("plan");
    }
  }

  async function handleGenerateTickets() {
    setStep("generating-tickets");
    setError("");
    const prdMarkdown = prdSections
      .map((s) => `## ${s.section_id}\n\n${s.content}`)
      .join("\n\n---\n\n");
    try {
      const res = await fetch(`/api/sessions/${sessionId}/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prdMarkdown, ticketEstimate: plan?.ticket_estimate ?? 5 }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTickets(data.tickets);
      setStep("tickets");
    } catch (e) {
      setError(String(e));
      setStep("draft");
    }
  }

  function buildMarkdownExport() {
    const prd = prdSections.map((s) => `## ${s.section_id}\n\n${s.content}`).join("\n\n---\n\n");
    const ticketsMd = tickets
      .map(
        (t) =>
          `### ${t.id} — ${t.title}\n**Priority:** ${t.priority} | **Estimate:** ${t.estimate}\n\n${t.description}\n\n**Acceptance criteria:**\n${t.acceptance_criteria.map((c) => `- ${c}`).join("\n")}`
      )
      .join("\n\n");
    return `# PRD\n\n${rawIdea}\n\n---\n\n${prd}\n\n---\n\n# Tickets\n\n${ticketsMd}`;
  }

  function buildCSVExport() {
    const header = "Title,Description,Priority,Estimate,Labels";
    const priorityMap: Record<string, string> = { P0: "Urgent", P1: "High", P2: "Medium" };
    const estimateMap: Record<string, string> = { S: "Small", M: "Medium", L: "Large" };
    const rows = tickets.map(
      (t) =>
        `"${t.title.replace(/"/g, '""')}","${(t.description ?? "").replace(/"/g, '""')}","${priorityMap[t.priority]}","${estimateMap[t.estimate]}","${(t.labels ?? []).join(", ")}"`
    );
    return [header, ...rows].join("\n");
  }

  async function copyText(text: string, type: "md" | "csv") {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  const STEPS = ["clarify", "plan", "draft", "tickets"];
  const currentStepIndex = STEPS.indexOf(
    step.replace("generating-", "") as string
  );

  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4">
        <Link href="/">
          <SpecNumber>§00 / MY · PM · AGENT</SpecNumber>
        </Link>
        <div className="flex items-center gap-6">
          {STEPS.map((s, i) => (
            <span
              key={s}
              className={`text-xs font-mono uppercase tracking-[0.08em] ${i <= currentStepIndex ? "text-[var(--blueprint)]" : "text-[var(--mist)]"}`}
            >
              §0{i + 1} / {s.toUpperCase()}
            </span>
          ))}
        </div>
      </header>

      <HairlineRule />

      <main className="flex-1 px-8 py-12 max-w-[768px] mx-auto w-full">
        {error && (
          <div className="mb-6 p-4 border border-[var(--vermilion)] text-sm text-[var(--vermilion)]">
            {error}
          </div>
        )}

        {/* LOADING */}
        {step === "loading" && (
          <div className="flex items-center gap-3 text-sm text-[var(--graphite)]">
            <span className="font-mono animate-pulse">Loading session…</span>
          </div>
        )}

        {/* CLARIFY */}
        {step === "clarify" && (
          <>
            <SpecNumber className="mb-2 block">§01 / CLARIFY</SpecNumber>
            <h1 className="font-[family-name:var(--font-instrument-serif)] italic text-[2.25rem] tracking-[-0.015em] text-[var(--ink)] mb-2">
              A few quick questions.
            </h1>
            <p className="text-sm text-[var(--graphite)] mb-10">
              Answer what you can. Skip anything optional.
            </p>
            {questions.length === 0 ? (
              <p className="text-sm text-[var(--graphite)]">No clarifying questions — ready to continue.</p>
            ) : (
              questions.map((q) => (
                <QuestionCard
                  key={q.id}
                  id={q.id}
                  text={q.text}
                  whyItMatters={q.why_it_matters}
                  optional={q.optional}
                  answer={answers[q.id] ?? ""}
                  onAnswer={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                />
              ))
            )}
            <div className="mt-8 flex justify-end">
              <Button onClick={handleContinueToplan}>Continue →</Button>
            </div>
          </>
        )}

        {/* GENERATING PLAN */}
        {step === "generating-plan" && (
          <div className="py-16 text-center">
            <SpecNumber className="mb-4 block">§02 / PLAN</SpecNumber>
            <p className="text-sm text-[var(--graphite)] font-mono animate-pulse">
              Generating PRD outline…
            </p>
          </div>
        )}

        {/* PLAN */}
        {step === "plan" && plan && (
          <>
            <SpecNumber className="mb-2 block">§02 / PLAN</SpecNumber>
            <h1 className="font-[family-name:var(--font-instrument-serif)] italic text-[2.25rem] tracking-[-0.015em] text-[var(--ink)] mb-2">
              Here is the proposed outline.
            </h1>
            <p className="text-sm text-[var(--graphite)] mb-10">
              Review the plan. Click approve to start drafting.
            </p>
            <PlanCard
              sections={plan.sections}
              ticketEstimate={plan.ticket_estimate}
              onApprove={handleApprovePlan}
            />
          </>
        )}

        {/* GENERATING DRAFT */}
        {step === "generating-draft" && (
          <div className="py-16 text-center">
            <SpecNumber className="mb-4 block">§03 / DRAFT</SpecNumber>
            <p className="text-sm text-[var(--graphite)] font-mono animate-pulse">
              Writing PRD sections…
            </p>
          </div>
        )}

        {/* DRAFT */}
        {(step === "draft" || step === "generating-tickets") && prdSections.length > 0 && (
          <>
            <SpecNumber className="mb-2 block">§03 / DRAFT PRD</SpecNumber>
            <h1 className="font-[family-name:var(--font-instrument-serif)] italic text-[2.25rem] tracking-[-0.015em] text-[var(--ink)] mb-10">
              {revealedCount < prdSections.length ? "Writing…" : "PRD complete."}
            </h1>
            <div className="space-y-0">
              {prdSections.slice(0, revealedCount).map((s, i) => (
                <SectionCard key={s.section_id} specId={s.section_id} title={
                  plan?.sections.find((sec) => sec.id === s.section_id)?.title ?? s.section_id
                }>
                  <StreamingMarkdown
                    content={s.content}
                    isStreaming={i === revealedCount - 1 && revealedCount < prdSections.length}
                  />
                </SectionCard>
              ))}
            </div>
            {revealedCount >= prdSections.length && step === "draft" && (
              <div className="mt-10 flex justify-end">
                <Button onClick={handleGenerateTickets}>Generate tickets →</Button>
              </div>
            )}
            {step === "generating-tickets" && (
              <div className="mt-10 text-right">
                <span className="text-sm text-[var(--graphite)] font-mono animate-pulse">
                  Generating tickets…
                </span>
              </div>
            )}
          </>
        )}

        {/* TICKETS */}
        {step === "tickets" && (
          <>
            <SpecNumber className="mb-2 block">§04 / TICKETS</SpecNumber>
            <h1 className="font-[family-name:var(--font-instrument-serif)] italic text-[2.25rem] tracking-[-0.015em] text-[var(--ink)] mb-2">
              {tickets.length} tickets ready.
            </h1>
            <p className="text-sm text-[var(--graphite)] mb-10">
              Copy to clipboard and paste into Linear or your backlog tool.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-10">
              {tickets.map((t) => (
                <TicketCard
                  key={t.id}
                  id={t.id}
                  title={t.title}
                  description={t.description}
                  acceptanceCriteria={t.acceptance_criteria}
                  priority={t.priority}
                  estimate={t.estimate}
                  labels={t.labels}
                />
              ))}
            </div>

            <HairlineRule className="mb-6" />
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => copyText(buildMarkdownExport(), "md")}
              >
                {copied === "md" ? "Copied!" : "Copy as Markdown"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => copyText(buildCSVExport(), "csv")}
              >
                {copied === "csv" ? "Copied!" : "Copy as Linear CSV"}
              </Button>
              <Link href="/" className="ml-auto">
                <Button variant="ghost">New session</Button>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
