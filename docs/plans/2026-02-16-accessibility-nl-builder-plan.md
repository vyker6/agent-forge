# Accessibility & Natural Language Agent Builder — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Agent Maker accessible to non-technical users through plain-language labels, contextual help, visual builders, an improved onboarding flow, and a natural-language agent generation endpoint.

**Architecture:** Text-only label changes first (zero risk), then new UI components layered onto existing pages, then server-side AI generation, then the NL builder page. No database changes. Frontend uses existing Radix/shadcn primitives. Server adds two new endpoints + Anthropic SDK.

**Tech Stack:** React, TanStack Query, Tailwind CSS, shadcn/ui (Radix), Wouter, Express, `@anthropic-ai/sdk`

---

## Task 1: Create tool-descriptions data file

**Files:**
- Create: `client/src/data/tool-descriptions.ts`

**Step 1: Write the data file**

```typescript
// client/src/data/tool-descriptions.ts

export const toolDescriptions: Record<string, string> = {
  Read: "Look at file contents",
  Write: "Create or overwrite files",
  Edit: "Make targeted changes to files",
  Bash: "Run terminal commands",
  Glob: "Find files by name pattern",
  Grep: "Search inside files",
  MultiEdit: "Edit multiple files at once",
  TodoRead: "Read task lists",
  TodoWrite: "Create and update task lists",
  WebFetch: "Fetch content from URLs",
  WebSearch: "Search the web",
  "mcp__*": "Use external service tools",
};

export const modelDescriptions: Record<string, string> = {
  inherit: "Uses the project's default model",
  sonnet: "Fast and capable — good default for most tasks",
  opus: "Slower but best at complex reasoning and nuanced work",
  haiku: "Fastest option — great for simple, repetitive tasks",
};

export const permissionModeDescriptions: Record<string, string> = {
  default: "Asks for approval each time — safest option",
  acceptEdits: "Auto-approves file changes, asks for everything else",
  delegate: "Delegates permission decisions to sub-agents",
  dontAsk: "Auto-approves everything — use with caution",
  bypassPermissions: "Skips all permission checks entirely",
  plan: "Enters planning mode — proposes changes without executing",
};

export const memoryScopeDescriptions: Record<string, string> = {
  user: "Remembers across all your projects",
  project: "Remembers within this project only (recommended)",
  local: "Forgets everything after each session",
};

export const hookEventDescriptions: Record<string, string> = {
  PreToolUse: "Runs before the agent uses a tool",
  PostToolUse: "Runs after the agent finishes using a tool",
  PostToolUseFailure: "Runs when a tool fails",
  UserPromptSubmit: "Runs when you send a message",
  SessionStart: "Runs when a session starts",
  SessionEnd: "Runs when a session ends",
  PermissionRequest: "Runs when permission is needed",
  SubagentStart: "Runs when a sub-agent starts",
  SubagentStop: "Runs when a sub-agent stops",
  Stop: "Runs when the agent finishes",
  TeammateIdle: "Runs when a teammate is idle",
  TaskCompleted: "Runs when a task completes",
  PreCompact: "Runs before compacting memory",
  Notification: "Runs when a notification fires",
};

export const hookEventDisplayNames: Record<string, string> = {
  PreToolUse: "Before using a tool",
  PostToolUse: "After using a tool",
  PostToolUseFailure: "When a tool fails",
  UserPromptSubmit: "When user sends a message",
  SessionStart: "When a session starts",
  SessionEnd: "When a session ends",
  PermissionRequest: "When permission is needed",
  SubagentStart: "When a sub-agent starts",
  SubagentStop: "When a sub-agent stops",
  Stop: "When the agent finishes",
  TeammateIdle: "When a teammate is idle",
  TaskCompleted: "When a task completes",
  PreCompact: "Before compacting memory",
  Notification: "When a notification fires",
};
```

**Step 2: Verify TypeScript compiles**

Run: `cd /home/runner/workspace && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add client/src/data/tool-descriptions.ts
git commit -m "feat: add tool, model, and event description data"
```

---

## Task 2: Create help-content data file

**Files:**
- Create: `client/src/data/help-content.ts`

**Step 1: Write the data file**

