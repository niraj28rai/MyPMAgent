# CLAUDE.md — MyPMAgent

> **Working name: MyPMAgent.** Renameable in one place (see §10.1).
> A PM AI agent that turns raw ideas / call transcripts into a structured PRD and Linear-ready tickets.
> Built by forking Nous Research's Hermes Agent and shipping a Next.js UI on top.

---

## §0 / How Claude Code should use this doc

This file is the single source of truth. Read it end-to-end before writing any code.
Execute build phases in §8 **in order**. Do not skip ahead.
When a phase says "STOP", stop and wait for human review before proceeding.
Treat the design tokens in §6 as inviolable — no improvising colors, fonts, or radii.

## §0.1 / Naming + repo conventions (locked)

| Thing | Name | Notes |
|---|---|---|
| Display name | **MyPMAgent** | Used in hero, README, post |
| URL slug / lowercase | `mypmagent` | Used in branches, dirs, env keys |
| Mono spec-number treatment | `MY · PM · AGENT` | Dots as visual separators in the spec-number label — see §6.3 |
| Hermes fork repo | `<your-handle>/hermes-agent` | Forked from `NousResearch/hermes-agent`. **Keep the original name** — preserves the "forked from" badge on GitHub, which is core to the LinkedIn story. The PM skills live on a `mypmagent` branch inside this fork. |
| Next.js app repo | `<your-handle>/mypmagent` | Separate repo. This is the one people will star. |
| Vercel project | `mypmagent` | Yields `https://mypmagent.vercel.app`. If globally taken, fall back to `my-pm-agent` or `mypmagent-app` (see Phase 6). |
| Supabase project | *(existing — shared with another portfolio app)* | Do NOT create a new one. Use the `mypmagent` Postgres schema for isolation. See §7. |
| Supabase schema | `mypmagent` | All tables namespaced here. |

---

## §1 / PRD

### 1.1 Problem
Product managers spend 60–90 minutes per idea turning a half-formed thought (or a 30-min call transcript) into:
- a PRD their team will read
- a set of tickets engineering can pick up

Existing tools (ChatGPT, Notion AI) generate generic, formless output. PMs end up rewriting half of it.

### 1.2 The user (for the demo)
**Persona: "Riya, fictional PM at a Series B SaaS."**
- 3 yrs PM experience
- Writes 2–3 PRDs/month
- Hates blank-page syndrome, hates ticket-grooming Fridays
- Lives in Linear + Notion

### 1.3 The job
> **Raw idea (or transcript) → structured PRD + Linear-ready tickets, with the PM in control at every step.**

### 1.4 In scope (v1)
- Text input: paste an idea, paste a transcript, or both
- Plan-then-confirm-then-execute loop (HITL on each step)
- Streaming, structured PRD output
- Linear-format ticket output (importable as CSV / pastable as Markdown)
- Auth + session save/resume
- Copy-to-clipboard + Markdown export
- One eval harness with 5 golden inputs

### 1.5 Out of scope (explicit)
- No Linear API write. Output is copy-pasteable. (Cuts auth scope, OAuth review, write permissions.)
- No transcript file upload (paste only — saves storage + parsing).
- No voice input.
- No team/collab features.
- No analytics dashboards.
- No mobile-first design (responsive, but desktop is the hero).

### 1.6 Success metric (primary)
LinkedIn post engagement: **>150 reactions + >10 thoughtful comments** within 7 days of posting.
Secondary: 5 PMs from network ask for the GitHub link unprompted.

### 1.7 Why this wins on LinkedIn
The video shows a 25-second loop: paste messy idea → see the agent's plan → approve → watch the PRD stream in section-by-section → tickets fan out as a grid → one-click copy. The wow is **speed × restraint × visible craft**. The story is "I forked Hermes (an open-source agent from Nous Research) and added 4 custom PM skills."

---

## §2 / The agent loop (the product)

