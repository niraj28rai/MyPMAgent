"use client";

import Link from "next/link";
import { SpecNumber } from "@/components/ui/SpecNumber";
import { HairlineRule } from "@/components/ui/HairlineRule";
import { Button } from "@/components/ui/Button";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col">
      <header className="flex items-center px-8 py-4">
        <Link href="/"><SpecNumber>§00 / MY · PM · AGENT</SpecNumber></Link>
      </header>
      <HairlineRule />
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <SpecNumber className="mb-4 block">§500 / SERVER ERROR</SpecNumber>
        <h1 className="font-[family-name:var(--font-instrument-serif)] italic text-[2.25rem] tracking-[-0.015em] text-[var(--ink)] mb-3">
          Something went wrong.
        </h1>
        <p className="text-sm text-[var(--graphite)] mb-8 max-w-sm leading-relaxed">
          An unexpected error occurred. Try again — if the problem persists, start a new session from the homepage.
        </p>
        <div className="flex gap-3">
          <Button variant="primary" onClick={reset}>Try again</Button>
          <Link href="/"><Button variant="ghost">Back to homepage</Button></Link>
        </div>
      </main>
    </div>
  );
}
