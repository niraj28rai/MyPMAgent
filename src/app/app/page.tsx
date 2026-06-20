import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SpecNumber } from "@/components/ui/SpecNumber";
import { HairlineRule } from "@/components/ui/HairlineRule";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default async function AppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col">
      <header className="flex items-center justify-between px-8 py-4">
        <Link href="/">
          <SpecNumber>§00 / MY · PM · AGENT</SpecNumber>
        </Link>
        <form action="/auth/signout" method="POST">
          <button
            type="submit"
            className="text-sm text-[var(--graphite)] hover:text-[var(--ink)] transition-colors"
          >
            Sign out
          </button>
        </form>
      </header>

      <HairlineRule />

      <main className="flex-1 flex flex-col items-center justify-center px-8 py-24 max-w-[768px] mx-auto w-full">
        <SpecNumber className="mb-4 block">§01 / YOUR SESSIONS</SpecNumber>
        <h1 className="text-2xl font-medium text-[var(--ink)] mb-3">
          Welcome back.
        </h1>
        <p className="text-sm text-[var(--graphite)] mb-8">
          Signed in as {user.email}
        </p>
        <Link href="/">
          <Button variant="primary">Start a new session →</Button>
        </Link>
      </main>
    </div>
  );
}
