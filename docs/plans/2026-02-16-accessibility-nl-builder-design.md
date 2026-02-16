# Accessibility & Natural Language Agent Builder Design

**Product**: Agent Maker for Claude Code
**Approach**: AI Copilot Layer + Comprehensive Label/Help Overhaul
**Date**: 2026-02-16

---

## Overview

The Agent Maker exposes Claude Code's full configuration surface but presents it using Claude Code's internal vocabulary. Non-technical users — business users, junior developers, AI-curious creators — see terms like "PreToolUse hook", "memory scope", and "MCP servers" with no context.

This design adds a natural-language agent builder as the primary creation path and rewrites every user-facing label, description, and help text in plain language. The full power of the editor stays intact for technical users; non-technical users get an approachable on-ramp.

**Key decisions:**
- Natural language first: users describe what they want, server-side Claude API generates the config
- Progressive complexity: NL builder for creation, full editor for customization
- No database changes: entirely UI + one new server endpoint
- Graceful degradation: if no API key configured, NL builder is hidden, improved editor stands alone

---

## Section 1: Natural Language Agent Builder

### Flow

**Step 1 — Describe**

A single large textarea: "Describe the agent you want to build."

Placeholder: *"e.g., I want an agent that reviews my Python code for bugs and security issues, suggests fixes, and explains what it found."*

Below it, quick-start chips for common use cases: `Code reviewer`, `Documentation writer`, `Test generator`, `Refactoring helper`, `Bug fixer`, `Security auditor`. Clicking a chip pre-fills the textarea.

A "Generate" button sends the description to the server.

**Step 2 — Review**

The server calls Claude API and returns a complete agent config. The user sees a plain-language summary card:

```
Your Agent: Code Reviewer
What it does: Reviews Python code for bugs, security vulnerabilities,
and style issues. Suggests specific fixes with explanations.

How it works:
- Can read your code files (Read, Glob, Grep)
- Cannot modify files (Write, Edit, Bash disabled)
- Uses Claude Sonnet (fast, capable)
- Remembers context within your project

Also created:
- Skill: security-scan — deep security analysis
- Command: /review — run a code review on a file
```

Two buttons: **"Create Agent"** (accepts and saves) and **"Customize"** (opens the full editor pre-filled).

**Step 3 — Iterate (optional)**

A follow-up textarea below the summary: "Want to change anything?" The user can type refinements — the server re-generates with the adjustment.

---

## Section 2: Label & Jargon Overhaul

Every user-facing label and description gets rewritten. The data model and export format stay identical.

### Agent Editor — Configuration Tab

| Current Label | New Label | New Description |
|---|---|---|
| System Prompt / Instructions | Instructions | Tell this agent who it is and how it should behave. This is the most important field. |
| Model | AI Model | Which version of Claude to use. Sonnet is a good default — fast and capable. Opus is slower but better at complex reasoning. Haiku is fastest for simple tasks. |
| Memory Scope | What It Remembers | How long this agent's memory lasts. "Project" = remembers within this project. "User" = remembers across all projects. "Local" = forgets after each session. |
| Allowed Tools | Capabilities | What this agent can do. "Read" lets it look at files, "Write" lets it create files, "Bash" lets it run terminal commands. |
| Disallowed Tools | Restricted Capabilities | Capabilities this agent is never allowed to use, even if otherwise available. Use this for safety guardrails. |
| Permission Mode | How It Asks for Permission | What happens when this agent wants to do something requiring approval. "Default" asks every time. "Accept Edits" auto-approves file changes. "Don't Ask" auto-approves everything. |
| Max Turns | Conversation Limit | Maximum back-and-forth steps before the agent stops. Leave blank for no limit. |
| Preloaded Skills | Skills Loaded at Start | Skills this agent always has available from the beginning of every conversation. |
| MCP Servers | External Connections | External services this agent can connect to (GitHub, databases, search APIs). Configured in project settings. |

### Skills Tab

| Current | New |
|---|---|
| Auto-discovered capabilities with instructions and scripts | Reusable abilities you can teach this agent. Skills can be invoked automatically or triggered by the user. |
| Instructions (SKILL.md content) | Instructions |
| Context: Main / Fork (Separate Context) | Runs in: Same conversation / Separate conversation |
| Agent Type | Worker Type |
| Disable auto-invocation | Only run when asked |
| User invocable (show in / menu) | Show in slash command menu |
| Argument Hint | Input hint (shown to user) |

### Commands Tab

| Current | New |
|---|---|
| Custom commands triggered with /command-name in Claude Code | Shortcuts your users can type (like /review or /test) to trigger specific actions. |
| Prompt Template | What to do when triggered |
| Context: Main / Fork | Runs in: Same conversation / Separate conversation |

