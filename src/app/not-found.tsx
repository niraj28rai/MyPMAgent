import Link from "next/link";
import { SpecNumber } from "@/components/ui/SpecNumber";
import { HairlineRule } from "@/components/ui/HairlineRule";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col">
      <header className="flex items-center px-8 py-4">
        <Link href="/"><SpecNumber>§00 / MY · PM · AGENT</SpecNumber></Link>
      </header>
      <HairlineRule />
      <main className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <SpecNumber className="mb-4 block">§404 / NOT FOUND</SpecNumber>
        <h1 className="font-[family-name:var(--font-instrument-serif)] italic text-[2.25rem] tracking-[-0.015em] text-[var(--ink)] mb-3">
          This page does not exist.
        </h1>
        <p className="text-sm text-[var(--graphite)] mb-8 max-w-sm leading-relaxed">
          The session or page you are looking for may have been deleted or never existed. Start fresh from the homepage.
        </p>
        <Link href="/"><Button variant="primary">Back to homepage</Button></Link>
      </main>
    </div>
  );
}
