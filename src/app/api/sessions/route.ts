import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callHermes, parseJSON } from "@/lib/hermes";
import { ClarifyOutputSchema } from "@/lib/schemas";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }),
  limiter: Ratelimit.slidingWindow(10, "1 d"),
  prefix: "mypmagent:sessions",
});

const SYSTEM = `You are a senior PM assistant. Given a raw product idea or call transcript, generate 3-5 targeted clarifying questions to help write a better PRD.

Return ONLY valid JSON with no markdown fences, no explanation:
{"questions":[{"id":"Q1","text":"...","why_it_matters":"...","optional":false}]}

Rules:
- Generate exactly 3-5 questions
- optional: true only if the PRD can proceed without the answer
- Ask specific questions, not generic boilerplate
- Do not ask about things clearly stated in the input`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success, limit, remaining, reset } = await ratelimit.limit(user.id);
  if (!success) {
    return NextResponse.json(
      {
        error: `Daily limit reached. You have used ${limit} sessions today. Resets at ${new Date(reset).toLocaleTimeString()}.`,
        limit,
        remaining: 0,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
        },
      }
    );
  }

  const body = await request.json();
  const { raw_idea, transcript } = body;
  if (!raw_idea?.trim()) return NextResponse.json({ error: "raw_idea is required" }, { status: 400 });

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({ user_id: user.id, raw_idea, transcript: transcript || null, state: "clarify" })
    .select()
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: sessionError?.message ?? "Failed to create session" }, { status: 500 });
  }

  await supabase.from("sessions").update({
    title: raw_idea.slice(0, 60) + (raw_idea.length > 60 ? "…" : ""),
  }).eq("id", session.id);

  try {
    const prompt = [
      `IDEA:\n${raw_idea}`,
      transcript ? `TRANSCRIPT:\n${transcript}` : null,
    ].filter(Boolean).join("\n\n");

    const text = await callHermes(SYSTEM, prompt, 2000);
    const parsed = ClarifyOutputSchema.parse(parseJSON(text));

    await supabase.from("clarifications").insert(
      parsed.questions.map((q, i) => ({
        session_id: session.id,
        question: q.text,
        why_it_matters: q.why_it_matters,
        optional: q.optional,
        order_index: i,
      }))
    );

    return NextResponse.json({ sessionId: session.id, questions: parsed.questions, remaining });
  } catch (e) {
    console.error("[clarify] failed:", e);
    return NextResponse.json({ sessionId: session.id, questions: [], hermesError: String(e) });
  }
}