```
[paste idea/transcript]
        │
        ▼
   ┌─────────────────────────────────────┐
   │ STEP 1: CLARIFY                     │
   │ Agent asks 3–5 targeted questions   │
   │ to fill gaps. User answers or skips.│
   └─────────────────────────────────────┘
        │
        ▼
   ┌─────────────────────────────────────┐
   │ STEP 2: PLAN                        │
   │ Agent proposes PRD outline +        │
   │ ticket count. User edits/approves.  │
   └─────────────────────────────────────┘
        │
        ▼
   ┌─────────────────────────────────────┐
   │ STEP 3: DRAFT PRD                   │
   │ Streams PRD sections in order.      │
   │ User can stop, edit any section,    │
   │ then continue.                      │
   └─────────────────────────────────────┘
        │
        ▼
   ┌─────────────────────────────────────┐
   │ STEP 4: GENERATE TICKETS            │
   │ Streams tickets as cards. User      │
   │ edits, deletes, re-orders.          │
   └─────────────────────────────────────┘
        │
        ▼
   [export: copy MD | copy CSV | download]
```

Each step is a single Hermes skill call (§5.3).

---

## §3 / Architecture

```
┌─────────────────────────┐    HTTPS    ┌─────────────────────────┐
│  Next.js 15 (Vercel)    │ ──────────▶ │  Hermes Agent (Docker)  │
│  - App Router           │             │  - port 8642            │
│  - Vercel AI SDK        │             │  - 4 custom PM skills   │
│  - Tailwind + shadcn    │             │  - OpenAI gpt-4o-mini   │
└─────────────────────────┘             └─────────────────────────┘
            │
            ▼
┌─────────────────────────┐
│  Supabase               │
│  - Auth (magic link)    │
│  - Postgres (sessions)  │
│  - RLS on all tables    │
└─────────────────────────┘
```

**Why this shape:** Hermes already speaks OpenAI's API format on `:8642`. Our Next.js app uses the Vercel AI SDK with `baseURL` pointed at Hermes instead of `api.openai.com`. Zero glue code. The "fork" lives entirely in the Hermes skills we add — that's where the PM IP is.

**For local dev:** Hermes runs in Docker on `localhost:8642`. Frontend on `localhost:3000`.
**For demo:** Either keep Hermes local during the screencast (no hosting cost), or deploy to Fly.io free shared-cpu VM.

---

## §4 / Tech stack (locked — do not substitute)

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | Next.js 15 (App Router) | Matches stack constraint |
| Hosting (UI) | Vercel | Matches stack constraint |
| AI SDK | Vercel AI SDK v4 (`ai` + `@ai-sdk/openai`) | `streamObject` for structured output, drop-in `baseURL` swap |
| LLM | OpenAI `gpt-4o-mini` via Hermes | $0.15/M in, $0.60/M out — fits budget |
| Styling | Tailwind CSS v4 + shadcn/ui | Speed, taste, controllable |
| Type primitives | Instrument Serif + Inter + JetBrains Mono | See §6.2 |
| Motion | Framer Motion (sparingly) | See §6.5 |
| Schema validation | Zod | For structured agent outputs |
| Auth + DB | Supabase | Matches stack constraint |
| Rate limit | Upstash Redis (free tier) | 10 generations/user/day |
| Agent backend | Hermes Agent (Python, Docker) | Assignment constraint |
| Package manager | `pnpm` | Faster, deterministic |

---

## §5 / The Hermes fork

### 5.1 Setup
```bash
# 1. Fork github.com/NousResearch/hermes-agent on GitHub via the GitHub UI
# 2. Clone the fork locally
git clone https://github.com/<YOUR_USERNAME>/hermes-agent.git
cd hermes-agent

# 3. Add upstream for future syncs
git remote add upstream https://github.com/NousResearch/hermes-agent.git

# 4. Create the MyPMAgent branch
git checkout -b mypmagent
```

### 5.2 Configure to use OpenAI gpt-4o-mini
Edit `config.yaml` (Hermes ships with this):
```yaml
provider: openai
model: gpt-4o-mini
api_base: https://api.openai.com/v1
api_key_env: OPENAI_API_KEY

server:
  api_compatible: openai
  port: 8642

memory:
  enabled: true
  scope: session

skills:
  dir: ./skills/mypmagent
```

