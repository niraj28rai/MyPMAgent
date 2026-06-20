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
import { TextArea } from "@/components/ui/TextField";
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

  // Per-section edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Per-section regenerate state
  const [revisingSectionId, setRevisingSectionId] = useState<string | null>(null);
  const [sectionFeedback, setSectionFeedback] = useState<Record<string, string>>({});
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Full PRD revision state
  const [showReviseAll, setShowReviseAll] = useState(false);
  const [reviseAllFeedback, setReviseAllFeedback] = useState("");

  const loadSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`);
    if (!res.ok) { router.push("/app"); return; }
    const data = await res.json();
    setRawIdea(data.raw_idea ?? "");

    if (data.state === "tickets" && data.tickets?.length) {
      setTickets(data.tickets.map((t: { ticket_id: string; title: string; description: string; acceptance_criteria: string[]; priority: "P0" | "P1" | "P2"; estimate: "S" | "M" | "L"; labels: string[] }) => ({
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
          .map((c: { question: string; why_it_matters: string; optional: boolean }, i: number) => ({
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

  async function handleContinueToPlan() {
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

  // Save inline edit
  function handleSaveEdit(sectionId: string) {
    setPrdSections((prev) =>
      prev.map((s) => s.section_id === sectionId ? { ...s, content: editContent } : s)
    );
    setEditingId(null);
    setEditContent("");
  }

  // Regenerate single section
  async function handleRegenerateSection(sectionId: string) {
    const section = plan?.sections.find((s) => s.id === sectionId);
    const title = section?.title ?? sectionId;
    const feedback = sectionFeedback[sectionId] ?? "";
    const prdContext = prdSections
      .filter((s) => s.section_id !== sectionId)
      .map((s) => `${s.section_id}: ${s.content.slice(0, 200)}…`)
      .join("\n");

    setRegeneratingId(sectionId);
    setRevisingSectionId(null);
    setSectionFeedback((f) => ({ ...f, [sectionId]: "" }));

    try {
      const res = await fetch(`/api/sessions/${sessionId}/draft/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section_id: sectionId, section_title: title, feedback, prd_context: prdContext }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPrdSections((prev) =>
        prev.map((s) => s.section_id === sectionId ? { ...s, content: data.content } : s)
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setRegeneratingId(null);
    }
  }

  // Revise entire PRD
  async function handleReviseAll() {
    if (!plan) return;
    setStep("generating-draft");
    setError("");
    try {
      const res = await fetch(`/api/sessions/${sessionId}/draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: plan.sections,
          answers,
          revision_feedback: reviseAllFeedback,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPrdSections(data.sections);
      setRevealedCount(0);
      setShowReviseAll(false);
      setReviseAllFeedback("");
      setStep("draft");
    } catch (e) {
      setError(String(e));
      setStep("draft");
    }
  }

  function buildMarkdownExport() {
    const prd = prdSections.map((s) => `## ${s.section_id}\n\n${s.content}`).join("\n\n---\n\n");
    const ticketsMd = tickets
      .map((t) => `### ${t.id} — ${t.title}\n**Priority:** ${t.priority} | **Estimate:** ${t.estimate}\n\n${t.description}\n\n**Acceptance criteria:**\n${t.acceptance_criteria.map((c) => `- ${c}`).join("\n")}`)
      .join("\n\n");
    return `# PRD\n\n${rawIdea}\n\n---\n\n${prd}\n\n---\n\n# Tickets\n\n${ticketsMd}`;
  }

  function buildCSVExport() {
    const header = "Title,Description,Priority,Estimate,Labels";
    const priorityMap: Record<string, string> = { P0: "Urgent", P1: "High", P2: "Medium" };
    const estimateMap: Record<string, string> = { S: "Small", M: "Medium", L: "Large" };
    const rows = tickets.map(
      (t) => `"${t.title.replace(/"/g, '""')}","${(t.description ?? "").replace(/"/g, '""')}","${priorityMap[t.priority]}","${estimateMap[t.estimate]}","${(t.labels ?? []).join(", ")}"`
    );
    return [header, ...rows].join("\n");
  }

  async function copyText(text: string, type: "md" | "csv") {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  }

  const STEPS = ["clarify", "plan", "draft", "tickets"];
  const currentStepIndex = STEPS.indexOf(step.replace("generating-", "") as string);

  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col">
      <header className="flex items-center justify-between px-8 py-4">
        <Link href="/">
          <SpecNumber>§00 / MY · PM · AGENT</SpecNumber>
        </Link>
        <div className="flex items-center gap-6">
          {STEPS.map((s, i) => (
            <span key={s} className={`text-xs font-mono uppercase tracking-[0.08em] ${i <= currentStepIndex ? "text-[var(--blueprint)]" : "text-[var(--mist)]"}`}>
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
            <button onClick={() => setError("")} className="ml-3 underline">Dismiss</button>
          </div>
        )}

        {/* LOADING */}
        {step === "loading" && (
          <p className="text-sm text-[var(--graphite)] font-mono animate-pulse">Loading session…</p>
        )}

        {/* CLARIFY */}
        {step === "clarify" && (
          <>
            <SpecNumber className="mb-2 block">§01 / CLARIFY</SpecNumber>
            <h1 className="font-[family-name:var(--font-instrument-serif)] italic text-[2.25rem] tracking-[-0.015em] text-[var(--ink)] mb-2">A few quick questions.</h1>
            <p className="text-sm text-[var(--graphite)] mb-10">Answer what you can. Skip anything optional.</p>
            {questions.length === 0
              ? <p className="text-sm text-[var(--graphite)]">No clarifying questions — ready to continue.</p>
              : questions.map((q) => (
                <QuestionCard key={q.id} id={q.id} text={q.text} whyItMatters={q.why_it_matters} optional={q.optional}
                  answer={answers[q.id] ?? ""} onAnswer={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
              ))
            }
            <div className="mt-8 flex justify-end">
              <Button onClick={handleContinueToPlan}>Continue →</Button>
            </div>
          </>
        )}

        {/* GENERATING PLAN */}
        {step === "generating-plan" && (
          <div className="py-16 text-center">
            <SpecNumber className="mb-4 block">§02 / PLAN</SpecNumber>
            <p className="text-sm text-[var(--graphite)] font-mono animate-pulse">Generating PRD outline…</p>
          </div>
        )}

        {/* PLAN */}
        {step === "plan" && plan && (
          <>
            <SpecNumber className="mb-2 block">§02 / PLAN</SpecNumber>
            <h1 className="font-[family-name:var(--font-instrument-serif)] italic text-[2.25rem] tracking-[-0.015em] text-[var(--ink)] mb-2">Here is the proposed outline.</h1>
            <p className="text-sm text-[var(--graphite)] mb-10">Review the plan. Edit any section title or scope before approving.</p>
            <PlanCard
              sections={plan.sections}
              ticketEstimate={plan.ticket_estimate}
              onApprove={handleApprovePlan}
              onEdit={(id, field, value) =>
                setPlan((p) => p ? { ...p, sections: p.sections.map((s) => s.id === id ? { ...s, [field]: value } : s) } : p)
              }
            />
          </>
        )}

        {/* GENERATING DRAFT */}
        {step === "generating-draft" && (
          <div className="py-16 text-center">
            <SpecNumber className="mb-4 block">§03 / DRAFT</SpecNumber>
            <p className="text-sm text-[var(--graphite)] font-mono animate-pulse">Writing PRD sections…</p>
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
              {prdSections.slice(0, revealedCount).map((s, i) => {
                const sectionTitle = plan?.sections.find((sec) => sec.id === s.section_id)?.title ?? s.section_id;
                const isEditing = editingId === s.section_id;
                const isRevising = revisingSectionId === s.section_id;
                const isRegenerating = regeneratingId === s.section_id;

                return (
                  <SectionCard
                    key={s.section_id}
                    specId={s.section_id}
                    title={sectionTitle}
                    actions={
                      revealedCount >= prdSections.length && step === "draft" ? (
                        <div className="flex items-center gap-2">
                          {!isEditing && !isRevising && (
                            <>
                              <button
                                onClick={() => { setEditingId(s.section_id); setEditContent(s.content); setRevisingSectionId(null); }}
                                className="text-xs text-[var(--graphite)] hover:text-[var(--ink)] transition-colors px-2 py-1 border border-[var(--mist)]"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => { setRevisingSectionId(s.section_id); setEditingId(null); }}
                                className="text-xs text-[var(--graphite)] hover:text-[var(--ink)] transition-colors px-2 py-1 border border-[var(--mist)]"
                              >
                                Regenerate
                              </button>
                            </>
                          )}
                          {isEditing && (
                            <>
                              <button onClick={() => handleSaveEdit(s.section_id)} className="text-xs text-[var(--blueprint)] px-2 py-1 border border-[var(--blueprint)]">Save</button>
                              <button onClick={() => setEditingId(null)} className="text-xs text-[var(--graphite)] px-2 py-1 border border-[var(--mist)]">Cancel</button>
                            </>
                          )}
                          {isRevising && (
                            <button onClick={() => setRevisingSectionId(null)} className="text-xs text-[var(--graphite)] px-2 py-1 border border-[var(--mist)]">Cancel</button>
                          )}
                        </div>
                      ) : undefined
                    }
                  >
                    {isEditing ? (
                      <TextArea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={12}
                        className="w-full font-mono text-xs"
                        autoFocus
                      />
                    ) : isRegenerating ? (
                      <p className="text-xs text-[var(--graphite)] font-mono animate-pulse py-4">Regenerating {sectionTitle}…</p>
                    ) : (
                      <>
                        <StreamingMarkdown
                          content={s.content}
                          isStreaming={i === revealedCount - 1 && revealedCount < prdSections.length}
                        />
                        {isRevising && (
                          <div className="mt-4 pt-4 border-t border-[var(--mist)]">
                            <p className="text-xs text-[var(--graphite)] mb-2">What should change? (optional — leave blank to regenerate with the same intent)</p>
                            <TextArea
                              placeholder="e.g. Make the success metrics more specific. Add a retention metric."
                              value={sectionFeedback[s.section_id] ?? ""}
                              onChange={(e) => setSectionFeedback((f) => ({ ...f, [s.section_id]: e.target.value }))}
                              rows={2}
                              autoFocus
                            />
                            <div className="flex justify-end mt-2">
                              <Button size="sm" onClick={() => handleRegenerateSection(s.section_id)}>
                                Regenerate section →
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </SectionCard>
                );
              })}
            </div>

            {/* PRD actions */}
            {revealedCount >= prdSections.length && step === "draft" && (
              <div className="mt-10">
                <HairlineRule className="mb-6" />

                {showReviseAll ? (
                  <div className="mb-6">
                    <p className="text-sm font-medium text-[var(--ink)] mb-2">What should change across the whole PRD?</p>
                    <p className="text-xs text-[var(--graphite)] mb-3">Be specific — the agent will rewrite all sections incorporating your feedback.</p>
                    <TextArea
                      placeholder="e.g. The tone is too generic. Make the problem section more specific to B2B SaaS PMs. Add a competitive context to the solution section."
                      value={reviseAllFeedback}
                      onChange={(e) => setReviseAllFeedback(e.target.value)}
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-3 mt-3">
                      <Button onClick={handleReviseAll} disabled={!reviseAllFeedback.trim()}>
                        Rewrite PRD →
                      </Button>
                      <Button variant="ghost" onClick={() => setShowReviseAll(false)}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3 flex-wrap">
                    <Button onClick={handleGenerateTickets}>Generate tickets →</Button>
                    <Button variant="ghost" onClick={() => setShowReviseAll(true)}>Revise PRD</Button>
                  </div>
                )}
              </div>
            )}

            {step === "generating-tickets" && (
              <div className="mt-10 text-right">
                <span className="text-sm text-[var(--graphite)] font-mono animate-pulse">Generating tickets…</span>
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
            <p className="text-sm text-[var(--graphite)] mb-10">Copy to clipboard and paste into Linear or your backlog.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-10">
              {tickets.map((t) => (
                <TicketCard key={t.id} id={t.id} title={t.title} description={t.description}
                  acceptanceCriteria={t.acceptance_criteria} priority={t.priority}
                  estimate={t.estimate} labels={t.labels} />
              ))}
            </div>
            <HairlineRule className="mb-6" />
            <div className="flex gap-3 flex-wrap">
              <Button variant="primary" onClick={() => copyText(buildMarkdownExport(), "md")}>
                {copied === "md" ? "Copied!" : "Copy as Markdown"}
              </Button>
              <Button variant="ghost" onClick={() => copyText(buildCSVExport(), "csv")}>
                {copied === "csv" ? "Copied!" : "Copy as Linear CSV"}
              </Button>
              <button
                onClick={() => { setStep("draft"); setRevealedCount(prdSections.length); }}
                className="text-xs text-[var(--graphite)] hover:text-[var(--ink)] transition-colors ml-auto"
              >
                ← Back to PRD
              </button>
              <Link href="/"><Button variant="ghost">New session</Button></Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
