# Agent Maker Feature Roadmap Design

**Product**: Agent Maker for Claude Code
**Approach**: Full Spec Parity First (phased)
**Date**: 2026-02-15

---

## Overview

The Agent Maker currently covers the basics of Claude Code's agent/skill/command spec but has significant gaps. This design outlines a phased roadmap to achieve full spec parity, add import/round-tripping, streamline integration, and polish the experience.

**Key decisions made during brainstorming**:
- Aesthetic: luxury editorial (The Folio design system — separate doc)
- Priority: spec completeness first, then workflow, then integration
- Install flow: CLI command (primary), ZIP kept as fallback
- Import: critical for round-tripping
- Hooks: full visual builder, not simplified

---

## P0 — Spec Parity for Agents, Skills & Commands

The most impactful phase. Fill all missing Claude Code spec fields and enable inline editing.

### Agent Schema Additions

New database columns on `agents`:

| Column | Type | Default | Description |
|---|---|---|---|
| `disallowedTools` | text[] | `[]` | Tool deny-list (exported as `disallowedTools` frontmatter) |
| `permissionMode` | text | `"default"` | One of: default, acceptEdits, delegate, dontAsk, bypassPermissions, plan |
| `maxTurns` | integer | null | Max agentic turns (null = unlimited) |
| `preloadedSkills` | text[] | `[]` | Skill names to inject at agent startup |

**UI**: New sections in the agent editor Configuration tab:
- "Permissions" section: `permissionMode` dropdown, `maxTurns` number input
- "Disallowed Tools" section: toggle badges (same style as tools, below the allow-list)
- "Preloaded Skills" section: checkbox list of the agent's own skills (only shown when agent has skills)

**Export**: All non-default values emit to YAML frontmatter. Example:
```yaml
---
name: code-reviewer
description: Reviews code for quality
tools: Read, Glob, Grep
disallowedTools: Bash, Write
model: sonnet
memory: project
permissionMode: acceptEdits
maxTurns: 25
skills:
  - security-audit
---
```

### Skill Schema Additions

New database columns on `skills`:

| Column | Type | Default | Description |
|---|---|---|---|
| `argumentHint` | text | `""` | Hint for autocomplete, e.g. `[issue-number]` |
| `disableModelInvocation` | boolean | false | Prevent Claude from auto-loading |
| `userInvocable` | boolean | true | Show in `/` menu |
| `model` | text | `""` | Model override (empty = inherit) |
| `agentType` | text | `"general-purpose"` | Subagent type when context=fork |

**Storage**: Add `updateSkill(id, data)` method. Skills currently support create/delete only.

**UI**: Skills tab switches to inline editing — click a skill card to expand it into an editable form with all fields. Save/cancel buttons per card.

**Export**: All non-default values emit to frontmatter:
```yaml
---
name: security-audit
description: Performs security audit
context: fork
agent: Explore
allowed-tools: Read, Grep, Glob
argument-hint: "[file-path]"
disable-model-invocation: true
---
```

### Command Schema Additions

Commands now support the same fields as skills in Claude Code. New database columns on `commands`:

| Column | Type | Default | Description |
|---|---|---|---|
| `argumentHint` | text | `""` | Autocomplete hint |
| `disableModelInvocation` | boolean | false | Prevent auto-invocation |
| `userInvocable` | boolean | true | Show in menu |
| `model` | text | `""` | Model override |
| `context` | text | `""` | Execution context (main, fork, or empty) |
| `agentType` | text | `""` | Subagent type when context=fork |
| `allowedTools` | text[] | `[]` | Tool restrictions |

**Storage**: Add `updateCommand(id, data)` method.

**UI**: Same inline editing pattern as skills.

### Export Updates

The export endpoint outputs all new fields in YAML frontmatter. Empty/default values are omitted to keep output clean. The `model` field gains an `"inherit"` option (not output to frontmatter, since inherit is the default).

---

## P1 — Rules, Settings & Hooks

### Project Rules (`.claude/rules/*.md`)

New table: `rules`

| Column | Type | Default |
|---|---|---|
| `id` | UUID | auto |
| `projectId` | UUID FK (cascade delete) | — |
| `name` | text | required |
| `paths` | text[] | `[]` |
| `content` | text | `""` |
| `sortOrder` | integer | 0 |

- Rules belong to a project, not an agent
- Each rule exports as `.claude/rules/{name}.md`
- If `paths` is non-empty, YAML frontmatter includes `paths` field with glob patterns
- UI: New "Rules" tab on project editor. Card list with inline editing. Each card shows name, path globs (as badges), and content preview.

### Project Settings (`.claude/settings.json`)

New table: `projectSettings` (one row per project)

| Column | Type | Default |
|---|---|---|
| `id` | UUID | auto |
| `projectId` | UUID FK (unique, cascade delete) | — |
| `permissionAllow` | text[] | `[]` |
| `permissionDeny` | text[] | `[]` |
| `permissionAsk` | text[] | `[]` |
| `defaultPermissionMode` | text | `""` |
| `sandboxEnabled` | boolean | null |
| `sandboxAutoAllow` | boolean | null |
| `sandboxAllowedDomains` | text[] | `[]` |
| `sandboxAllowLocalBinding` | boolean | null |
| `sandboxExcludedCommands` | text[] | `[]` |
| `defaultModel` | text | `""` |

