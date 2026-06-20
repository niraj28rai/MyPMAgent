import { Button } from "@/components/ui/Button";
import { HairlineRule } from "@/components/ui/HairlineRule";
import { SpecNumber } from "@/components/ui/SpecNumber";
import { TextArea } from "@/components/ui/TextField";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-4">
        <SpecNumber>§00 / MY · PM · AGENT</SpecNumber>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-[var(--graphite)] hover:text-[var(--ink)] transition-colors"
          >
            Sign in
          </Link>
        </div>
      </header>

      <HairlineRule />

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-24 max-w-[768px] mx-auto w-full">
        {/* Headline */}
        <div className="w-full mb-12">
          <h1
            className="font-[family-name:var(--font-instrument-serif)] italic text-[3.5rem] leading-[1.1] tracking-[-0.02em] text-[var(--ink)] mb-6"
          >
            Half-formed ideas
            <br />
            become shipped specs.
          </h1>
          <p className="text-base text-[var(--graphite)] leading-relaxed max-w-[480px]">
            A PM agent that turns a paste-in idea or call transcript into a PRD
            and Linear-ready tickets — with you in the loop at every step.
          </p>
        </div>

        {/* Input */}
        <form className="w-full" action="/app/new" method="POST">
          <TextArea
            name="raw_idea"
            placeholder="Paste your idea, transcript, or both."
            rows={5}
            className="w-full mb-4 text-base"
            aria-label="Your product idea or call transcript"
          />
          <div className="flex justify-end">
            <Button type="submit" size="lg">
              Start →
            </Button>
          </div>
        </form>

        {/* Footer anchors */}
        <div className="w-full mt-24">
          <HairlineRule className="mb-8" />
          <div className="flex gap-8">
            <a
              href="#how-it-works"
              className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--graphite)] hover:text-[var(--ink)] transition-colors"
            >
              §01 / HOW IT WORKS
            </a>
            <a
              href="#hermes"
              className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--graphite)] hover:text-[var(--ink)] transition-colors"
            >
              §02 / FORKED FROM HERMES
            </a>
            <a
              href="https://github.com/niraj28rai/hermes-agent/tree/mypmagent"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--graphite)] hover:text-[var(--ink)] transition-colors"
            >
              §03 / OPEN SOURCE
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
