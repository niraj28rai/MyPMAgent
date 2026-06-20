import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callHermes, parseJSON } from "@/lib/hermes";
import { ClarifyOutputSchema } from "@/lib/schemas";

const SYSTEM = `You are a senior PM assistant. Given a raw product idea or call transcript, generate 3-5 targeted clarifying questions to help write a better PRD.

Return ONLY valid JSON with no markdown fences, no explanation:
{"questions":[{"id":"Q1","text":"...","why_it_matters":"...","optional":false}]}

Rules:
- Generate exactly 3-5 questions
- optional: true only if the PRD can proceed without the answer
- Ask specific questions, not generic boilerplate
- Do not ask about things clearly stated in the input`;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: session } = await supabase.from("sessions").select("*").eq("id", id).single();
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const prompt = [
    `IDEA:\n${session.raw_idea}`,
    session.transcript ? `TRANSCRIPT:\n${session.transcript}` : null,
  ].filter(Boolean).join("\n\n");

  try {
    const text = await callHermes(SYSTEM, prompt, 2000);
    console.log("[clarify-retry] raw:", text.slice(0, 300));
    const parsed = ClarifyOutputSchema.parse(parseJSON(text));

    // Delete old clarifications and insert fresh ones
    await supabase.from("clarifications").delete().eq("session_id", id);
    await supabase.from("clarifications").insert(
      parsed.questions.map((q, i) => ({
        session_id: id,
        question: q.text,
        why_it_matters: q.why_it_matters,
        optional: q.optional,
        order_index: i,
      }))
    );

    return NextResponse.json({ questions: parsed.questions });
  } catch (e) {
    console.error("[clarify-retry] failed:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
