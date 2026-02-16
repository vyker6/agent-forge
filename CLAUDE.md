# Agent Maker for Claude Code

A visual editor and AI-powered builder for creating, managing, and deploying Claude Code agents. Users design agents with system prompts, skills, slash commands, and file maps, then export everything as ready-to-install `.claude/` directory bundles.

## Commands

- `npm run dev` — Start dev server (port 5000, tsx + Vite HMR)
- `npm run build` — Production build (Vite client + esbuild server → dist/)
- `npm run start` — Run production build
- `npm run check` — TypeScript type-check (`tsc`)
- `npm test` — Run test suite (Vitest)
- `npm run db:push` — Push Drizzle schema to PostgreSQL

## Architecture

```
client/          React SPA (Vite + TypeScript)
server/          Express API (TypeScript, runs via tsx)
shared/          Shared schema (Drizzle ORM tables + Zod validators)
tests/           Vitest test suite
script/          Build script (esbuild for server bundle)
dist/            Production output (dist/public/ + dist/index.cjs)
```

### Server (server/)

| File | Purpose |
|---|---|
| `index.ts` | Express app setup, middleware, Vite integration, startup sequence |
| `routes.ts` | All API endpoints (~47 routes). CRUD for agents, skills, commands, file maps, projects, rules, settings, hooks, MCP servers. Plus export, import, likes, AI generation |
| `storage.ts` | Database layer — `DatabaseStorage` class with Drizzle ORM over PostgreSQL |
| `seed.ts` | Creates 3 example agents + starter project on first run |
| `ai-generate.ts` | Anthropic SDK integration — generates agent configs from natural language |
| `ai-prompts.ts` | System prompt for AI agent generation |
| `import-parser.ts` | Parses ZIP uploads and markdown content into DB entities |
| `vite.ts` | Vite dev server middleware with SPA catch-all |
| `static.ts` | Production static file serving from dist/public |

### Client (client/src/)

| Directory | Purpose |
|---|---|
| `pages/` | 9 route pages (see Routing below) |
| `components/ui/` | 48 Shadcn UI components (New York style) |
| `components/` | 9 custom components (sidebar, icons, markdown preview, etc.) |
| `data/` | Static data — skill catalog (30+), templates, field help, tool descriptions |
| `hooks/` | `use-toast`, `use-mobile` |
| `lib/` | Query client, markdown generator, utils, client ID |

### Shared (shared/)

`schema.ts` — Single source of truth for all data types. Contains:
- Drizzle ORM table definitions (PostgreSQL)
- Zod insert schemas (via drizzle-zod)
- TypeScript types exported for both client and server
- Constants: `AVAILABLE_TOOLS`, `AVAILABLE_MODELS`, `MEMORY_SCOPES`, `PERMISSION_MODES`, `AGENT_ICONS`, `HOOK_EVENTS`

## Data Model

**Core entities:** agents → skills, commands, fileMapEntries (1:many)
**Project system:** projects → projectAgents (junction) → agents; projects → rules, projectSettings, hooks, mcpServers
**Social:** agentLikes (agent + clientId)

Key tables: `agents`, `skills`, `commands`, `fileMapEntries`, `projects`, `projectAgents`, `rules`, `projectSettings`, `hooks`, `mcpServers`, `agentLikes`

## Routing (wouter)

| Path | Page | File |
|---|---|---|
| `/` | Welcome redirect (→ /build or /agents) | `App.tsx` |
| `/agents` | Agent gallery with likes, download | `agents.tsx` |
| `/agents/:id` | Agent editor (Config, Skills, Commands, File Map, Preview tabs) | `agent-editor.tsx` |
| `/projects` | Project list | `projects.tsx` |
| `/projects/:id` | Project editor (Agents, Rules, Settings, Hooks, MCP tabs) | `project-editor.tsx` |
| `/build` | AI-powered agent builder | `agent-builder.tsx` |
| `/templates` | Browse pre-built templates | `templates.tsx` |
| `/import` | Import from ZIP or markdown | `import.tsx` |
| `/deploy` | Export wizard with file tree preview | `deploy.tsx` |

## Key API Endpoints

- `GET/POST /api/agents` — List/create agents
- `GET/PATCH/DELETE /api/agents/:id` — Agent CRUD
- `GET /api/agents/:id/download` — Download single agent as ZIP (agent + skills + commands)
- `GET/POST /api/agents/:id/skills` — Agent skills
- `GET/POST /api/agents/:id/commands` — Agent commands
- `GET /api/projects/:id/export` — Download full project as ZIP (all agents + rules + settings + hooks + MCP)
- `GET /api/projects/:id/export?format=json` — JSON plugin export
- `POST /api/projects/import` — Upload ZIP import (multer)
- `POST /api/agents/generate` — AI-powered agent generation (requires ANTHROPIC_API_KEY)

## Design System

The app uses the "Folio" design system — a luxury editorial aesthetic with warm/cool neutrals and per-agent accent colors.

### Where to find it

| What | Where |
|---|---|
| CSS variables & theme | `client/src/index.css` — HSL color system, light/dark modes, animations, elevation utilities |
| Tailwind config | `tailwind.config.ts` — Extended colors, sidebar system, status indicators |
| Shadcn components | `client/src/components/ui/` — 48 components, New York style variant |
| Shadcn config | `components.json` — Style "new-york", base color "neutral" |
| Fonts | `client/index.html` — Google Fonts: Playfair Display (display), DM Sans (body), JetBrains Mono (code) |

### Typography

- **Display/headings:** Playfair Display (serif)
- **Body/UI:** DM Sans (sans-serif)
- **Code:** JetBrains Mono (monospace)

### Color system

HSL-based CSS custom properties in `index.css`. Light mode uses warm neutrals, dark mode uses cool charcoals. Agent-specific accent colors applied via `data-agent-color` attribute and CSS custom properties.

### Custom CSS utilities (defined in index.css)

- `.hover-elevate` / `.active-elevate` / `.toggle-elevate` — Hover/press/toggle overlay effects
- `.label-uppercase` — Editorial uppercase label style
- `.heading-display` — Display heading (Playfair Display)
- `.card-hover` — Card lift effect on hover
- `.accent-wash` — Agent accent background
- `.skeleton-pulse` — Loading shimmer animation

### Animations

Page entrance (fade + slide), dialog scale-in, toast slide-in, button press — all defined as `@keyframes` in `index.css`.

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | No | Enables AI agent generation (Claude Sonnet) |
| `PORT` | No | Server port (default: 5000) |

## Testing

Tests are in `tests/` and run with Vitest:
- `tests/server/routes.test.ts` — API endpoint tests
- `tests/server/import-parser.test.ts` — ZIP/markdown parsing tests
- `tests/shared/schema.test.ts` — Schema validation tests

## Conventions

- All database IDs are UUIDs
- Slugs are derived from names: `toLowerCase().replace(/\s+/g, "-")`
- Boolean fields stored as strings (`"true"` / `"false"`) in DB for schema compatibility
- Client uses TanStack Query with query keys matching API paths (e.g., `["/api/agents"]`)
- ZIP downloads use `fetch()` → `.blob()` → `URL.createObjectURL()` pattern (not bare `<a href>`)
- Server ZIP generation uses the `archiver` library
- AI generation uses Anthropic SDK with Claude Sonnet, rate-limited to 10 req/min/IP
