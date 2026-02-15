# Agent Maker for Claude Code

## Overview
A web GUI tool for creating, managing, and deploying local agents for Claude Code projects. Users can design agents with custom system prompts, configure skills and slash commands, map project file structures, and export everything as a ready-to-install `.claude/` directory.

## Architecture
- **Frontend**: React + TypeScript + Vite, using Shadcn UI components, wouter routing, TanStack Query
- **Backend**: Express API with PostgreSQL (Drizzle ORM)
- **Export**: ZIP generation using archiver for `.claude/` directory bundles

## Key Features
- Agent Designer: Create agents with name, description, system prompt, model, tools, memory scope, icon, color
- Skills Manager: Add skills with instructions (generates SKILL.md files)
- Commands Manager: Create slash commands with prompt templates
- File Map Builder: Define project structure maps for agent context
- Projects: Bundle multiple agents into deployable configurations
- Deploy: One-click ZIP export of complete `.claude/` directory

## Data Model
- `agents` - Core agent configurations
- `skills` - Agent skills (SKILL.md generators)
- `commands` - Slash command definitions
- `file_map_entries` - Project structure entries per agent
- `projects` - Project bundles
- `project_agents` - Junction table linking projects to agents

## Routes
- `/` - Agent list
- `/agents/:id` - Agent editor (tabs: Config, Skills, Commands, File Map)
- `/projects` - Project management
- `/deploy` - Export configuration

## API Endpoints
- CRUD: `/api/agents`, `/api/agents/:id/skills`, `/api/agents/:id/commands`, `/api/agents/:id/file-map`
- CRUD: `/api/projects`, `/api/projects/:id/agents`
- Export: `GET /api/projects/:id/export` (returns ZIP)

## User Preferences
- Dark mode toggle with localStorage persistence
- Inter font family

## Recent Changes
- Initial build: Full CRUD for agents, skills, commands, file maps, projects
- ZIP export endpoint for `.claude/` directory generation
- Seed data with 3 example agents (Code Reviewer, Architect, Test Engineer)