- Exports as `.claude/settings.json`
- Only populated fields are included in JSON output
- UI: New "Settings" tab on project editor. Grouped form sections: Permissions, Sandbox, Model.

### Hooks — Visual Builder

New table: `hooks`

| Column | Type | Default |
|---|---|---|
| `id` | UUID | auto |
| `projectId` | UUID FK (cascade delete) | — |
| `event` | text | required |
| `matcher` | text | `""` |
| `handlerType` | text | required (command, prompt, agent) |
| `command` | text | `""` |
| `prompt` | text | `""` |
| `model` | text | `""` |
| `timeout` | integer | null |
| `statusMessage` | text | `""` |
| `isAsync` | boolean | false |
| `once` | boolean | false |
| `sortOrder` | integer | 0 |

**Supported events** (all 14):
- Session: SessionStart, SessionEnd
- User: UserPromptSubmit
- Tool: PreToolUse, PermissionRequest, PostToolUse, PostToolUseFailure
- Agent: SubagentStart, SubagentStop
- Completion: Stop, TeammateIdle, TaskCompleted
- Maintenance: PreCompact
- Notification: Notification

**UI: Hook builder** on a new "Hooks" tab in the project editor.

Add Hook dialog (stepped):
1. Pick event (grouped dropdown)
2. Configure matcher (context-sensitive — tool name input for tool events, session type for SessionStart, etc.)
3. Pick handler type (command / prompt / agent) with descriptions
4. Configure handler (command text input, or prompt textarea with `$ARGUMENTS` helper, or agent prompt textarea)
5. Optional: timeout, statusMessage, async toggle, once toggle

Hook cards show: event badge → matcher (if any) → handler type badge → first line of content. Expandable inline editing.

**Pre-built templates** (quick-add buttons):
- "Lint before commit" — PreToolUse / `Bash(git commit*)` / command: `npm run lint`
- "Type-check before push" — PreToolUse / `Bash(git push*)` / command: `npx tsc --noEmit`
- "Validate user prompt" — UserPromptSubmit / prompt handler
- "Log all tool uses" — PostToolUse / command handler (async)