### 5.3 Add 4 custom PM skills
Create `skills/mypmagent/` with these files. Each skill is a Python module with a prompt + structured output schema.

**`skills/mypmagent/clarify.py`**
- Input: `{ raw_idea: str, transcript: str | None }`
- Output: `{ questions: Question[] }` where `Question = { id, text, why_it_matters, optional }`
- Generates 3–5 targeted clarifying questions. Marked `optional: false` only if the PRD genuinely can't proceed without an answer.

**`skills/mypmagent/outline_prd.py`**
- Input: `{ raw_idea, transcript, clarifications: Answer[] }`
- Output: `{ sections: Section[], ticket_estimate: number }` where `Section = { id, title, what_it_covers }`
- Proposes a PRD outline (typically: Problem, Users, Goals, Non-goals, Solution, Success Metrics, Risks, Open Questions). Estimates ticket count.

**`skills/mypmagent/draft_prd.py`**
- Input: `{ context, approved_sections }`
- Output: streams `{ section_id, content: markdown }` one section at a time
- Streams PRD section-by-section. Frontend renders each as it arrives.

**`skills/mypmagent/generate_tickets.py`**
- Input: `{ prd_markdown, ticket_estimate }`
- Output: `{ tickets: Ticket[] }` where `Ticket = { id, title, description, acceptance_criteria[], priority: 'P0'|'P1'|'P2', estimate: 'S'|'M'|'L', labels[] }`
- Generates Linear-shaped tickets. Includes acceptance criteria (the bit ChatGPT skips).

### 5.4 Skill prompt principles
- Write prompts as if briefing a senior PM. Specific, not generic.
- Show 1 high-quality example in the system prompt (one-shot beats zero-shot for structured PM output).
- Schema is enforced via Zod on the Next.js side AND via the prompt itself ("Respond only with valid JSON matching this schema: …").
- No "as an AI" preambles. The skill outputs the artifact, nothing else.

### 5.5 Docker setup
Add `Dockerfile.mypmagent` to the fork root:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install -e ".[all]"
EXPOSE 8642
CMD ["hermes", "serve", "--config", "config.yaml"]
```

And `docker-compose.yml` at the same level:
```yaml
services:
  hermes:
    build: { context: ., dockerfile: Dockerfile.mypmagent }
    ports: ["8642:8642"]
    env_file: .env
    restart: unless-stopped
