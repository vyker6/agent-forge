# UX Polish & Non-Technical User Experience

## Goal

Make Agent Maker accessible to non-technical users by simplifying flows, reducing jargon, and adding community features.

## Changes

### Phase 1: Quick Wins (editor & sidebar cleanup)

**4. Remove "Build with AI" sidebar link** — Redundant once Guided Creation is the primary (+) flow.

**6. Conversation Limit dropdown** — Replace `<Input type="number">` with `<Select>` offering: 5, 10, 15, 20, 25, 50, 100, Unlimited.

**8. Expanded text windows** — Skill/command textareas use `min-h-[200px]` with no max-height. Full content always visible.

### Phase 2: Agent Editor Overhaul

**10. Progressive disclosure** — Only show Name, Description, Instructions, Model by default. Everything else (tools, permissions, memory, limits, MCP) collapses behind "Advanced Settings" toggle.

**11. Tool preset bundles** — Replace individual tool toggles with three bundles:
- "Read-Only" → Read, Glob, Grep
- "Read & Write" → Read, Write, Edit, Glob, Grep
- "Full Access" → all tools

**12. Structured instructions builder** — Replace raw textarea with guided form fields:
- "What should this agent do?" (main purpose)
- "What rules should it follow?" (constraints)
- "What tone should it use?" (dropdown: Professional, Friendly, Concise, Detailed)
Auto-compose into system prompt. "Switch to raw editor" toggle for power users.

**5. Install modal** — Single "Install" button opens modal with:
- `claude agent add <agent-name>` CLI command + copy button
- "Or Download as Zip" secondary button

### Phase 3: Sidebar & Navigation

**1. Sidebar agent tabs** — Two sub-tabs under "Agents":
- "Popular" → curated community agents sorted by likes
- "My Agents" → user-created agents (current behavior)

**3. New agent (+) choice** — Clicking + shows popover:
- "Guided Creation" → `/build`
- "Advanced Editor" → `/agents/new`

### Phase 4: Likes System

**14. Agent likes** —
- DB: `agent_likes` table with `(agentId, clientId)` unique constraint
- Client: anonymous UUID in localStorage (`agentMaker.clientId`)
- API: `POST /api/agents/:id/like` (toggle), `GET /api/agents/:id/likes`
- UI: Heart icon + count on agent cards and editor header

### Phase 5: Post-Creation & Install Flows

**2. Post-wizard summary** — After "Create Agent" in wizard, show:
- Agent name/icon/description summary
- `claude agent add <name>` CLI command with copy
- "Advanced Editor" button, "Create Another" link

**13. Quick install/download on agent cards** — Each card gets:
- Install icon button (copies CLI command to clipboard)
- Download icon button (downloads agent .md file)

### Phase 6: Skill Catalog

**7. Skill catalog search** — Curated catalog of ~25 popular skills served from `/api/skills/catalog`. Searchable browser in "Add Skill" form. One-click populate form fields from catalog entry.

## Identity

Anonymous client ID (UUID) stored in localStorage. Sent as `X-Client-Id` header for like operations. No auth required.

## Files Modified

- `shared/schema.ts` — new `agent_likes` table
- `server/routes.ts` — like endpoints, catalog endpoint
- `server/storage.ts` — like operations
- `client/src/components/app-sidebar.tsx` — tabs, remove Build with AI, (+) popover
- `client/src/pages/agent-editor.tsx` — progressive disclosure, bundles, structured builder, install modal, conversation dropdown, expanded textareas
- `client/src/pages/agents.tsx` — tabs, like buttons, install/download buttons
- `client/src/pages/agent-builder.tsx` — post-creation summary
- `client/src/data/skill-catalog.ts` — curated skill catalog
- `client/src/data/popular-agents.ts` — curated popular agent seeds
- `client/src/lib/client-id.ts` — anonymous client ID helper