### Project Editor

| Current | New |
|---|---|
| CLAUDE.md Content | Project Instructions |
| The main project instructions file that guides Claude's behavior | The main instructions every agent in this project will see. Describe your project, its conventions, and how agents should work with it. |
| Path Globs (comma-separated) | File patterns (comma-separated) |
| Configure .claude/settings.json fields | Project-wide settings |
| Hooks | Automations |
| Event-driven automation exported to .claude/settings.json | Actions that run automatically when certain things happen. |
| Model Context Protocol servers exported to .mcp.json | External service connections |
| Sandbox | Network Security |
| Enable network sandbox for commands | Restrict which websites and services commands can access |
| Allow Local Binding | Allow local server connections |

### Deploy Page

| Current | New |
|---|---|
| Export your agent configuration as a .claude/ directory ready to install | Download your agents as ready-to-install configuration files |
| Unzip the file into your Claude Code project's root directory | Unzip the file into your project's main folder |
| Invoke agents with @agent-name | Use agents by typing @agent-name |

### Hook Event Display Names

| Value (unchanged) | Display Label |
|---|---|
| PreToolUse | Before using a tool |
| PostToolUse | After using a tool |
| PostToolUseFailure | When a tool fails |
| UserPromptSubmit | When user sends a message |
| SessionStart | When a session starts |
| SessionEnd | When a session ends |
| PermissionRequest | When permission is needed |
| SubagentStart | When a sub-agent starts |
| SubagentStop | When a sub-agent stops |
| Stop | When the agent finishes |
| TeammateIdle | When a teammate is idle |
| TaskCompleted | When a task completes |
| PreCompact | Before compacting memory |
| Notification | When a notification fires |

---

## Section 3: Contextual Help & Inline Education

### "What is this?" Expandable Sections

Each major form group gets a collapsible help block between the section header and form fields. Uses the existing Radix Collapsible component. Collapsed by default.

| Form Section | Help Content Summary |
|---|---|
| Instructions | Most important field. Shapes personality and expertise. Shows good vs. vague example. |
| AI Model | One sentence per model: Sonnet = fast daily driver, Opus = deep thinker, Haiku = quick for simple tasks. |
| Capabilities | One-line description per tool: Read = look at files, Write = create files, Bash = run terminal commands, etc. |
| Restricted Capabilities | "Use this for hard guardrails. Example: a reviewer that must never run Bash." |
| How It Asks for Permission | Each mode with "when to use it" recommendation. |
| What It Remembers | Project = remembers within project. User = across all. Local = starts fresh. Recommendation: Project. |
| Skills | "Specialized abilities. Like 'security-scan' for deep analysis." |
| Commands | "Shortcuts. Type /review instead of explaining what you want." |
| File Map | "Helps the agent understand your project structure. Makes it faster and more accurate." |
| Automations | "Run automatically when things happen. E.g., lint before every commit." |
| External Connections | "Let agents access GitHub, databases, search engines." |
| Rules | "Project-wide instructions scoped to specific files." |
| Network Security | "Control which websites commands can access." |

### Tool Badge Title Attributes

Each capability badge gets a native tooltip: `Read — Look at file contents`, `Bash — Run terminal commands`, etc.

### Smart Defaults with Explanations

New agent form shows why each default was chosen: Model = "Sonnet — Good balance of speed and capability", Memory = "Project — Recommended for most agents", etc.

---

## Section 4: Visual Workflow Builders

### Automations — "When/If/Then" Cards

Each automation reads as a sentence:

```
When [Before using a tool ▾]
If   [tool is Bash ▾] matching [git commit*]
Then [Run command ▾]: [npm run lint]
```

Quick-add presets: "Lint before commit", "Type-check before push", "Run tests after editing", "Custom..."

### Permissions — Visual Grid

Radio-button grid replacing comma-separated text inputs:

```
Capability    Allow    Ask    Deny
Read           (●)     ( )    ( )
Write          ( )     (●)    ( )
Bash           ( )     ( )    (●)
```

"Custom pattern" input below for advanced patterns like `Bash(git *)`.

### Network Security — Toggle-Based

Toggles with descriptions. Tag inputs for allowed domains and blocked commands instead of comma-separated text.

### Rules — Pattern Helper

Quick-pattern dropdown: "+ All TypeScript files" → `src/**/*.ts`, "+ All test files" → `tests/**/*`, etc.

---

## Section 5: Onboarding Overhaul

### 2-Step Flow

**Step 1 — Concepts**

Explains what agents, skills, and commands are in plain language with simple analogies. Agents = specialized AI assistants. Skills = abilities. Commands = shortcuts.