```typescript
// client/src/data/help-content.ts

export const helpContent: Record<string, { title: string; content: string }> = {
  instructions: {
    title: "What are instructions?",
    content:
      "This is the most important field. Instructions shape your agent's personality, expertise, and behavior. Be specific about what the agent should do and how.\n\n**Good:** \"You are a Python security auditor. Review code for SQL injection, XSS, and authentication flaws. Cite OWASP references.\"\n\n**Too vague:** \"Help with code.\"",
  },
  model: {
    title: "Which model should I pick?",
    content:
      "**Sonnet** — Fast and capable. Best default for everyday tasks like code review, writing, and analysis.\n\n**Opus** — Slower but deeper. Pick this for complex multi-step reasoning, architecture decisions, or nuanced analysis.\n\n**Haiku** — Fastest and lightest. Good for simple, repetitive tasks like formatting or quick lookups.",
  },
  capabilities: {
    title: "What can these do?",
    content:
      "Each capability gives your agent a specific power:\n\n- **Read** — Look at file contents\n- **Write** — Create or overwrite files\n- **Edit** — Make targeted changes to existing files\n- **Bash** — Run terminal commands (scripts, builds, git)\n- **Glob** — Find files by name pattern\n- **Grep** — Search inside file contents\n- **WebFetch** — Retrieve content from URLs\n- **WebSearch** — Search the web\n\nOnly enable what the agent actually needs.",
  },
  restrictedCapabilities: {
    title: "When should I restrict capabilities?",
    content:
      "Use this for hard safety guardrails. Restricted capabilities can never be used, even if they appear in the allowed list.\n\n**Example:** A code reviewer that must never modify files — restrict Write, Edit, and Bash.",
  },
  permissionMode: {
    title: "What do these modes mean?",
    content:
      "Controls what happens when your agent wants to do something that requires approval.\n\n- **Default** — Asks every time. Safest.\n- **Accept Edits** — Auto-approves file changes, asks for everything else. Good for coding agents.\n- **Don't Ask** — Auto-approves everything. Only for trusted, well-tested agents.\n- **Plan Mode** — Proposes changes without executing. Good for cautious workflows.",
  },
  memoryScope: {
    title: "How does memory work?",
    content:
      "Memory determines what your agent remembers between conversations.\n\n- **Project** (recommended) — Remembers context within this project. Separate from other projects.\n- **User** — Remembers across all your projects. Good for personal assistants.\n- **Local** — Starts fresh every session. Good for stateless utilities.",
  },
  skills: {
    title: "What are skills?",
    content:
      "Skills are specialized abilities you can teach your agent. Think of them as reusable recipes.\n\n**Example:** A \"security-scan\" skill that performs deep security analysis when invoked.\n\nSkills can run automatically (when Claude decides they're needed) or only when you ask.",
  },
  commands: {
    title: "What are commands?",
    content:
      "Commands are shortcuts your users can type, like /review or /test. Instead of explaining what you want every time, you type the shortcut and the agent knows exactly what to do.\n\n**Example:** /review runs a full code review on the current file.",
  },
  fileMap: {
    title: "What is the file map?",
    content:
      "The file map helps your agent understand your project structure. It tells the agent where important files and directories live, making it faster and more accurate at finding what it needs.",
  },
  automations: {
    title: "What are automations?",
    content:
      "Automations run automatically when certain events happen. They're like \"if this, then that\" rules for your agent.\n\n**Examples:**\n- Run the linter before every commit\n- Type-check before pushing code\n- Log every tool the agent uses",
  },
  externalConnections: {
    title: "What are external connections?",
    content:
      "External connections let your agent access services like GitHub, databases, or search APIs through the Model Context Protocol (MCP).\n\nThese are configured at the project level and shared across all agents in the project.",
  },
  rules: {
    title: "What are rules?",
    content:
      "Rules are project-wide instructions scoped to specific file patterns. They tell all agents in this project how to handle certain types of files.\n\n**Example:** \"All files matching `src/**/*.ts` should use strict TypeScript with no `any` types.\"",
  },
  networkSecurity: {
    title: "What is network security?",
    content:
      "Network security controls which websites and services terminal commands can access. When enabled, commands run in a sandbox that blocks unauthorized network requests.\n\nUse this to prevent agents from accidentally connecting to unexpected services.",
  },
  claudeMd: {
    title: "What are project instructions?",
    content:
      "This is the main instruction file every agent in this project will see. Describe your project, its conventions, and how agents should work with it.\n\nThink of it as a README specifically for your AI agents.",
  },
};
```

**Step 2: Verify TypeScript compiles**

Run: `cd /home/runner/workspace && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add client/src/data/help-content.ts
git commit -m "feat: add contextual help content for all form sections"
```

---

## Task 3: Create help-section component

**Files:**
- Create: `client/src/components/help-section.tsx`

**Step 1: Write the component**

