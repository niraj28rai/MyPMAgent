"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { HairlineRule } from "@/components/ui/HairlineRule";
import { SpecNumber } from "@/components/ui/SpecNumber";
import { TextArea } from "@/components/ui/TextField";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!idea.trim()) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_idea: idea }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (data.sessionId) {
        router.push(`/app/${data.sessionId}`);
      } else {
        setError("Something went wrong. Try again.");
        setLoading(false);
      }
    } catch {
      setError("Could not connect. Make sure you are signed in.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col">
      <header className="flex items-center justify-between px-8 py-4">
        <SpecNumber>§00 / MY · PM · AGENT</SpecNumber>
        <Link
          href="/login"
          className="text-sm text-[var(--graphite)] hover:text-[var(--ink)] transition-colors"
        >
          Sign in
        </Link>
      </header>

      <HairlineRule />

      <main className="flex-1 flex flex-col items-center justify-center px-8 py-24 max-w-[768px] mx-auto w-full">
        <div className="w-full mb-12">
          <h1 className="font-[family-name:var(--font-instrument-serif)] italic text-[3.5rem] leading-[1.1] tracking-[-0.02em] text-[var(--ink)] mb-6">
            Half-formed ideas
            <br />
            become shipped specs.
          </h1>
          <p className="text-base text-[var(--graphite)] leading-relaxed max-w-[480px]">
            A PM agent that turns a paste-in idea or call transcript into a PRD
            and Linear-ready tickets — with you in the loop at every step.
          </p>
        </div>

        <form className="w-full" onSubmit={handleStart}>
          <TextArea
            name="raw_idea"
            placeholder="Paste your idea, transcript, or both."
            rows={5}
            className="w-full mb-2 text-base"
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            aria-label="Your product idea or call transcript"
          />
          {error && (
            <p className="text-xs text-[var(--vermilion)] mb-3">{error}</p>
          )}
          <div className="flex justify-end mt-2">
            <Button type="submit" size="lg" disabled={loading || !idea.trim()}>
              {loading ? "Creating session…" : "Start →"}
            </Button>
          </div>
        </form>

        <div className="w-full mt-24">
          <HairlineRule className="mb-8" />
          <div className="flex gap-8 flex-wrap">
            <span className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--graphite)]">
              §01 / HOW IT WORKS
            </span>
            <span className="text-xs font-mono uppercase tracking-[0.08em] text-[var(--graphite)]">
              §02 / FORKED FROM HERMES
            </span>
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