```

---

## §6 / Design system

**The aesthetic: "the spec sheet."** This product is *about* writing specs. Lean into it. The UI should feel like a designed engineering document, not a SaaS chrome wrapper. Avoid the three AI-design defaults: cream/serif/terracotta, near-black/acid-green, and broadsheet hairlines.

### 6.1 Palette
```
--ink:        #0E0E10  /* primary text, structural rules */
--paper:      #FCFBF8  /* background, off-white but warmer than pure white */
--graphite:   #6B6B70  /* secondary text */
--mist:       #E5E3DD  /* dividers, ticket borders */
--blueprint:  #1E3A8A  /* THE accent — used sparingly: links, primary CTA, active state */
--vermilion:  #C8553D  /* destructive only — delete, error */
--paper-2:    #F4F1EA  /* card backgrounds when needed */
```
Single accent rule: blueprint is the only chromatic color in normal UI. Vermilion appears only for destructive/error states.

### 6.2 Type
```
Display:  "Instrument Serif", serif      — H1, hero, italic emphasis
Body:     "Inter", sans-serif            — everything else
Mono:     "JetBrains Mono", monospace    — spec numbers, ticket IDs, labels, codes
```
Load via `next/font/google`. No webfont flashes.

**Type scale (rem):**
```
Display L:  3.5    weight 400 italic   tracking -0.02em   (hero)
Display M:  2.25   weight 400 italic   tracking -0.015em  (section opens)
H1:         1.875  weight 500          tracking -0.01em
H2:         1.375  weight 500
Body:       1.0    weight 400          line-height 1.6
Small:      0.875  weight 400
Mono S:     0.75   weight 500          letter-spacing 0.08em uppercase
```

### 6.3 Signature element — "spec numbering"
Every PRD section and ticket gets a spec-number prefix in mono uppercase. Tickets are `T-001`, `T-002`. PRD sections are `§1 / PROBLEM`, `§2 / USERS`, etc. The product name itself, when rendered in the mono spec-number style (hero top-left, footer, etc.), uses `§00 / MY · PM · AGENT` — the centered dots break up the 9 letters so it reads as a deliberate label rather than a dense run. In headline-serif contexts (page titles, the `<title>` tag), it's "MyPMAgent" as a single word. This is the one thing the design will be remembered for. Don't overuse — only on section headers, ticket cards, and the brand mark.

### 6.4 Layout primitives
- Border radius: **2px on inputs/buttons, 0px on technical elements (ticket cards, section headers)**. The contrast is the signal.
- Borders: hairline `1px solid var(--mist)`. Never thicker.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 px
- Max content width: 768px for reading flows; 1280px for ticket grid
- No drop shadows. Depth via hairlines and tonal shifts only.

### 6.5 Motion (use sparingly)
- Step transitions: 240ms ease-out crossfade + 4px upward translate
- Streaming PRD section: each section's spec number types in (mono, 18 chars/sec), then content fades in
- Ticket cards: stagger in at 40ms delay each, max 8 visible at once
- `prefers-reduced-motion: reduce` → kill all motion
- That's it. No hover lifts, no gradient sweeps, no glow.

### 6.6 Component inventory (build in this order)
1. `<SpecNumber>` — mono uppercase label
2. `<HairlineRule>` — 1px ink-on-paper divider
3. `<TextField>` / `<TextArea>` — minimal, 2px radius
4. `<Button variant="primary|ghost|destructive">`
5. `<SectionCard>` — for PRD sections, no radius, hairline top border
6. `<TicketCard>` — for tickets, includes spec number, priority chip, acceptance criteria expandable
7. `<PlanCard>` — the agent's proposed plan, editable inline
8. `<QuestionCard>` — clarifying question with answer field
9. `<StreamingMarkdown>` — renders MD as it arrives
10. `<EmptyState>` — for first-run experience

### 6.7 Copy rules (read frontend-design SKILL.md before writing UI copy)
- Sentence case, never title case
- Active voice ("Generate tickets" not "Ticket generation")
- Errors describe what happened and what to do
- Empty state is an invitation, not an apology
- No emoji, no exclamation marks
- Action labels are verbs ("Draft PRD", "Approve plan", "Copy markdown")

### 6.8 Hero (the first thing users and LinkedIn scrollers see)
Above the fold, single screen:
```
                                    [auth chip top-right]

    §00 / MY · PM · AGENT                               ▍

                Half-formed ideas
                become shipped specs.

                A PM agent that turns a paste-in idea
                or call transcript into a PRD and
                Linear-ready tickets — with you in the
                loop at every step.

    ┌─────────────────────────────────────────────────┐
    │  Paste your idea, transcript, or both.          │
    │                                                 │
    │                                                 │
    │                                                 │
    └─────────────────────────────────────────────────┘
                                          [Start →]

    §01 / HOW IT WORKS    §02 / FORKED FROM HERMES    §03 / OPEN SOURCE
```
The headline is Display L italic. The textarea has no placeholder bling — just `Paste your idea, transcript, or both.` in graphite. The CTA is blueprint, 2px radius. Bottom row is mono small-caps section markers — these double as in-page anchors and reinforce the spec-sheet vibe.

---

## §7 / Data model (Supabase)

**Shared-project setup.** This project shares its Supabase instance with another app, so all MyPMAgent tables live in a dedicated `mypmagent` schema. Auth (`auth.users`) is shared across both apps — same user pool, same login session if both apps are on the same domain root. If the other app is on a different domain, users will sign in separately but their `auth.uid()` is the same.

After running the SQL below, **expose the schema** in Supabase dashboard → Settings → API → "Exposed schemas" — add `mypmagent` alongside `public`. Then in the Supabase client init (§8 Phase 4), pass `{ db: { schema: 'mypmagent' } }`.

```sql
-- 1. Create the namespace
create schema if not exists mypmagent;

-- 2. Tables (all in mypmagent schema, all RLS-protected)

