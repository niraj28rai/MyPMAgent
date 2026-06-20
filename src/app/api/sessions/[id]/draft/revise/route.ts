import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callHermes, parseJSON } from "@/lib/hermes";
import { DraftSectionSchema } from "@/lib/schemas";

const buildSystem = (sectionTitle: string, sectionId: string) =>
  `You are a Staff PM with 12 years of experience at companies like Stripe, Linear, and Figma. Rewrite the "${sectionTitle}" section (${sectionId}) of a PRD.

Return ONLY a valid JSON object with no markdown fences:
{"section_id":"${sectionId}","content":"full revised markdown content"}

Writing standards:
- Specific, quantified statements — not vague generalizations
- Named personas, not abstract "users"
- Explicit tradeoffs and rationale for every claim
- Minimum 150 words of substantive content per section
- Never use: leverage, synergy, robust, seamless, cutting-edge, game-changer
- Never start bullets with "Ensure" or "Make sure" — say specifically what must be true and how you will know
- The reader finishes this section able to act without scheduling a meeting`;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { section_id, section_title, feedback, prd_context } = await request.json();

  const prompt = [
    `PRD CONTEXT (other sections already written):\n${prd_context}`,
    feedback ? `FEEDBACK / REVISION REQUEST:\n${feedback}` : null,
    `Now rewrite the ${section_id} ${section_title} section incorporating the feedback above. Be specific to this product.`,
  ].filter(Boolean).join("\n\n");

  try {
    const text = await callHermes(buildSystem(section_title, section_id), prompt, 4000);
    const parsed = DraftSectionSchema.parse(parseJSON(text));

    await supabase
      .from("prd_sections")
      .update({ content_md: parsed.content })
      .eq("session_id", id)
      .eq("spec_number", section_id);

    return NextResponse.json(parsed);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
