"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { HairlineRule } from "@/components/ui/HairlineRule";
import { SpecNumber } from "@/components/ui/SpecNumber";
import Link from "next/link";

const RESEND_COOLDOWN = 60;

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendLink() {
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
      setCooldown(RESEND_COOLDOWN);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendLink();
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col">
      <header className="flex items-center justify-between px-8 py-4">
        <Link href="/"><SpecNumber>§00 / MY · PM · AGENT</SpecNumber></Link>
      </header>
      <HairlineRule />
      <main className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-sm">
          {sent ? (
            <div>
              <SpecNumber className="mb-4 block">§01 / CHECK YOUR EMAIL</SpecNumber>
              <h1 className="text-xl font-medium text-[var(--ink)] mb-3">Magic link sent.</h1>
              <p className="text-sm text-[var(--graphite)] leading-relaxed mb-6">
                We sent a sign-in link to <strong className="text-[var(--ink)]">{email}</strong>.
                Click it to continue — no password needed. Check your spam folder if it doesn&apos;t arrive within 60 seconds.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={cooldown > 0 || loading}
                  onClick={sendLink}
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : loading ? "Sending…" : "Resend link"}
                </Button>
                <button
                  className="text-xs text-[var(--graphite)] underline underline-offset-2"
                  onClick={() => { setSent(false); setError(""); }}
                >
                  Use a different email
                </button>
              </div>
              {error && <p className="mt-3 text-xs text-[var(--vermilion)]">{error}</p>}
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <SpecNumber className="mb-4 block">§01 / SIGN IN</SpecNumber>
              <h1 className="text-xl font-medium text-[var(--ink)] mb-8">
                Enter your email to continue.
              </h1>
              <TextField
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
                error={error}
                className="mb-4 w-full"
              />
              <Button type="submit" disabled={loading || !email} className="w-full">
                {loading ? "Sending link…" : "Send magic link"}
              </Button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