**Export**: Hooks emit into the `hooks` key of `.claude/settings.json`, structured per the Claude Code spec format:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "npm run lint"
        }]
      }
    ]
  }
}
```

---

## P2 — Import & Round-Tripping

### Import Flow

**Entry point**: "Import" button on Projects page + sidebar.

**Two methods**:
1. **ZIP upload**: Upload a `.claude/` ZIP or a project ZIP containing `.claude/`
2. **Markdown paste**: Paste individual file contents with a "Parse" button

### Parser (Server-Side)

Dependencies: `gray-matter` (YAML frontmatter parsing), `archiver` (already installed for export).

Parse sequence:
1. Unzip uploaded file
2. Scan for `.claude/` directory
3. For each `.claude/agents/*.md`: parse frontmatter → create agent
4. For each `.claude/skills/*/SKILL.md`: parse frontmatter → create skill
5. For each `.claude/commands/*.md`: parse frontmatter → create command
6. For each `.claude/rules/*.md`: parse frontmatter → create rule
7. Parse `.claude/settings.json` → project settings + hooks
8. Parse `CLAUDE.md` or `.claude/CLAUDE.md` → project claudeMdContent

### Agent-Skill Association

Skills in the filesystem aren't inherently linked to agents. Resolution strategy:
1. Check each agent's `skills` frontmatter for skill names → auto-associate
2. For unmatched skills, show a mapping UI: skill name → agent dropdown
3. Default: assign to first agent or leave unassigned (project-level)

### Conflict Resolution

When importing into an existing project:
- **Name collision**: Modal with options — "Overwrite", "Keep both (rename)", "Skip"
- **Settings collision**: Diff view with merge options

### Re-Export Diff

After editing imported configs, the Deploy page shows:
- File tree with change indicators (added / modified / removed)
- Click any file to see a diff (old vs. new)
- "Download" exports the current state

---

## P3 — MCP Servers, Plugins & CLI Integration

### MCP Server Configuration

New table: `mcpServers`

| Column | Type | Default |
|---|---|---|
| `id` | UUID | auto |
| `projectId` | UUID FK (cascade delete) | — |
| `name` | text | required |
| `command` | text | required |
| `args` | text[] | `[]` |
| `env` | JSON | `{}` |
| `cwd` | text | `""` |

- UI: "MCP Servers" tab on project editor. Card list with inline editing.
- Add agent-level `mcpServers` field (text[]) — references server names from the project.
- Export: `.mcp.json` in ZIP root.

**Pre-built templates**:
- GitHub: `npx -y @modelcontextprotocol/server-github`
- Filesystem: `npx -y @modelcontextprotocol/server-filesystem`
- PostgreSQL: `npx -y @modelcontextprotocol/server-postgres`
- Brave Search: `npx -y @modelcontextprotocol/server-brave-search`

### Plugin Manifest Generation

New export mode: "Export as Plugin" on the Deploy page.

Additional plugin fields (on project or separate config):
- `version` (semver string)
- `author` (name, email, url)
- `homepage`, `repository`, `license`
- `keywords` (text[])

Output structure:
```
my-plugin/
├── plugin.json
├── agents/
├── skills/
├── commands/
├── hooks/
│   └── hooks.json
└── .mcp.json
```

### CLI Install Command

Published as `agent-maker-cli` npm package:

```bash
npx agent-maker install <project-url-or-id>
```

Flow:
1. Fetch project from Agent Maker API
2. Unzip/merge into current `.claude/` directory
3. Prompt for conflicts
4. Report installed files

**API addition**:
```
GET /api/projects/:id/export?format=json
```
Returns structured JSON (not ZIP) for programmatic access.

Deploy page shows the install command pre-filled, ready to copy.

---

## P4 — Preview, Polish & Community

### Live Markdown Preview

Split-pane or tab on the agent editor showing real-time rendered markdown output. Updates as fields change. Syntax-highlighted with mono font.

### Interactive File Tree

On Deploy page: collapsible file tree showing every file in the export. Click any file to see its full contents. Replaces the current static list.

### Template Marketplace (Stretch)

Curated agent templates:
- Full-Stack Developer, Documentation Writer, Security Auditor, DevOps Engineer, Code Migrator
- Each template: name, description, author, agent count, skill count
- One-click import into a project
- Initially curated, eventually community-contributed

### Onboarding

- First-run wizard: "What kind of project?" → suggest templates
- Contextual help tooltips on every field
- Example values in empty states (greyed out, clickable)

---

## Data Model Summary (All Phases)

### New Tables

| Table | Phase | Relationships |
|---|---|---|
| `rules` | P1 | belongs to project |
| `projectSettings` | P1 | one per project |
| `hooks` | P1 | belongs to project |
| `mcpServers` | P3 | belongs to project |

### Modified Tables

| Table | Phase | New Columns |
|---|---|---|
| `agents` | P0 | disallowedTools, permissionMode, maxTurns, preloadedSkills |
| `agents` | P3 | mcpServers (text[]) |
| `skills` | P0 | argumentHint, disableModelInvocation, userInvocable, model, agentType |
| `commands` | P0 | argumentHint, disableModelInvocation, userInvocable, model, context, agentType, allowedTools |
| `projects` | P3 | pluginVersion, pluginAuthor (JSON), pluginHomepage, pluginRepository, pluginLicense, pluginKeywords |

### New Storage Methods

| Method | Phase |
|---|---|
| `updateSkill(id, data)` | P0 |
| `updateCommand(id, data)` | P0 |
| `getRules(projectId)` | P1 |
| `createRule(data)` | P1 |
| `updateRule(id, data)` | P1 |
| `deleteRule(id)` | P1 |
| `getProjectSettings(projectId)` | P1 |
| `upsertProjectSettings(projectId, data)` | P1 |
| `getHooks(projectId)` | P1 |
| `createHook(data)` | P1 |
| `updateHook(id, data)` | P1 |
| `deleteHook(id)` | P1 |
| `getMcpServers(projectId)` | P3 |
| `createMcpServer(data)` | P3 |
| `updateMcpServer(id, data)` | P3 |
| `deleteMcpServer(id)` | P3 |

### New API Endpoints

| Endpoint | Phase |
|---|---|
| `PATCH /api/skills/:id` | P0 |
| `PATCH /api/commands/:id` | P0 |
| `GET/POST /api/projects/:id/rules` | P1 |
| `PATCH/DELETE /api/rules/:id` | P1 |
| `GET/PUT /api/projects/:id/settings` | P1 |
| `GET/POST /api/projects/:id/hooks` | P1 |
| `PATCH/DELETE /api/hooks/:id` | P1 |
| `POST /api/projects/import` | P2 |
| `GET/POST /api/projects/:id/mcp-servers` | P3 |
| `PATCH/DELETE /api/mcp-servers/:id` | P3 |
| `GET /api/projects/:id/export?format=json` | P3 |

---

## New Pages & Navigation

| Page | Route | Phase |
|---|---|---|
| Project Editor | `/projects/:id` | P1 (elevates existing project detail into full editor with tabs) |
| Import | `/import` | P2 |

### Project Editor Tabs (P1)

The current project page is a simple card. P1 elevates it to a full editor with tabs:
- **Agents** — manage assigned agents (existing)
- **Rules** — create/edit `.claude/rules/*.md`
- **Settings** — configure permissions, sandbox, model
- **Hooks** — visual hook builder
- **MCP Servers** — configure MCP servers (P3)

---

## Dependencies & New Packages

| Package | Phase | Purpose |
|---|---|---|
| `gray-matter` | P2 | YAML frontmatter parsing for import |
| `diff` or `jsdiff` | P2 | Diff generation for re-export view |
