import Link from "next/link";
import { SpecNumber } from "@/components/ui/SpecNumber";
import { HairlineRule } from "@/components/ui/HairlineRule";
import { SectionCard } from "@/components/ui/SectionCard";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "About — MyPMAgent",
  description: "How MyPMAgent was built — a fork of Hermes Agent by Nous Research.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col">
      <header className="flex items-center justify-between px-8 py-4">
        <Link href="/"><SpecNumber>§00 / MY · PM · AGENT</SpecNumber></Link>
        <Link href="/">
          <Button variant="ghost" size="sm">Try it →</Button>
        </Link>
      </header>
      <HairlineRule />

      <main className="flex-1 px-8 py-16 max-w-[768px] mx-auto w-full">
        <SpecNumber className="mb-3 block">§01 / ABOUT</SpecNumber>
        <h1 className="font-[family-name:var(--font-instrument-serif)] italic text-[3.5rem] leading-[1.1] tracking-[-0.02em] text-[var(--ink)] mb-6">
          Built on a fork of Hermes.
        </h1>
        <p className="text-base text-[var(--graphite)] leading-relaxed mb-16 max-w-[520px]">
          MyPMAgent started with{" "}
          <a href="https://github.com/NousResearch/hermes-agent" target="_blank" rel="noopener noreferrer" className="text-[var(--blueprint)] underline underline-offset-2">
            Hermes Agent
          </a>{" "}
          by Nous Research — an open-source agent framework that exposes an OpenAI-compatible API. Four custom PM skills were added on top.
        </p>

        <SectionCard specId="§1 / THE FORK" title="What we forked from Hermes">
          <p className="text-sm text-[var(--graphite)] leading-relaxed mb-4">
            Hermes ships as an OpenAI-compatible server on port 8642. That means any app already talking to OpenAI can point at Hermes instead — no API changes. The PM skills live on a{" "}
            <code className="font-mono text-xs bg-[var(--paper-2)] px-1 border border-[var(--mist)]">mypmagent</code> branch in the fork.
          </p>
          <p className="text-sm text-[var(--graphite)] leading-relaxed">
            The Next.js frontend uses the Vercel AI SDK with <code className="font-mono text-xs bg-[var(--paper-2)] px-1 border border-[var(--mist)]">baseURL</code> pointed at Hermes. Zero glue code. All the PM logic lives in the four skills below.
          </p>
        </SectionCard>

        <SectionCard specId="§2 / THE 4 SKILLS" title="The PM skills">
          <div className="space-y-4">
            {[
              { id: "pm-clarify", title: "Clarify", desc: "Reads the raw idea or transcript and generates 3–5 targeted questions that would meaningfully improve the PRD. Marks questions optional when the PRD can proceed without the answer." },
              { id: "pm-outline", title: "Outline PRD", desc: "Takes the idea + clarifying answers and proposes a 7-section PRD outline with a ticket estimate. The PM edits and approves the outline before drafting begins." },
              { id: "pm-draft", title: "Draft PRD", desc: "Writes each section to the standard of a staff PM at a top-tier product company — quantified problems, named personas, explicit tradeoffs, no filler language. Streams section-by-section." },
              { id: "pm-tickets", title: "Generate tickets", desc: "Turns the finished PRD into Linear-ready engineering tickets with imperative titles, testable acceptance criteria in Given/When/Then format, priority, estimate, and labels." },
            ].map((skill) => (
              <div key={skill.id} className="flex gap-4">
                <SpecNumber className="flex-shrink-0 mt-0.5">{skill.id}</SpecNumber>
                <div>
                  <p className="text-sm font-medium text-[var(--ink)] mb-1">{skill.title}</p>
                  <p className="text-xs text-[var(--graphite)] leading-relaxed">{skill.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard specId="§3 / STACK" title="Tech stack">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {[
              ["Frontend", "Next.js 15 (App Router)"],
              ["Hosting", "Vercel"],
              ["AI SDK", "Vercel AI SDK v4"],
              ["LLM", "OpenAI gpt-4o-mini"],
              ["Agent", "Hermes Agent (Nous Research)"],
              ["Auth + DB", "Supabase"],
              ["Styling", "Tailwind CSS v4 + shadcn/ui"],
              ["Rate limit", "Upstash Redis"],
            ].map(([layer, choice]) => (
              <div key={layer} className="flex gap-2 py-1 border-b border-[var(--mist)]">
                <span className="text-xs font-mono text-[var(--graphite)] w-24 flex-shrink-0">{layer}</span>
                <span className="text-xs text-[var(--ink)]">{choice}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard specId="§4 / SOURCE" title="Open source">
          <p className="text-sm text-[var(--graphite)] leading-relaxed mb-4">
            Both repos are public and MIT licensed. The Hermes fork preserves the "forked from NousResearch/hermes-agent" badge — that lineage is part of the point.
          </p>
          <div className="flex gap-3">
            <a href="https://github.com/niraj28rai/mypmagent" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">Next.js app →</Button>
            </a>
            <a href="https://github.com/niraj28rai/hermes-agent/tree/mypmagent" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="sm">Hermes fork →</Button>
            </a>
          </div>
        </SectionCard>
      </main>

      <HairlineRule />
      <footer className="px-8 py-4 flex items-center justify-between">
        <SpecNumber>§00 / MY · PM · AGENT</SpecNumber>
        <span className="text-xs text-[var(--graphite)]">MIT License · forked from Nous Research</span>
      </footer>
    </div>
  );
}
