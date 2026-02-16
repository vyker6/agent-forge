# Agent Maker for Claude Code

## Overview

A full-stack web application for visually creating, managing, and deploying local agents for Claude Code. Users can design agents with custom system prompts, configure skills and slash commands, map project file structures, generate agents with AI, and export everything as ready-to-install `.claude/` directory bundles.

## Architecture

- **Frontend**: React 18 + TypeScript + Vite, Shadcn UI (New York style, 48 components), wouter routing, TanStack Query
- **Backend**: Express 5 API with PostgreSQL via Drizzle ORM
- **AI**: Anthropic SDK (Claude Sonnet) for natural-language agent generation
- **Export**: ZIP generation (archiver) for `.claude/` directory bundles
- **Styling**: Tailwind CSS + custom "Folio" design system (HSL variables, Playfair Display / DM Sans / JetBrains Mono fonts)

## Getting Started

1. The app runs on port 5000 (`npm run dev`)
2. PostgreSQL is required (`DATABASE_URL` env var)
3. AI features are optional (`ANTHROPIC_API_KEY` env var)
4. On first run, seed data creates 3 example agents + a starter project

## File Structure

```
client/src/
  pages/              9 route pages (agents, editor, builder, projects, deploy, import, templates)
  components/ui/      48 Shadcn UI components
  components/         9 custom components (sidebar, agent-icon, markdown-preview, etc.)
  data/               Static data (skill catalog, templates, field help, tool descriptions)
  hooks/              use-toast, use-mobile
  lib/                Query client, markdown generator, utilities
  index.css           Design system (CSS variables, themes, animations)
  App.tsx             Router + layout

server/
  index.ts            Express entry, middleware, Vite integration
  routes.ts           ~47 API endpoints (CRUD, export, import, AI generation)
  storage.ts          Database layer (Drizzle ORM)
  seed.ts             Initial data seeding
  ai-generate.ts      Anthropic AI integration
  ai-prompts.ts       AI generation prompts
  import-parser.ts    ZIP/markdown import parsing

shared/
  schema.ts           Drizzle tables, Zod schemas, TypeScript types, constants

tests/                Vitest test suite (routes, import parser, schema)
script/build.ts       Production build (Vite + esbuild)
```

## Key Features

- **Agent Designer**: Create agents with name, description, system prompt, model, tools, memory scope, permission mode, icon, color
- **Skills Manager**: Add skills with instructions, context, allowed tools (generates `SKILL.md` files)
- **Commands Manager**: Create slash commands with prompt templates (generates `.claude/commands/*.md`)
- **File Map Builder**: Define project structure maps for agent context
- **AI Builder**: Describe what you want in natural language → AI generates full agent config
- **Projects**: Bundle multiple agents with rules, settings, hooks, and MCP servers
- **Deploy**: Download ZIP exports of complete `.claude/` directories, or use quick-install curl commands
- **Import**: Upload existing `.claude/` ZIPs or paste markdown content
- **Templates**: Browse and use pre-built agent templates
- **Likes**: Community-style like counts on agents

## Data Model

- `agents` → `skills`, `commands`, `fileMapEntries` (one-to-many)
- `projects` → `projectAgents` (junction), `rules`, `projectSettings`, `hooks`, `mcpServers`
- `agentLikes` — Agent like tracking by client ID

## Routes

| Path | Page |
|---|---|
| `/agents` | Agent gallery with likes and download |
| `/agents/:id` | Agent editor (Config, Skills, Commands, File Map, Preview) |
| `/build` | AI-powered agent builder |
| `/projects` | Project list |
| `/projects/:id` | Project editor (Agents, Rules, Settings, Hooks, MCP) |
| `/deploy` | Export wizard with file tree preview |
| `/import` | Import from ZIP or markdown |
| `/templates` | Browse pre-built templates |

## API Endpoints

- CRUD: `/api/agents`, `/api/agents/:id/skills`, `/api/agents/:id/commands`, `/api/agents/:id/file-map`
- CRUD: `/api/projects`, `/api/projects/:id/agents`, `/api/projects/:id/rules`, `/api/projects/:id/settings`, `/api/projects/:id/hooks`, `/api/projects/:id/mcp-servers`
- Export: `GET /api/agents/:id/download` (single agent ZIP), `GET /api/projects/:id/export` (full project ZIP)
- Import: `POST /api/projects/import` (ZIP upload), `POST /api/projects/import/markdown` (paste)
- AI: `POST /api/agents/generate` (natural language → agent config)
- Social: `POST /api/agents/:id/like`, `GET /api/likes`

## Design System

The "Folio" design system lives in:
- `client/src/index.css` — CSS variables (HSL colors, light/dark themes), custom utilities, animations
- `tailwind.config.ts` — Extended palette, sidebar colors, status indicators
- `client/src/components/ui/` — 48 Shadcn components (New York style)
- `client/index.html` — Google Fonts (Playfair Display, DM Sans, JetBrains Mono)

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (required)
- `ANTHROPIC_API_KEY` — Enables AI agent generation (optional)
- `PORT` — Server port (default: 5000)
