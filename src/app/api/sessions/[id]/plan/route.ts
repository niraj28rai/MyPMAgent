import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callHermes, parseJSON } from "@/lib/hermes";
import { OutlineOutputSchema } from "@/lib/schemas";

const SYSTEM = `You are a senior PM. Given a product idea, transcript, and clarifying Q&A, propose a PRD outline.

Return ONLY valid JSON with no markdown fences:
{"sections":[{"id":"§1","title":"Problem","what_it_covers":"one specific sentence about what this section covers for THIS product"}],"ticket_estimate":5}

Always include exactly these 7 sections in order:
§1 Problem, §2 Users & Personas, §3 Goals, §4 Non-goals, §5 Proposed Solution, §6 Success Metrics, §7 Risks & Open Questions

Rules:
- what_it_covers must be a specific sentence about THIS product, not generic filler
- ticket_estimate is a realistic integer based on the scope described`;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { answers } = await request.json();

  const { data: session } = await supabase
    .from("sessions")
    .select("*, clarifications(*)")
    .eq("id", id)
    .single();

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const qaText = (session.clarifications as { question: string; order_index: number }[])
    .sort((a, b) => a.order_index - b.order_index)
    .map((q, i) => `Q${i + 1}: ${q.question}\nA: ${answers?.[`Q${i + 1}`] || "(skipped)"}`)
    .join("\n\n");

  const prompt = [
    `IDEA:\n${session.raw_idea}`,
    session.transcript ? `TRANSCRIPT:\n${session.transcript}` : null,
    qaText ? `CLARIFICATIONS:\n${qaText}` : null,
  ].filter(Boolean).join("\n\n");

  try {
    const text = await callHermes(SYSTEM, prompt, 2000);
    const parsed = OutlineOutputSchema.parse(parseJSON(text));

    await supabase.from("sessions").update({ state: "plan" }).eq("id", id);

    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
