"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { HairlineRule } from "@/components/ui/HairlineRule";
import { PlanCard } from "@/components/ui/PlanCard";
import { QuestionCard } from "@/components/ui/QuestionCard";
import { SectionCard } from "@/components/ui/SectionCard";
import { SpecNumber } from "@/components/ui/SpecNumber";
import { StreamingMarkdown } from "@/components/ui/StreamingMarkdown";
import { TextArea, TextField } from "@/components/ui/TextField";
import { TicketCard } from "@/components/ui/TicketCard";
import { useState } from "react";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-16">
      <h2 className="text-lg font-medium text-[var(--ink)] mb-1">{title}</h2>
      <HairlineRule className="mb-8" />
      {children}
    </section>
  );
}

export default function ComponentsPage() {
  const [answer, setAnswer] = useState("");
  const [inputVal, setInputVal] = useState("");

  return (
    <div className="min-h-screen bg-[var(--paper)] py-16 px-8">
      <div className="max-w-[768px] mx-auto">
        <SpecNumber className="mb-2 block">§DEV / COMPONENT LIBRARY</SpecNumber>
        <h1 className="font-[family-name:var(--font-instrument-serif)] italic text-[2.25rem] tracking-[-0.015em] text-[var(--ink)] mb-12">
          Design system preview
        </h1>

        <Section title="1. SpecNumber">
          <div className="flex flex-col gap-2">
            <SpecNumber>§00 / MY · PM · AGENT</SpecNumber>
            <SpecNumber>§1 / PROBLEM</SpecNumber>
            <SpecNumber>T-001</SpecNumber>
            <SpecNumber>Q3</SpecNumber>
          </div>
        </Section>

        <Section title="2. HairlineRule">
          <HairlineRule className="mb-4" />
          <div className="flex gap-4 h-10 items-center">
            <span className="text-sm text-[var(--graphite)]">left</span>
            <HairlineRule vertical />
            <span className="text-sm text-[var(--graphite)]">right</span>
          </div>
        </Section>

        <Section title="3. TextField / TextArea">
          <div className="flex flex-col gap-4">
            <TextField
              label="Email address"
              placeholder="you@example.com"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <TextField
              label="With error"
              placeholder="Invalid field"
              error="This field is required"
            />
            <TextArea
              label="Product idea"
              placeholder="Paste your idea, transcript, or both."
              rows={3}
            />
          </div>
        </Section>

        <Section title="4. Button">
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Start →</Button>
            <Button variant="ghost">Skip</Button>
            <Button variant="destructive">Delete</Button>
            <Button variant="primary" disabled>
              Loading…
            </Button>
            <Button variant="primary" size="sm">
              Small
            </Button>
            <Button variant="primary" size="lg">
              Large
            </Button>
          </div>
        </Section>

        <Section title="5. SectionCard">
          <SectionCard
            specId="§1 / PROBLEM"
            title="Problem"
            actions={
              <Button variant="ghost" size="sm">
                Edit
              </Button>
            }
          >
            <p className="text-sm text-[var(--graphite)] leading-relaxed">
              Admins waste 25 minutes inviting 50 members one-by-one. The current
              flow requires a separate form submission per person. For teams
              migrating from another tool, this is a severe friction point.
            </p>
          </SectionCard>
        </Section>

        <Section title="6. TicketCard">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TicketCard
              id="T-001"
              title="Build CSV parser and row validator for member import"
              description="Implement a server-side CSV parser that accepts email and role columns. Validate each row and return structured errors keyed by row number."
              acceptanceCriteria={[
                "Given a CSV with 1 invalid email, parser returns 1 error with row number and field name.",
                "Given a missing 'role' column, parser returns top-level error before processing rows.",
                "500 valid rows parses in under 2 seconds.",
              ]}
              priority="P0"
              estimate="M"
              labels={["backend", "api"]}
              onEdit={() => {}}
              onDelete={() => {}}
            />
            <TicketCard
              id="T-002"
              title="Add CSV upload UI to Members settings page"
              description="Add a Bulk invite button visible to workspace admins only. Opens a file picker restricted to .csv files."
              acceptanceCriteria={[
                "Bulk invite button only visible to admins.",
                "Non-CSV file shows inline error without opening dialog.",
              ]}
              priority="P1"
              estimate="M"
              labels={["frontend", "design"]}
            />
          </div>
        </Section>

        <Section title="7. PlanCard">
          <PlanCard
            sections={[
              { id: "§1", title: "Problem", what_it_covers: "Why one-by-one invites are friction for large teams." },
              { id: "§2", title: "Users & Personas", what_it_covers: "Workspace admins managing 10+ person teams." },
              { id: "§3", title: "Goals", what_it_covers: "CSV bulk-invite for up to 500 members in one operation." },
              { id: "§4", title: "Non-goals", what_it_covers: "SCIM/directory sync is out of scope." },
              { id: "§5", title: "Proposed Solution", what_it_covers: "CSV upload UI on Members page with row-level validation." },
              { id: "§6", title: "Success Metrics", what_it_covers: "Time to invite 50 members drops from 25 min to under 3 min." },
              { id: "§7", title: "Risks & Open Questions", what_it_covers: "Rate limits on invite emails; undo/cancel behavior." },
            ]}
            ticketEstimate={6}
            onApprove={() => alert("Plan approved!")}
          />
        </Section>

        <Section title="8. QuestionCard">
          <QuestionCard
            id="Q1"
            text="What specific information is required in the CSV file — mandatory fields like email and role, plus any optional columns?"
            whyItMatters="Without clarity on the CSV structure, it's impossible to define the data validation and processing rules."
            optional={false}
            answer={answer}
            onAnswer={setAnswer}
          />
          <QuestionCard
            id="Q2"
            text="Is there a need for invited users to receive onboarding email sequences after being added?"
            whyItMatters="Determines whether to integrate bulk-invite with existing email automation."
            optional={true}
          />
        </Section>

        <Section title="9. StreamingMarkdown">
          <StreamingMarkdown
            content={`**Problem statement:** Admins waste 25 minutes inviting 50 members one-by-one.\n\nThe current flow requires a separate form submission per person. For teams migrating from another tool, this is a severe friction point that shows up during initial workspace setup.\n\n- Large teams need batch operations\n- Current UX was designed for gradual growth, not bulk migration\n- Support tickets spike after new enterprise signups`}
          />
          <div className="mt-4">
            <StreamingMarkdown
              content="Streaming content ends here"
              isStreaming
            />
          </div>
        </Section>

        <Section title="10. EmptyState">
          <EmptyState
            specId="§00"
            heading="Start with an idea or transcript"
            body="Paste a half-formed thought, a call transcript, or both. The agent will ask the right questions first."
            action={<Button variant="primary">Start →</Button>}
          />
        </Section>
      </div>
    </div>
  );
}