**Step 2 — How to start**

Three options:
- "Describe what you need" → NL builder (labeled "Best for beginners")
- "Start from a template" → templates page
- "Build from scratch" → blank agent editor

### First-Visit Editor Highlights

One-time subtle pulse animation on "What is this?" help sections. Tracked via localStorage.

### Empty State Improvements

| Page | New Empty State |
|---|---|
| Agents list | "Describe what you need and we'll build one for you." + action buttons |
| Skills tab | "Skills are reusable abilities. Add one to make this agent more capable." |
| Commands tab | "Commands are shortcuts your team can type, like /review." |
| File Map tab | "Help this agent understand your project by telling it where important files live." |
| Projects list | "A project groups your agents so you can export and install them as a set." |

---

## Section 6: Server-Side AI Generation

### Endpoint

```
POST /api/agents/generate
Body: { description: string, refinement?: string, previousConfig?: object }
Returns: { agent: InsertAgent, skills: InsertSkill[], commands: InsertCommand[], summary: string }
```

### Prompt Construction

System prompt includes: full tool list with descriptions, available models with capabilities, valid permission modes, available icons, schema constraints. Stored in `server/ai-prompts.ts`.

User description goes as user message. Refinements include previous config as context.

### Validation

Response parsed as JSON, validated against insert schemas. On validation failure, retry once with errors in follow-up message. Second failure returns 422.

### API Key

Read from `ANTHROPIC_API_KEY` environment variable. Status check endpoint:

```
GET /api/ai/status
Returns: { available: boolean }
```

Client conditionally shows NL builder based on this. No key = no NL builder, improved editor stands alone.

### Rate Limiting

In-memory: 10 requests/minute per IP. Returns 429 with friendly message.

### Dependency

`@anthropic-ai/sdk` — official Anthropic TypeScript SDK, server-side only.

---

## File Summary

### New Files

| File | Purpose |
|---|---|
| `server/ai-prompts.ts` | System prompt constant for Claude API generation |
| `server/ai-generate.ts` | Generation logic: prompt construction, API call, validation, retry |
| `client/src/pages/agent-builder.tsx` | NL builder page: describe, review, create/customize |
| `client/src/components/help-section.tsx` | Collapsible "What is this?" component |
| `client/src/components/automation-card.tsx` | Visual "When/If/Then" card for hooks |
| `client/src/components/permission-grid.tsx` | Radio-button grid for tool permissions |
| `client/src/components/tag-input.tsx` | Tag-based input replacing comma-separated text |
| `client/src/components/pattern-helper.tsx` | Quick-pattern dropdown for file globs |
| `client/src/data/tool-descriptions.ts` | One-line descriptions for tools, models, modes, events |
| `client/src/data/help-content.ts` | Expandable help text for every form section |

### Modified Files

| File | Changes |
|---|---|
| `server/routes.ts` | Add `POST /api/agents/generate` and `GET /api/ai/status` |
| `client/src/App.tsx` | Add `/build` route |
| `client/src/components/app-sidebar.tsx` | Add "Build with AI" link (conditional) |
| `client/src/components/onboarding-dialog.tsx` | Rewrite to 2-step concept-first flow |
| `client/src/pages/agent-editor.tsx` | Replace labels, add help sections, tool titles, empty states |
| `client/src/pages/agents.tsx` | Update empty state and badge labels |
| `client/src/pages/deploy.tsx` | Update labels and descriptions |
| `client/src/pages/import.tsx` | Update labels, reduce file path jargon |
| `client/src/pages/templates.tsx` | Update empty state with NL builder link |
| `client/src/pages/projects.tsx` | Update labels and empty state |
| `client/src/pages/project-editor.tsx` | Replace labels, add help sections, swap hooks/permissions/sandbox UI |
| `client/src/data/field-help.ts` | Rewrite all tooltips in plain language, add missing entries |
| `shared/schema.ts` | Add display labels to HOOK_EVENTS, PERMISSION_MODES, AVAILABLE_MODELS |

### No database/schema changes.

---

## Implementation Order

1. **Label overhaul + field help rewrite** — text-only changes across all pages
2. **Help sections + tool descriptions** — new components wired into existing pages
3. **Visual builders** — automation cards, permission grid, tag inputs, pattern helper
4. **Onboarding rewrite** — new 2-step flow
5. **Empty state improvements** — targeted edits across all pages
6. **Server-side AI generation** — new endpoint, prompt engineering, validation
7. **NL builder page** — new page integrated into sidebar and onboarding

Phases 1-5 require no API key and improve the app standalone. Phases 6-7 add the NL builder on top.
