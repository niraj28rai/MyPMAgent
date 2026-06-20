import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callHermes, parseJSON } from "@/lib/hermes";
import { DraftOutputSchema } from "@/lib/schemas";

const SYSTEM = `You are a senior PM. Write a complete PRD based on the idea, transcript, clarifications, and approved outline.

Return ONLY a valid JSON array with no markdown fences:
[{"section_id":"§1","content":"full markdown content for this section"},{"section_id":"§2","content":"..."}]

Rules:
- Write every approved section — do not skip any
- Each section must be at least 100 words
- Use markdown: bold for key terms, bullet lists for criteria/options
- Be specific and actionable for THIS product, not generic
- Tone: professional PM document, no fluff`;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sections, answers } = await request.json();

  const { data: session } = await supabase
    .from("sessions")
    .select("*, clarifications(*)")
    .eq("id", id)
    .single();

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const qaText = ((session.clarifications as { question: string; order_index: number }[]) ?? [])
    .sort((a, b) => a.order_index - b.order_index)
    .map((q, i) => `Q${i + 1}: ${q.question}\nA: ${answers?.[`Q${i + 1}`] || "(skipped)"}`)
    .join("\n\n");

  const outlineText = (sections as { id: string; title: string; what_it_covers: string }[])
    .map(s => `${s.id} ${s.title.toUpperCase()}: ${s.what_it_covers}`)
    .join("\n");

  const prompt = [
    `IDEA:\n${session.raw_idea}`,
    session.transcript ? `TRANSCRIPT:\n${session.transcript}` : null,
    qaText ? `CLARIFICATIONS:\n${qaText}` : null,
    `APPROVED OUTLINE:\n${outlineText}`,
  ].filter(Boolean).join("\n\n");

  try {
    const text = await callHermes(SYSTEM, prompt, 8000);
    const parsed = DraftOutputSchema.parse(parseJSON(text));

    await supabase.from("prd_sections").insert(
      parsed.map((s, i) => ({
        session_id: id,
        spec_number: s.section_id,
        title: sections.find((sec: { id: string; title: string }) => sec.id === s.section_id)?.title ?? s.section_id,
        content_md: s.content,
        order_index: i,
        approved: true,
      }))
    );

    await supabase.from("sessions").update({ state: "draft" }).eq("id", id);

    return NextResponse.json({ sections: parsed });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