create table mypmagent.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  title text,                      -- auto-titled from raw_idea
  raw_idea text not null,
  transcript text,
  state text not null default 'clarify',   -- clarify | plan | draft | tickets | done
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table mypmagent.clarifications (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references mypmagent.sessions on delete cascade,
  question text not null,
  why_it_matters text,
  answer text,                     -- null until user answers
  optional boolean default false,
  order_index int
);

create table mypmagent.prd_sections (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references mypmagent.sessions on delete cascade,
  spec_number text not null,       -- '§1', '§2.1', etc.
  title text not null,
  content_md text,
  order_index int,
  approved boolean default false
);

create table mypmagent.tickets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references mypmagent.sessions on delete cascade,
  ticket_id text not null,         -- 'T-001', 'T-002'
  title text not null,
  description text,
  acceptance_criteria text[],
  priority text check (priority in ('P0','P1','P2')),
  estimate text check (estimate in ('S','M','L')),
  labels text[],
  order_index int
);

-- 3. Enable RLS on every table
alter table mypmagent.sessions enable row level security;
alter table mypmagent.clarifications enable row level security;
alter table mypmagent.prd_sections enable row level security;
alter table mypmagent.tickets enable row level security;

-- 4. Policies
create policy "users see own sessions" on mypmagent.sessions
  for all using (auth.uid() = user_id);

create policy "users see own clarifications" on mypmagent.clarifications
  for all using (
    exists (
      select 1 from mypmagent.sessions s
      where s.id = clarifications.session_id and s.user_id = auth.uid()
    )
  );

create policy "users see own prd_sections" on mypmagent.prd_sections
  for all using (
    exists (
      select 1 from mypmagent.sessions s
      where s.id = prd_sections.session_id and s.user_id = auth.uid()
    )
  );

create policy "users see own tickets" on mypmagent.tickets
  for all using (
    exists (
      select 1 from mypmagent.sessions s
      where s.id = tickets.session_id and s.user_id = auth.uid()
    )
  );

-- 5. Grant access to the authenticated role
grant usage on schema mypmagent to authenticated, anon;
grant all on all tables in schema mypmagent to authenticated;
grant all on all sequences in schema mypmagent to authenticated;
alter default privileges in schema mypmagent grant all on tables to authenticated;
alter default privileges in schema mypmagent grant all on sequences to authenticated;
```

**Migration discipline.** Keep the above SQL in `/db/0001_init.sql` in the Next.js repo. Run it once via the Supabase SQL editor. Any future schema change goes into `/db/0002_*.sql`, `/db/0003_*.sql` so you have a clean migration history without coupling to Supabase CLI (overkill for portfolio scope).

**Don't drop the wrong schema.** Since you share this Supabase project, never run `drop schema public cascade` or anything similar. Only ever touch `mypmagent.*`.

---

## §8 / Build phases — execute in order

> Each phase ends with a STOP. The human reviews, says "continue," then move on.

### Phase 1 — Repo + Hermes fork (½ day)
1. Fork `NousResearch/hermes-agent` on GitHub. Clone locally.
2. Create `mypmagent` branch.
3. Add `Dockerfile.mypmagent` and `docker-compose.yml` per §5.5.
4. Add `config.yaml` per §5.2.
5. Add empty skill stubs in `skills/mypmagent/` (4 files per §5.3).
6. `docker compose up` → confirm Hermes responds at `http://localhost:8642/v1/models`.
7. **STOP. Human runs the curl. Confirms.**

### Phase 2 — The 4 PM skills (1 day)
For each skill in §5.3, in this order — clarify, outline_prd, draft_prd, generate_tickets:
1. Write the system prompt (250–400 words, with one full example).
2. Define the output schema (JSON schema in skill, Zod schema on frontend — kept in sync via a shared schema file copied between repos).
3. Test by curling Hermes directly with a sample input. Verify the JSON output parses.
4. Commit each skill separately.
5. **STOP after all 4 done. Human reviews 1 sample output from each.**