```tsx
// client/src/components/help-section.tsx
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { helpContent } from "@/data/help-content";

export function HelpSection({ section }: { section: string }) {
  const [open, setOpen] = useState(false);
  const content = helpContent[section];
  if (!content) return null;

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronRight
          className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`}
        />
        {content.title}
      </button>
      {open && (
        <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-3 prose prose-xs dark:prose-invert max-w-none">
          {content.content.split("\n\n").map((paragraph, i) => (
            <p key={i} className={i > 0 ? "mt-2" : ""}>
              {paragraph.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                part.startsWith("**") && part.endsWith("**") ? (
                  <strong key={j}>{part.slice(2, -2)}</strong>
                ) : (
                  <span key={j}>{part}</span>
                )
              )}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /home/runner/workspace && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add client/src/components/help-section.tsx
git commit -m "feat: add collapsible help section component"
```

---

## Task 4: Rewrite field-help.ts in plain language

**Files:**
- Modify: `client/src/data/field-help.ts`

**Step 1: Rewrite the file**

Replace the entire contents of `client/src/data/field-help.ts` with plain-language descriptions:

```typescript
export const fieldHelp: Record<string, string> = {
  // Agent fields
  agentName: "Give your agent a short, clear name like 'Code Reviewer' or 'Test Writer'. This becomes the filename when exported.",
  agentDescription: "A one-line summary of what this agent does. Shown in the agent list.",
  systemPrompt: "Tell this agent who it is and how it should behave. This is the most important field — it shapes everything the agent does.",
  model: "Which version of Claude to use. Sonnet is a good default — fast and capable. Opus is slower but better at complex reasoning. Haiku is fastest for simple tasks.",
  memoryScope: "How long this agent remembers things. 'Project' = remembers within this project. 'User' = remembers across all projects. 'Local' = forgets after each session.",
  tools: "What this agent can do. 'Read' lets it look at files, 'Write' lets it create files, 'Bash' lets it run terminal commands. Only enable what it needs.",
  disallowedTools: "Capabilities this agent is never allowed to use, even if otherwise available. Use this for safety guardrails.",
  permissionMode: "What happens when this agent wants to do something requiring approval. 'Default' asks every time. 'Accept Edits' auto-approves file changes. 'Don't Ask' auto-approves everything.",
  maxTurns: "Maximum back-and-forth steps before the agent stops. Leave blank for no limit.",

  // Skill fields
  skillName: "A short name for this skill using lowercase and hyphens (e.g., 'security-scan'). Used as the folder name.",
  skillDescription: "Describe when and why this skill should be used. Helps the agent decide when to activate it automatically.",
  skillInstructions: "The full instructions for this skill, written in markdown. This is what the agent reads when the skill is activated.",
  skillContext: "Where this skill runs. 'Same conversation' keeps the current context. 'Separate conversation' starts fresh — useful for isolated tasks.",
  skillAllowedTools: "Which capabilities this skill can use when running.",
  skillArgumentHint: "A hint shown to users about what input this skill expects (e.g., '[file-path]').",
  skillModel: "Override the AI model for this skill. Leave as 'Inherit' to use the agent's model.",
  skillAgentType: "When running in a separate conversation, which type of worker to use.",

  // Command fields
  commandName: "The shortcut name without the / (e.g., 'review-code'). Users type /review-code to trigger it.",
  commandDescription: "A brief description shown in the slash command menu.",
  commandPromptTemplate: "What to do when this command is triggered. Use $ARGUMENTS for any input the user provides.",
  commandArgumentHint: "A hint about what input this command expects (e.g., '[PR-number]').",
  commandContext: "Where the command runs. 'Same conversation' runs inline. 'Separate conversation' runs in isolation.",
  commandAllowedTools: "Which capabilities this command can use when running.",
  commandModel: "Override the AI model for this command. Leave as 'Inherit' to use the agent's model.",
};
```

**Step 2: Verify TypeScript compiles**

Run: `cd /home/runner/workspace && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add client/src/data/field-help.ts
git commit -m "feat: rewrite field help text in plain language"
```

---

## Task 5: Update agent editor labels and add help sections

**Files:**
- Modify: `client/src/pages/agent-editor.tsx`

This task makes the following label changes in the `AgentConfigForm` component and adds `HelpSection` components before each major form group.

**Step 1: Add import**

At the top of `agent-editor.tsx`, add:
```typescript
import { HelpSection } from "@/components/help-section";
```

**Step 2: Rename "System Prompt / Instructions" → "Instructions"**

In `AgentConfigForm` (~line 367), change:
```
<Label htmlFor="systemPrompt">System Prompt / Instructions</Label>
```
to:
```
<Label htmlFor="systemPrompt">Instructions</Label>
```

And add a `HelpSection` above the label:
```tsx
<HelpSection section="instructions" />
```

**Step 3: Rename "Model" → "AI Model"**

At ~line 403, change:
```
<Label>Model</Label>
```
to:
```
<Label>AI Model</Label>
```

Add before the model/memory grid:
```tsx
<HelpSection section="model" />
```

**Step 4: Rename "Memory Scope" → "What It Remembers"**

At ~line 424, change:
```
<Label>Memory Scope</Label>
```
to:
```
<Label>What It Remembers</Label>
```

**Step 5: Rename "Allowed Tools" → "Capabilities"**

At ~line 450, change:
```
<Label>Allowed Tools</Label>
```
to:
```
<Label>Capabilities</Label>
```

Change the description at ~line 453:
```
Select which tools this agent can use
```
to:
```
What this agent can do
```

Add before the capabilities section:
```tsx
<HelpSection section="capabilities" />
```

**Step 6: Rename "Disallowed Tools" → "Restricted Capabilities"**

At ~line 494, change:
```
<Label>Disallowed Tools</Label>
```
to:
```
<Label>Restricted Capabilities</Label>
```

Change description at ~line 496:
```
Tools this agent is explicitly denied from using
```
to:
```
Capabilities this agent is never allowed to use, even if otherwise available
```

**Step 7: Rename "Permission Mode" → "How It Asks for Permission"**

At ~line 518, change:
```
<Label>Permission Mode</Label>
```
to:
```
<Label>How It Asks for Permission</Label>
```

Change description at ~line 522:
```
How the agent handles permission requests
```
to:
```
What happens when this agent needs approval to do something
```

**Step 8: Rename "Max Turns" → "Conversation Limit"**

At ~line 542, change:
```
<Label>Max Turns</Label>
```
to:
```
<Label>Conversation Limit</Label>
```

Change description at ~line 546:
```
Limit agentic turns (blank = unlimited)
```
to:
```
Maximum back-and-forth steps (blank = no limit)
```

**Step 9: Add tool badge `title` attributes**

In the capabilities badge list (~line 459), add a title attribute using `toolDescriptions`:

Add import at top:
```typescript
import { toolDescriptions } from "@/data/tool-descriptions";
```

Change the Badge element:
```tsx
<Badge
  key={tool}
  variant={(form.tools ?? []).includes(tool) ? "default" : "outline"}
  className={`cursor-pointer toggle-elevate ${(form.tools ?? []).includes(tool) ? "toggle-elevated" : ""}`}
  onClick={() => toggleTool(tool)}
  data-testid={`badge-tool-${tool}`}
  title={toolDescriptions[tool] || tool}
>
```

Do the same for the disallowed tools badges.

**Step 10: Verify TypeScript compiles**

Run: `cd /home/runner/workspace && npx tsc --noEmit`
Expected: No errors

**Step 11: Commit**

```bash
git add client/src/pages/agent-editor.tsx
git commit -m "feat: rename agent editor labels to plain language, add help sections"
```

---

## Task 6: Update agents list page labels and empty state

**Files:**
- Modify: `client/src/pages/agents.tsx`

**Step 1: Update subtitle**

At line 72, change:
```
Design and configure local agents for Claude Code
```
to:
```
Your AI assistants — each one specialized for a different task
```

**Step 2: Update empty state**

At lines 89-93, change:
```tsx
<h3 className="font-medium">No agents yet</h3>
<p className="text-sm text-muted-foreground mt-1">
  Create your first agent to get started
</p>
```
to:
```tsx
<h3 className="font-medium">No agents yet</h3>
<p className="text-sm text-muted-foreground mt-1">
  Describe what you need and we'll help you build your first agent
</p>
```

**Step 3: Update badge labels**

At line 168, change the memory scope badge from raw `agent.memoryScope` to a display label. Import `MEMORY_SCOPES` from schema:
```tsx
<Badge variant="outline" className="text-[10px]">
  {MEMORY_SCOPES.find((s) => s.value === agent.memoryScope)?.label ?? agent.memoryScope}
</Badge>
```

Add `MEMORY_SCOPES` to the import from `@shared/schema`.

**Step 4: Verify TypeScript compiles**

Run: `cd /home/runner/workspace && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add client/src/pages/agents.tsx
git commit -m "feat: update agents list labels and empty state for accessibility"
```

---

## Task 7: Update deploy page labels

**Files:**
- Modify: `client/src/pages/deploy.tsx`

**Step 1: Update title and subtitle**

At lines 201-205, change:
```tsx
<h1 ...>Deploy Agents</h1>
<p ...>Export your agent configuration as a .claude/ directory ready to install</p>
```
to:
```tsx
<h1 ...>Download & Install</h1>
<p ...>Download your agents as ready-to-install configuration files</p>
```

**Step 2: Update installation instructions**

At line 364, change:
```
Unzip the file into your Claude Code project's root directory
```
to:
```
Unzip the file into your project's main folder
```

At line 370, change:
```
Invoke agents with @agent-name, run commands with /command-name
```
to:
```
Use agents by typing @agent-name, run shortcuts with /command-name
```

**Step 3: Verify TypeScript compiles**

Run: `cd /home/runner/workspace && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add client/src/pages/deploy.tsx
git commit -m "feat: update deploy page labels for plain language"
```

---

## Task 8: Update import page labels

**Files:**
- Modify: `client/src/pages/import.tsx`

**Step 1: Update page subtitle**

At line 56, change:
```
Import agents, skills, and settings from a .claude/ directory export
```
to:
```
Import agents, skills, and settings from a configuration export
```

**Step 2: Update file drop zone text**

At line 246, change:
```
Accepts exported .claude/ directory ZIP files
```
to:
```
Accepts exported configuration ZIP files
```

**Step 3: Update ZIP structure heading**

At line 267, change:
```
Expected ZIP Structure
```
to:
```
What's inside the ZIP
```

**Step 4: Verify TypeScript compiles**

Run: `cd /home/runner/workspace && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add client/src/pages/import.tsx
git commit -m "feat: update import page labels for plain language"
```

---

## Task 9: Update project editor labels and add help sections

**Files:**
- Modify: `client/src/pages/project-editor.tsx`

**Step 1: Add imports**

```typescript
import { HelpSection } from "@/components/help-section";
import { hookEventDisplayNames } from "@/data/tool-descriptions";
```

**Step 2: Rename tab labels**

At line 209, change `Hooks` to `Automations`.
At line 220, change `MCP Servers` to `Connections`.

**Step 3: Rename "CLAUDE.md Content" → "Project Instructions"**

At line 311, change:
```
<Label htmlFor="claude-md">CLAUDE.md Content</Label>
```
to:
```
<Label htmlFor="claude-md">Project Instructions</Label>
```

At line 313, change:
```
The main project instructions file that guides Claude's behavior
```
to:
```
The main instructions every agent in this project will see
```

Add before the label:
```tsx
<HelpSection section="claudeMd" />
```

**Step 4: Rename settings header**

At line 726-728, change:
```
<h2 ...>Project Settings</h2>
<p ...>Configure .claude/settings.json fields</p>
```
to:
```
<h2 ...>Project Settings</h2>
<p ...>Configure project-wide behavior and permissions</p>
```

**Step 5: Rename permission labels**

At line 733, change `Permissions` to `Permission Rules`.

At line 735, change:
```
Allow (comma-separated tool patterns)
```
to:
```
Always Allow (comma-separated)
```

At line 745, change `Deny` label to `Always Deny`.

At line 755, change `Ask` label to `Ask Before Using`.

**Step 6: Rename sandbox section**

At line 786, change `Sandbox` to `Network Security`.

At line 790, change:
```
Enable network sandbox for commands
```
to:
```
Restrict which websites and services commands can access
```

At line 810, change:
```
Allowed Domains (comma-separated)
```
to:
```
Allowed Websites (comma-separated)
```

At line 823, change the "Allow Local Binding" description:
```
Allow binding to local ports
```
to:
```
Allow local server connections
```

At line 831, change:
```
Excluded Commands (comma-separated)
```
to:
```
Commands exempt from restrictions (comma-separated)
```

**Step 7: Rename hooks tab header**

At line 983, change:
```
<h2 ...>Hooks</h2>
<p ...>Event-driven automation exported to .claude/settings.json</p>
```
to:
```
<h2 ...>Automations</h2>
<p ...>Actions that run automatically when certain things happen</p>
```

Add before the header:
```tsx
<HelpSection section="automations" />
```

**Step 8: Update hook event display labels in the event select**

In `HookFormFields` (~line 1137), the event `SelectItem` currently uses `e.label`. Update to use `hookEventDisplayNames`:
```tsx
<SelectItem key={e.value} value={e.value}>
  {hookEventDisplayNames[e.value] || e.label}
</SelectItem>
```

Also update the badge display at line 1065:
```tsx
<Badge variant="default" className="text-[10px]">
  {hookEventDisplayNames[hook.event] || HOOK_EVENTS.find((e) => e.value === hook.event)?.label || hook.event}
</Badge>
```

**Step 9: Rename hooks button labels**

At line 989, change `Add Hook` to `Add Automation`.
At line 1022, change `Create Hook` to `Create Automation`.
At line 915, change toast `"Hook created"` to `"Automation created"`.
At line 937, change toast `"Hook updated"` to `"Automation updated"`.
At line 949, change toast `"Hook deleted"` to `"Automation deleted"`.

**Step 10: Verify TypeScript compiles**

Run: `cd /home/runner/workspace && npx tsc --noEmit`
Expected: No errors

**Step 11: Commit**

```bash
git add client/src/pages/project-editor.tsx
git commit -m "feat: rename project editor labels and tabs for accessibility"
```

---

## Task 10: Update projects list empty state

**Files:**
- Modify: `client/src/pages/projects.tsx`

**Step 1: Update empty state**

At lines 160-162, change:
```tsx
<h3 className="font-medium">No projects yet</h3>
<p className="text-sm text-muted-foreground mt-1">
  Create a project to bundle your agents together
</p>
```
to:
```tsx
<h3 className="font-medium">No projects yet</h3>
<p className="text-sm text-muted-foreground mt-1">
  A project groups your agents so you can export and install them as a set
</p>
```

**Step 2: Verify TypeScript compiles**

Run: `cd /home/runner/workspace && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add client/src/pages/projects.tsx
git commit -m "feat: update projects empty state text"
```

---

## Task 11: Update templates page empty state

**Files:**
- Modify: `client/src/pages/templates.tsx`

**Step 1: Find the empty state text**

Read the templates.tsx file to locate any empty state. If there is none, add one after the filtered templates rendering:

```tsx
{filtered.length === 0 && (
  <Card>
    <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
      <Sparkles className="h-8 w-8 text-muted-foreground" />
      <div className="text-center">
        <h3 className="font-medium">No templates in this category</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Try a different category or describe what you need to build one from scratch
        </p>
      </div>
    </CardContent>
  </Card>
)}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /home/runner/workspace && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add client/src/pages/templates.tsx
git commit -m "feat: add templates empty state"
```

---

## Task 12: Rewrite onboarding dialog to 2-step flow

**Files:**
- Modify: `client/src/components/onboarding-dialog.tsx`

**Step 1: Rewrite the component**

Replace the entire file with the new 2-step concept-first flow:

```tsx
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Bot, Sparkles, ArrowRight, MessageSquarePlus, Layout, PenTool } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "agentMaker.onboardingComplete";

export function OnboardingDialog() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent className="sm:max-w-md">
        {step === 0 && (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
              </div>
              <DialogTitle className="text-center text-xl">Welcome to Agent Maker</DialogTitle>
              <DialogDescription className="text-center">
                Build specialized AI assistants for Claude Code — no coding required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <ConceptCard
                icon={Bot}
                title="Agents"
                description="Specialized AI assistants, each focused on a specific task like reviewing code or writing tests."
              />
              <ConceptCard
                icon={Sparkles}
                title="Skills"
                description="Reusable abilities you teach an agent — like 'security-scan' or 'generate-docs'."
              />
              <ConceptCard
                icon={PenTool}
                title="Commands"
                description="Shortcuts you can type, like /review or /test, to trigger specific actions."
              />
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <Button onClick={() => setStep(1)}>
                How do I start?
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="ghost" onClick={dismiss}>
                Skip — I'll explore on my own
              </Button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>How would you like to start?</DialogTitle>
              <DialogDescription>
                Choose the approach that fits your comfort level.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-4">
              <StartOption
                icon={MessageSquarePlus}
                title="Describe what you need"
                description="Tell us in plain language and we'll generate an agent for you."
                badge="Best for beginners"
                onClick={() => { dismiss(); navigate("/build"); }}
              />
              <StartOption
                icon={Layout}
                title="Start from a template"
                description="Pick a pre-built agent set and customize it."
                onClick={() => { dismiss(); navigate("/templates"); }}
              />
              <StartOption
                icon={PenTool}
                title="Build from scratch"
                description="Full control — configure every detail yourself."
                onClick={() => { dismiss(); navigate("/agents/new"); }}
              />
            </div>
            <Button variant="ghost" className="mt-2 w-full" onClick={dismiss}>
              Explore on my own
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ConceptCard({ icon: Icon, title, description }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function StartOption({ icon: Icon, title, description, badge, onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 w-full p-3 rounded-lg border text-left text-sm transition-colors hover:bg-accent"
    >
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">{title}</p>
          {badge && (
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-2" />
    </button>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /home/runner/workspace && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add client/src/components/onboarding-dialog.tsx
git commit -m "feat: rewrite onboarding to 2-step concept-first flow"
```

---

## Task 13: Create server-side AI generation — prompts file

**Files:**
- Create: `server/ai-prompts.ts`

**Step 1: Install dependency**

```bash
cd /home/runner/workspace && bun add @anthropic-ai/sdk
```

**Step 2: Write the prompts file**

```typescript
// server/ai-prompts.ts
import { AVAILABLE_TOOLS, AVAILABLE_MODELS, PERMISSION_MODES, AGENT_ICONS } from "@shared/schema";

export const AGENT_GENERATION_SYSTEM_PROMPT = `You are an AI agent configuration generator for Claude Code. Given a user's natural language description of an agent they want, you generate a complete configuration.

## Available Configuration

### Tools (capabilities)
${AVAILABLE_TOOLS.map((t) => `- ${t}`).join("\n")}

### Models
${AVAILABLE_MODELS.map((m) => `- ${m.value}: ${m.label}`).join("\n")}

### Permission Modes
${PERMISSION_MODES.map((m) => `- ${m.value}: ${m.label}`).join("\n")}

### Icons
${AGENT_ICONS.join(", ")}

### Memory Scopes
- user: Remembers across all projects
- project: Remembers within one project (recommended default)
- local: Forgets after each session

## Rules
1. Always set a descriptive name (2-4 words)
2. Write a clear, specific system prompt (at least 3 sentences)
3. Only enable tools the agent actually needs (principle of least privilege)
4. Default to model "sonnet" unless the task clearly needs "opus" (complex reasoning) or "haiku" (simple/fast)
5. Default to memoryScope "project"
6. Default to permissionMode "default" unless the user wants auto-approval
7. Choose an appropriate icon from the list
8. Pick a color as a hex code that visually represents the agent's purpose
9. Generate 0-2 skills if the agent would benefit from specialized abilities
10. Generate 0-2 commands if the user would benefit from slash command shortcuts
11. For read-only agents (reviewers, analyzers), do NOT include Write, Edit, or Bash

## Output Format
Respond with ONLY a JSON object (no markdown, no explanation) matching this exact schema:

{
  "agent": {
    "name": "string",
    "description": "string",
    "systemPrompt": "string",
    "model": "sonnet|opus|haiku",
    "tools": ["string"],
    "disallowedTools": ["string"],
    "memoryScope": "project|user|local",
    "permissionMode": "string",
    "maxTurns": null,
    "icon": "string",
    "color": "#hexcode"
  },
  "skills": [
    {
      "name": "string (lowercase-with-hyphens)",
      "description": "string",
      "instructions": "string (markdown)",
      "context": "main|fork",
      "allowedTools": ["string"],
      "userInvocable": true,
      "autoInvoke": true
    }
  ],
  "commands": [
    {
      "name": "string (lowercase-with-hyphens)",
      "description": "string",
      "promptTemplate": "string",
      "context": "main|fork",
      "allowedTools": ["string"]
    }
  ],
  "summary": "string (2-3 sentence plain-language summary of what was created)"
}`;
```

**Step 3: Verify TypeScript compiles**

Run: `cd /home/runner/workspace && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add server/ai-prompts.ts package.json bun.lockb
git commit -m "feat: add AI generation system prompt and Anthropic SDK dependency"
```

---

## Task 14: Create server-side AI generation — logic file

**Files:**
- Create: `server/ai-generate.ts`

**Step 1: Write the generation logic**

```typescript
// server/ai-generate.ts
import Anthropic from "@anthropic-ai/sdk";
import { AGENT_GENERATION_SYSTEM_PROMPT } from "./ai-prompts";
import { insertAgentSchema, insertSkillSchema, insertCommandSchema } from "@shared/schema";

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export function isAiAvailable(): boolean {
  return client !== null;
}

interface GenerateResult {
  agent: {
    name: string;
    description: string;
    systemPrompt: string;
    model: string;
    tools: string[];
    disallowedTools: string[];
    memoryScope: string;
    permissionMode: string;
    maxTurns: number | null;
    icon: string;
    color: string;
  };
  skills: Array<{
    name: string;
    description: string;
    instructions: string;
    context: string;
    allowedTools: string[];
    userInvocable?: boolean;
    autoInvoke?: boolean;
  }>;
  commands: Array<{
    name: string;
    description: string;
    promptTemplate: string;
    context: string;
    allowedTools: string[];
  }>;
  summary: string;
}

export async function generateAgentConfig(
  description: string,
  refinement?: string,
  previousConfig?: object
): Promise<GenerateResult> {
  if (!client) {
    throw new Error("AI generation is not available — no API key configured");
  }

  const messages: Anthropic.MessageParam[] = [];

  if (previousConfig && refinement) {
    messages.push({
      role: "user",
      content: `Generate an agent configuration for: ${description}`,
    });
    messages.push({
      role: "assistant",
      content: JSON.stringify(previousConfig),
    });
    messages.push({
      role: "user",
      content: `Please adjust the configuration: ${refinement}`,
    });
  } else {
    messages.push({
      role: "user",
      content: `Generate an agent configuration for: ${description}`,
    });
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system: AGENT_GENERATION_SYSTEM_PROMPT,
    messages,
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  let parsed: GenerateResult;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Retry once with error context
    const retryResponse = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: AGENT_GENERATION_SYSTEM_PROMPT,
      messages: [
        ...messages,
        { role: "assistant", content: text },
        {
          role: "user",
          content:
            "Your response was not valid JSON. Please respond with ONLY the JSON object, no markdown fences or explanation.",
        },
      ],
    });

    const retryText = retryResponse.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    try {
      parsed = JSON.parse(retryText);
    } catch {
      throw new Error("Failed to generate valid configuration after retry");
    }
  }

  // Validate agent against schema
  const agentValidation = insertAgentSchema.safeParse({
    ...parsed.agent,
    preloadedSkills: [],
    mcpServers: [],
  });
  if (!agentValidation.success) {
    throw new Error(`Invalid agent configuration: ${agentValidation.error.message}`);
  }

  return parsed;
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /home/runner/workspace && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add server/ai-generate.ts
git commit -m "feat: add AI agent generation logic with validation and retry"
```

---

## Task 15: Add server routes for AI generation

**Files:**
- Modify: `server/routes.ts`

**Step 1: Add imports**

At the top of `server/routes.ts`, add:
```typescript
import { isAiAvailable, generateAgentConfig } from "./ai-generate";
```

**Step 2: Add rate limiter**

After the `upload` const (~line 13), add:
```typescript
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}
```

**Step 3: Add endpoints**

Before the `return httpServer;` line (~line 576), add:
```typescript
  // AI generation endpoints
  app.get("/api/ai/status", (_req, res) => {
    res.json({ available: isAiAvailable() });
  });

  app.post("/api/agents/generate", async (req, res) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        error: "Too many requests. Please wait a minute before trying again.",
      });
    }

    const { description, refinement, previousConfig } = req.body;
    if (!description || typeof description !== "string") {
      return res.status(400).json({ error: "Description is required" });
    }

    try {
      const result = await generateAgentConfig(description, refinement, previousConfig);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      res.status(422).json({ error: message });
    }
  });
```

**Step 4: Verify TypeScript compiles**

Run: `cd /home/runner/workspace && npx tsc --noEmit`
Expected: No errors

**Step 5: Commit**

```bash
git add server/routes.ts
git commit -m "feat: add AI generation and status API endpoints with rate limiting"
```

---

## Task 16: Create the NL agent builder page

**Files:**
- Create: `client/src/pages/agent-builder.tsx`

**Step 1: Write the page**

```tsx
// client/src/pages/agent-builder.tsx
import { useState } from "react";
import { useLocation } from "wouter";
import { Sparkles, Bot, Loader2, RefreshCw, Puzzle, Terminal as TerminalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { toolDescriptions } from "@/data/tool-descriptions";

const QUICK_START_CHIPS = [
  { label: "Code reviewer", description: "An agent that reviews my code for bugs, security issues, and style problems" },
  { label: "Documentation writer", description: "An agent that generates documentation from my codebase" },
  { label: "Test generator", description: "An agent that writes comprehensive tests for my code" },
  { label: "Refactoring helper", description: "An agent that identifies and suggests code refactoring opportunities" },
  { label: "Bug fixer", description: "An agent that analyzes bugs, identifies root causes, and suggests fixes" },
  { label: "Security auditor", description: "An agent that performs security analysis and identifies vulnerabilities" },
];

interface GeneratedConfig {
  agent: {
    name: string;
    description: string;
    systemPrompt: string;
    model: string;
    tools: string[];
    disallowedTools: string[];
    memoryScope: string;
    permissionMode: string;
    maxTurns: number | null;
    icon: string;
    color: string;
  };
  skills: Array<{
    name: string;
    description: string;
    instructions: string;
    context: string;
    allowedTools: string[];
    userInvocable?: boolean;
    autoInvoke?: boolean;
  }>;
  commands: Array<{
    name: string;
    description: string;
    promptTemplate: string;
    context: string;
    allowedTools: string[];
  }>;
  summary: string;
}

export default function AgentBuilderPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [refinement, setRefinement] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [config, setConfig] = useState<GeneratedConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (desc?: string) => {
    const text = desc || description;
    if (!text.trim()) return;

    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: text,
          refinement: config ? refinement : undefined,
          previousConfig: config || undefined,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const result = await res.json();
      setConfig(result);
      setRefinement("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!config) return;
    setIsCreating(true);
    try {
      // Create the agent
      const agentRes = await apiRequest("POST", "/api/agents", {
        ...config.agent,
        preloadedSkills: [],
        mcpServers: [],
      });
      const agent = await agentRes.json();

      // Create skills
      for (const skill of config.skills) {
        await apiRequest("POST", `/api/agents/${agent.id}/skills`, skill);
      }

      // Create commands
      for (const cmd of config.commands) {
        await apiRequest("POST", `/api/agents/${agent.id}/commands`, cmd);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });

      toast({
        title: "Agent created!",
        description: `"${config.agent.name}" is ready to use`,
      });

      navigate(`/agents/${agent.id}`);
    } catch (err) {
      toast({
        title: "Creation failed",
        description: err instanceof Error ? err.message : "Could not create agent",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Build an Agent</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Describe what you want and we'll generate the configuration for you
        </p>
      </div>

      {!config ? (
        <>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., I want an agent that reviews my Python code for bugs and security issues, suggests fixes, and explains what it found."
                className="min-h-[120px] text-sm"
                data-testid="textarea-agent-description"
              />
              <div className="flex flex-wrap gap-2">
                {QUICK_START_CHIPS.map((chip) => (
                  <Button
                    key={chip.label}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDescription(chip.description);
                      handleGenerate(chip.description);
                    }}
                    disabled={isGenerating}
                  >
                    {chip.label}
                  </Button>
                ))}
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button
                className="w-full"
                onClick={() => handleGenerate()}
                disabled={!description.trim() || isGenerating}
                data-testid="button-generate"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Agent
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">{config.agent.name}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {config.summary}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">How it works:</h3>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Can use: {config.agent.tools.map((t) => toolDescriptions[t] || t).join(", ")}
                  </p>
                  {config.agent.disallowedTools.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Cannot use: {config.agent.disallowedTools.join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {(config.skills.length > 0 || config.commands.length > 0) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Also included:</h3>
                  <div className="flex flex-wrap gap-2">
                    {config.skills.map((s) => (
                      <Badge key={s.name} variant="secondary" className="gap-1">
                        <Puzzle className="h-3 w-3" />
                        Skill: {s.name}
                      </Badge>
                    ))}
                    {config.commands.map((c) => (
                      <Badge key={c.name} variant="secondary" className="gap-1">
                        <TerminalIcon className="h-3 w-3" />
                        /{c.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1"
                  onClick={handleCreate}
                  disabled={isCreating}
                  data-testid="button-create-agent"
                >
                  {isCreating ? "Creating..." : "Create Agent"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    // Navigate to editor with pre-filled data
                    navigate("/agents/new");
                  }}
                >
                  Customize in Editor
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <h3 className="text-sm font-medium">Want to change anything?</h3>
              <Textarea
                value={refinement}
                onChange={(e) => setRefinement(e.target.value)}
                placeholder="e.g., Make it also check for performance issues, or restrict it from running Bash commands"
                className="min-h-[80px] text-sm"
                data-testid="textarea-refinement"
              />
              <Button
                variant="outline"
                onClick={() => handleGenerate()}
                disabled={!refinement.trim() || isGenerating}
                data-testid="button-refine"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update Agent
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => { setConfig(null); setDescription(""); }}
          >
            Start over
          </Button>
        </>
      )}
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd /home/runner/workspace && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit**

```bash
git add client/src/pages/agent-builder.tsx
git commit -m "feat: add natural language agent builder page"
```

---

## Task 17: Add route and sidebar link for NL builder

**Files:**
- Modify: `client/src/App.tsx`
- Modify: `client/src/components/app-sidebar.tsx`

**Step 1: Add route in App.tsx**

Add import:
```typescript
import AgentBuilderPage from "@/pages/agent-builder";
```

Add route inside the `<Switch>` before `<Route component={NotFound} />`:
```tsx
<Route path="/build" component={AgentBuilderPage} />
```

**Step 2: Add sidebar link**

In `app-sidebar.tsx`, add `MessageSquarePlus` to the lucide import:
```typescript
import { Bot, FolderOpen, Rocket, Plus, Upload, Sparkles, MessageSquarePlus } from "lucide-react";
```

Add a query to check AI availability:
```typescript
const { data: aiStatus } = useQuery<{ available: boolean }>({
  queryKey: ["/api/ai/status"],
});
```

Add a "Build with AI" link in the Workspace section, before the Templates link (~line 113):
```tsx
{aiStatus?.available && (
  <SidebarMenuItem>
    <SidebarMenuButton
      asChild
      isActive={location === "/build"}
      tooltip="Build with AI"
    >
      <Link href="/build" data-testid="link-build">
        <MessageSquarePlus className="h-4 w-4" />
        <span>Build with AI</span>
      </Link>
    </SidebarMenuButton>
  </SidebarMenuItem>
)}
```

**Step 3: Verify TypeScript compiles**

Run: `cd /home/runner/workspace && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit**

```bash
git add client/src/App.tsx client/src/components/app-sidebar.tsx
git commit -m "feat: add /build route and conditional sidebar link for AI builder"
```

---

## Task 18: Run full test suite and type check

**Step 1: Run TypeScript check**

Run: `cd /home/runner/workspace && npx tsc --noEmit`
Expected: 0 errors

**Step 2: Run tests**

Run: `cd /home/runner/workspace && npx vitest run`
Expected: All tests pass

**Step 3: Fix any issues**

If errors are found, debug and fix them.

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve type and test issues from accessibility overhaul"
```

---

## Task 19: Build verification

**Step 1: Run production build**

Run: `cd /home/runner/workspace && npm run build`
Expected: Build exits 0

**Step 2: Verify output**

Run: `ls /home/runner/workspace/dist/`
Expected: `index.cjs` and `public/` directory with client assets

**Step 3: Commit if needed**

If build required fixes:
```bash
git add -A
git commit -m "fix: resolve build issues"
```

---

## Files Summary

| Action | File |
|---|---|
| Create | `client/src/data/tool-descriptions.ts` |
| Create | `client/src/data/help-content.ts` |
| Create | `client/src/components/help-section.tsx` |
| Create | `server/ai-prompts.ts` |
| Create | `server/ai-generate.ts` |
| Create | `client/src/pages/agent-builder.tsx` |
| Modify | `client/src/data/field-help.ts` |
| Modify | `client/src/pages/agent-editor.tsx` |
| Modify | `client/src/pages/agents.tsx` |
| Modify | `client/src/pages/deploy.tsx` |
| Modify | `client/src/pages/import.tsx` |
| Modify | `client/src/pages/project-editor.tsx` |
| Modify | `client/src/pages/projects.tsx` |
| Modify | `client/src/pages/templates.tsx` |
| Modify | `client/src/components/onboarding-dialog.tsx` |
| Modify | `client/src/components/app-sidebar.tsx` |
| Modify | `client/src/App.tsx` |
| Modify | `server/routes.ts` |

---

## Verification

1. `npx tsc --noEmit` — TypeScript compiles with 0 errors
2. `npx vitest run` — All existing tests pass
3. `npm run build` — Production build succeeds
4. Manual: Agent editor shows renamed labels (Instructions, AI Model, Capabilities, etc.)
5. Manual: "What is this?" help sections expand/collapse on every form group
6. Manual: Tool badges show tooltip descriptions on hover
7. Manual: Deploy page shows "Download & Install" heading
8. Manual: Project editor tabs show "Automations" and "Connections"
9. Manual: Project editor settings show "Permission Rules" and "Network Security" headers
10. Manual: Import page shows simplified language
11. Manual: Onboarding dialog shows 2-step concept-first flow
12. Manual: `/build` route shows NL builder (requires `ANTHROPIC_API_KEY`)
13. Manual: "Build with AI" link appears in sidebar only when API key is configured
14. Manual: `GET /api/ai/status` returns `{ available: true/false }`
