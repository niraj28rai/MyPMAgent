import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callHermes, parseJSON } from "@/lib/hermes";
import { TicketsOutputSchema } from "@/lib/schemas";

const SYSTEM = `You are a senior PM. Generate Linear-ready engineering tickets from this PRD.

Return ONLY valid JSON with no markdown fences:
{"tickets":[{"id":"T-001","title":"Imperative title under 60 chars","description":"What needs to be built and why","acceptance_criteria":["Given X, when Y, then Z"],"priority":"P1","estimate":"M","labels":["backend"]}]}

Rules:
- ID format: T-001, T-002, T-003 etc.
- Titles: imperative verb, under 60 chars ("Build X", "Add Y", "Implement Z")
- 2-4 acceptance criteria per ticket — testable, specific, Given/When/Then format
- priority: P0 (blocking/critical), P1 (important, ships with feature), P2 (nice to have)
- estimate: S (≤1 day), M (2-3 days), L (4-5 days)
- labels from: frontend, backend, infra, design, api, data, auth, testing
- Generate tickets that match the scope — don't under or over-generate`;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { prdMarkdown, ticketEstimate } = await request.json();

  try {
    const prompt = `TICKET ESTIMATE: ${ticketEstimate}\n\nPRD:\n${prdMarkdown}`;
    const text = await callHermes(SYSTEM, prompt, 6000);
    const parsed = TicketsOutputSchema.parse(parseJSON(text));

    await supabase.from("tickets").insert(
      parsed.tickets.map((t, i) => ({
        session_id: id,
        ticket_id: t.id,
        title: t.title,
        description: t.description,
        acceptance_criteria: t.acceptance_criteria,
        priority: t.priority,
        estimate: t.estimate,
        labels: t.labels,
        order_index: i,
      }))
    );

    await supabase.from("sessions").update({ state: "tickets" }).eq("id", id);

    return NextResponse.json({ tickets: parsed.tickets });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