### Phase 3 — Next.js scaffold + design system (½ day)
1. `pnpm create next-app@latest mypmagent --typescript --tailwind --app --src-dir`
2. Install: `ai @ai-sdk/openai @supabase/supabase-js zod framer-motion lucide-react`
3. Set up shadcn/ui base.
4. Add `next/font/google` loaders for Instrument Serif, Inter, JetBrains Mono.
5. Build `globals.css` with the §6.1 CSS variables.
6. Build all 10 components in §6.6 — in isolation, in `/src/components/ui/`, each with a Storybook-style demo route at `/dev/components`.
7. Build the hero per §6.8 at `/`.
8. **STOP. Human opens `/dev/components` and `/`, screenshots both, reviews against §6.**

### Phase 4 — Supabase schema + auth (½ day)
This project shares an existing Supabase project with another app. Do NOT create a new project. All MyPMAgent tables live in a dedicated `mypmagent` schema for isolation.

1. Open the existing Supabase project. Grab URL + anon key + service role key from Settings → API. Save to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...   # server-only, never exposed to client
   ```
2. Save the SQL from §7 to `/db/0001_init.sql` in the repo. Open the Supabase SQL editor, paste, run. Verify all 4 tables exist under the `mypmagent` schema (Table Editor → schema dropdown → `mypmagent`).
3. **Expose the schema:** Settings → API → "Exposed schemas" → add `mypmagent` (comma-separated with `public`). Save.
4. Init the Supabase client with the schema explicitly. Two files:
   - `src/lib/supabase/client.ts` — browser client:
     ```ts
     import { createBrowserClient } from '@supabase/ssr';
     export const createClient = () =>
       createBrowserClient(
         process.env.NEXT_PUBLIC_SUPABASE_URL!,
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
         { db: { schema: 'mypmagent' } }
       );
     ```
   - `src/lib/supabase/server.ts` — server client (similar, using `createServerClient` from `@supabase/ssr` with cookie handlers).
5. Implement magic-link auth flow:
   - `/login` page with email field
   - `/auth/callback` route handler
   - middleware to gate `/app/*` routes
6. **Verify with two browser sessions:**
   - Session A signs in with `user-a@test.com`, creates a session row.
   - Session B signs in with `user-b@test.com`, tries to query Session A's session via the JS client. Must return zero rows (RLS working).
7. **STOP. Human confirms RLS isolation works AND confirms the other app sharing this Supabase project is unaffected.**

### Phase 5 — Wire the agent loop (1 day)
The flow lives at `/app/[sessionId]`. State machine: `clarify → plan → draft → tickets → done`.
1. **Route: `POST /api/sessions`** — creates session, calls `clarify` skill on Hermes, persists questions, returns session id.
2. **`/app/[sessionId]` — step 1 UI**: renders `<QuestionCard>` per clarification. User answers or skips. "Continue" calls step 2.
3. **Route: `POST /api/sessions/[id]/plan`** — calls `outline_prd` skill, persists sections, returns plan.
4. **Step 2 UI**: renders `<PlanCard>` with editable section list. "Approve plan" calls step 3.
5. **Route: `POST /api/sessions/[id]/draft`** — calls `draft_prd` skill with streaming. Uses Vercel AI SDK's `streamObject`. Persists each section as it completes.
6. **Step 3 UI**: streams `<SectionCard>` components in. Each section has an "edit" button (inline textarea) and "regenerate this section" button. "Generate tickets" calls step 4.
7. **Route: `POST /api/sessions/[id]/tickets`** — calls `generate_tickets` skill, persists tickets.
8. **Step 4 UI**: renders `<TicketCard>` grid, stagger-in. Each card editable/deletable. "Export" reveals two CTAs: "Copy as Markdown" (full PRD + tickets), "Copy as Linear CSV" (tickets only, Linear's import format).
9. **STOP. Human runs the full loop with a real idea. Records the screencast.**

### Phase 6 — Rate limit, polish, ship (½ day)
1. Add Upstash rate limit middleware: 10 sessions/user/day.
2. Add 404, 500 pages per §6.7 copy rules.
3. Add `/about` page explaining the fork (mentions Hermes, links to Nous Research).
4. Lighthouse pass: aim for >90 perf, >95 a11y.
5. **Deploy frontend to Vercel with the exact project name `mypmagent`** so the production URL is `https://mypmagent.vercel.app`. Steps:
   - `vercel` CLI: `vercel link` → when prompted for project name, enter `mypmagent` exactly.
   - If `mypmagent` is taken globally on Vercel, the CLI will reject it. Fallbacks in order of preference: `my-pm-agent`, `mypmagent-app`, `<your-handle>-mypmagent`. Update the spec name in §10.1 accordingly.
   - The GitHub repo for the Next.js app should also be named `mypmagent` (matches the Vercel project; clean for the LinkedIn screenshot).
   - The Hermes fork stays at its own repo named `hermes-agent` — preserves the "forked from NousResearch/hermes-agent" badge on GitHub, which is part of the launch story.
6. Add env vars in Vercel project settings: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `HERMES_BASE_URL`, `OPENAI_API_KEY` (only if frontend calls OpenAI directly anywhere — should be Hermes-only), `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`.
7. For the LinkedIn demo: run Hermes locally during the screencast (no hosting needed). The frontend's `HERMES_BASE_URL` in `.env.local` points at `http://localhost:8642`; in Vercel prod it can point at a placeholder or be added later if you deploy Hermes publicly.
8. **STOP. Record the screencast (§10.2). Draft the post (§10.3). Ship.**

**Estimated total: ~4 dev-days.**

---

## §9 / Eval harness

Lightweight. Goal is to show rigor on LinkedIn, not to actually catch regressions.

**Location:** `/evals` in the Hermes fork.

**Structure:**
```
evals/
  golden.json           # 5 inputs (raw_idea / transcript pairs)
  expected_shape.json   # the Zod schemas as JSON
  run.py                # runs each input through all 4 skills, checks schema validity
  README.md             # how to run, what it checks
```

**The 5 golden inputs:**
1. A one-sentence idea ("we should let users export their data")
2. A messy 3-paragraph rant
3. A 600-word call transcript
4. A bug-shaped request (should the agent push back? Yes — it's a PRD agent, not a bug-tracker)
5. A genuinely ambiguous half-thought (tests clarify quality)

**What `run.py` checks (per input):**
- All 4 skills return valid JSON matching their schema
- Clarify returns 3–5 questions
- Outline returns ≥4 sections
- Draft fills every approved section with ≥80 words
- Tickets returns ≥3, each with ≥1 acceptance criterion

Run via `python evals/run.py`. Outputs a pass/fail table. Commit the latest output as `evals/last_run.md`. Screenshot this for the LinkedIn post — it signals craft.

---

## §10 / Launch

### 10.1 Naming
If "MyPMAgent" doesn't land, replace globally via search-and-replace across:
- `package.json` name field
- `<title>` in `app/layout.tsx`
- The hero in §6.8
- README.md
- `/about` page
Single commit. Done.

### 10.2 The screencast (the actual LinkedIn asset)
- **Length:** 25–35 seconds. Hard cap.
- **No voiceover.** Captions only.
- **Resolution:** 1080p, 30fps. Use Loom or QuickTime.
- **Beats:**
  1. (0–3s) Hero shot. Caption: "I built a PM agent in 4 days."
  2. (3–6s) Paste a messy idea. Caption: "Paste a half-formed idea…"
  3. (6–10s) Clarifying questions appear. Caption: "It asks the right questions."
  4. (10–14s) Approve the plan. Caption: "It plans before it writes."
  5. (14–22s) PRD streams in. Caption: "PRD writes itself, section by section."
  6. (22–28s) Tickets fan out. Caption: "Linear-ready tickets."
  7. (28–32s) One click → copied. Caption: "One click to your backlog."
  8. (32–35s) End frame: "MyPMAgent / forked from Hermes Agent (Nous Research) / built with Claude Code"
- **Music:** none. Silence reads as confidence. (Or one quiet ambient track at -20dB if silence feels wrong.)

### 10.3 The LinkedIn post (skeleton — rewrite in your voice)
```
4 days. 1 forked agent. 1 PM tool I'll actually use.

I forked Nous Research's Hermes Agent and turned it into a PM specialist.

The agent does one thing: turns a half-formed idea or call transcript
into a structured PRD and Linear-ready tickets — with the PM in the
loop at every step.

I picked Hermes because it exposes an OpenAI-compatible API.
That meant my Next.js frontend could talk to it like it talks to OpenAI —
zero glue code. All the PM IP lives in 4 custom skills I added:
clarify, outline, draft, generate-tickets.

A few choices I'd defend:
- HITL at every step. The PM approves the plan before the PRD writes.
- "Spec sheet" UI, not SaaS chrome. Mono spec numbers on every section.
- No Linear write API. Copy-paste only. Cuts auth scope, ships faster.

Stack: Next.js + Vercel + Supabase + OpenAI gpt-4o-mini.
Total cost across 4 days of dev + demo: under $2.

This is build #N in my "ship-something-every-week" series.
GitHub link in comments.
```

### 10.4 GitHub README
The repo README is part of the launch asset. Sections:
1. Animated GIF of the loop (extracted from the screencast, ≤5MB)
2. "Why this exists" (1 paragraph)
3. "How it works" (the §2 diagram)
4. "What I forked from Hermes" (link Nous Research, explain the 4 skills)
5. Setup (3 commands max)
6. License (MIT — match Hermes)

---

## §11 / Security

- All Supabase tables have RLS enabled (§7).
- OpenAI API key never leaves the Hermes container.
- Supabase service role key never leaves Next.js API routes (never sent to client).
- Rate limit (Upstash): 10 sessions/user/day.
- Input length cap: 8000 chars on raw_idea, 20000 chars on transcript.
- No PII in server logs (log session IDs, not content).
- CSP header set in `next.config.js` — no inline scripts, no eval.
- Hermes container: don't expose `:8642` publicly without auth. For the local demo this is fine. For hosted, put it behind Vercel API routes only (frontend doesn't talk to Hermes directly — frontend → Next.js route → Hermes).

---

## §12 / Open questions for the human

Resolve these before Phase 5:
1. **Hosting Hermes for the public demo, or local-only?** If public, add Fly.io setup to Phase 6 (~30 min).
2. **Linear CSV format vs. Markdown** — confirm Linear's current CSV import schema before Phase 5.7 (their format changes; verify at `linear.app/docs`).
3. **Magic-link email sender** — Supabase's default or your own SMTP? Default is fine for demo but rate-limited.
4. **Custom domain** — do you want `mypmagent.yourname.com` or default `*.vercel.app`?

---

## §13 / Out of the box — what NOT to build (preventing scope creep)

Claude Code will be tempted to add these. Don't.
- ❌ Dark mode (the design is paper-toned; dark mode dilutes the identity)
- ❌ A landing page beyond the hero
- ❌ Settings panel
- ❌ Pricing page
- ❌ Templates / examples library (one good empty state is enough)
- ❌ Multi-language
- ❌ Comments / collaboration
- ❌ Version history (PRD edits replace, not version)
- ❌ Animated background gradients
- ❌ Confetti on completion
- ❌ Tooltips on every button

If a feature isn't in §1.4, it's out.

---

## §14 / Acceptance checklist (Claude Code reads this before declaring done)

- [ ] `docker compose up` brings up Hermes on `:8642`
- [ ] `curl http://localhost:8642/v1/models` returns a model list
- [ ] `pnpm dev` brings up the frontend on `:3000`
- [ ] `/` matches §6.8 within reasonable visual tolerance
- [ ] `/dev/components` shows all 10 components from §6.6
- [ ] Sign up with magic link works
- [ ] A logged-in user can run the full loop end-to-end with one of the 5 golden inputs
- [ ] PRD streams in section-by-section (not in one chunk)
- [ ] Tickets render as a grid, copy-as-markdown works
- [ ] RLS verified: a second user cannot read the first user's sessions
- [ ] Rate limit kicks in at the 11th session/day
- [ ] `python evals/run.py` passes all 5 inputs
- [ ] Lighthouse: perf >90, a11y >95
- [ ] README has the GIF, the diagram, the 3-command setup
- [ ] Repo public, MIT licensed, links to Nous Research / Hermes
