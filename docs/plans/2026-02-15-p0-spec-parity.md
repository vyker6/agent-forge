# P0: Spec Parity for Agents, Skills & Commands — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add all missing Claude Code frontmatter fields to agents, skills, and commands. Enable inline editing of skills and commands. Update the export to output all new fields.

**Architecture:** Extend the existing Drizzle schema with new columns, add update endpoints for skills/commands, expand the agent editor UI with new form sections, and update the ZIP export to emit all non-default frontmatter values.

**Tech Stack:** Drizzle ORM (PostgreSQL), Express 5, React 18, TanStack Query, Radix UI/Shadcn, Tailwind CSS, Zod

---

### Task 1: Add new columns to agents schema

**Files:**
- Modify: `shared/schema.ts:6-17` (agents table)
- Modify: `shared/schema.ts:82-98` (constants)

**Step 1: Add new columns to the agents table definition**

In `shared/schema.ts`, add these columns to the `agents` pgTable after `color`:

```typescript
export const agents = pgTable("agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  systemPrompt: text("system_prompt").notNull().default(""),
  model: text("model").notNull().default("sonnet"),
  tools: text("tools").array().notNull().default(sql`ARRAY[]::text[]`),
  disallowedTools: text("disallowed_tools").array().notNull().default(sql`ARRAY[]::text[]`),
  memoryScope: text("memory_scope").notNull().default("project"),
  permissionMode: text("permission_mode").notNull().default("default"),
  maxTurns: integer("max_turns"),
  preloadedSkills: text("preloaded_skills").array().notNull().default(sql`ARRAY[]::text[]`),
  icon: text("icon").notNull().default("bot"),
  color: text("color").notNull().default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Step 2: Add the PERMISSION_MODES constant**

After `MEMORY_SCOPES`, add:

```typescript
export const PERMISSION_MODES = [
  { value: "default", label: "Default" },
  { value: "acceptEdits", label: "Accept Edits" },
  { value: "delegate", label: "Delegate" },
  { value: "dontAsk", label: "Don't Ask" },
  { value: "bypassPermissions", label: "Bypass Permissions" },
  { value: "plan", label: "Plan Mode" },
] as const;
```

**Step 3: Add "inherit" to AVAILABLE_MODELS**

Update the AVAILABLE_MODELS constant:

```typescript
export const AVAILABLE_MODELS = [
  { value: "inherit", label: "Inherit (Default)" },
  { value: "sonnet", label: "Claude Sonnet" },
  { value: "opus", label: "Claude Opus" },
  { value: "haiku", label: "Claude Haiku" },
] as const;
```

**Step 4: Push schema to database**

Run: `npm run db:push`
Expected: Schema sync succeeds, new columns added to `agents` table.

**Step 5: Commit**

```bash
git add shared/schema.ts
git commit -m "feat: add disallowedTools, permissionMode, maxTurns, preloadedSkills to agents schema"
```

---

### Task 2: Add new columns to skills schema

**Files:**
- Modify: `shared/schema.ts:19-28` (skills table)

**Step 1: Add new columns to the skills table definition**

```typescript
export const skills = pgTable("skills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  instructions: text("instructions").notNull().default(""),
  context: text("context").notNull().default("main"),
  allowedTools: text("allowed_tools").array().notNull().default(sql`ARRAY[]::text[]`),
  argumentHint: text("argument_hint").notNull().default(""),
  disableModelInvocation: text("disable_model_invocation").notNull().default("false"),
  userInvocable: text("user_invocable").notNull().default("true"),
  model: text("model").notNull().default(""),
  agentType: text("agent_type").notNull().default("general-purpose"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Note: `disableModelInvocation` and `userInvocable` are stored as text ("true"/"false") because Drizzle's boolean handling with defaults can be finicky. We parse them in the UI.

**Step 2: Push schema to database**

Run: `npm run db:push`
Expected: Schema sync succeeds, new columns added to `skills` table.

**Step 3: Commit**

```bash
git add shared/schema.ts
git commit -m "feat: add argumentHint, disableModelInvocation, userInvocable, model, agentType to skills schema"
```

---

### Task 3: Add new columns to commands schema

**Files:**
- Modify: `shared/schema.ts:30-37` (commands table)

**Step 1: Add new columns to the commands table definition**

```typescript
export const commands = pgTable("commands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  promptTemplate: text("prompt_template").notNull().default(""),
  argumentHint: text("argument_hint").notNull().default(""),
  disableModelInvocation: text("disable_model_invocation").notNull().default("false"),
  userInvocable: text("user_invocable").notNull().default("true"),
  model: text("model").notNull().default(""),
  context: text("context").notNull().default(""),
  agentType: text("agent_type").notNull().default(""),
  allowedTools: text("allowed_tools").array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

**Step 2: Push schema to database**

Run: `npm run db:push`
Expected: Schema sync succeeds, new columns added to `commands` table.

**Step 3: Commit**

```bash
git add shared/schema.ts
git commit -m "feat: add argumentHint, disableModelInvocation, userInvocable, model, context, agentType, allowedTools to commands schema"
```

---

### Task 4: Add updateSkill and updateCommand to storage

**Files:**
- Modify: `server/storage.ts:17-45` (IStorage interface)
- Modify: `server/storage.ts:78-89` (DatabaseStorage skill methods)
- Modify: `server/storage.ts:91-102` (DatabaseStorage command methods)

**Step 1: Add methods to the IStorage interface**

After `deleteSkill(id: string): Promise<void>;` add:
```typescript
updateSkill(id: string, data: Partial<InsertSkill>): Promise<Skill | undefined>;
```

After `deleteCommand(id: string): Promise<void>;` add:
```typescript
updateCommand(id: string, data: Partial<InsertCommand>): Promise<Command | undefined>;
```

**Step 2: Implement updateSkill in DatabaseStorage**

After the `deleteSkill` method, add:

```typescript
async updateSkill(id: string, data: Partial<InsertSkill>): Promise<Skill | undefined> {
  const [skill] = await db.update(skills).set(data).where(eq(skills.id, id)).returning();
  return skill;
}
```

**Step 3: Implement updateCommand in DatabaseStorage**

After the `deleteCommand` method, add:

```typescript
async updateCommand(id: string, data: Partial<InsertCommand>): Promise<Command | undefined> {
  const [cmd] = await db.update(commands).set(data).where(eq(commands.id, id)).returning();
  return cmd;
}
```

**Step 4: Commit**

```bash
git add server/storage.ts
git commit -m "feat: add updateSkill and updateCommand storage methods"
```

---

### Task 5: Add PATCH routes for skills and commands

**Files:**
- Modify: `server/routes.ts:57-68` (after skill create, before skill delete)
- Modify: `server/routes.ts:75-86` (after command create, before command delete)

**Step 1: Add PATCH /api/skills/:id route**

After the `app.post("/api/agents/:id/skills", ...)` block (around line 63) and before `app.delete("/api/skills/:id", ...)`, add:

```typescript
app.patch("/api/skills/:id", async (req, res) => {
  const parsed = insertSkillSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const skill = await storage.updateSkill(req.params.id, parsed.data);
  if (!skill) return res.status(404).json({ error: "Skill not found" });
  res.json(skill);
});
```

**Step 2: Add PATCH /api/commands/:id route**

After the `app.post("/api/agents/:id/commands", ...)` block and before `app.delete("/api/commands/:id", ...)`, add:

```typescript
app.patch("/api/commands/:id", async (req, res) => {
  const parsed = insertCommandSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
  const cmd = await storage.updateCommand(req.params.id, parsed.data);
  if (!cmd) return res.status(404).json({ error: "Command not found" });
  res.json(cmd);
});
```

**Step 3: Commit**

```bash
git add server/routes.ts
git commit -m "feat: add PATCH endpoints for skills and commands"
```

---

### Task 6: Update export to output all new agent frontmatter fields

**Files:**
- Modify: `server/routes.ts:183-195` (agent markdown generation in export)

**Step 1: Update the agent markdown generation**

Replace the agent markdown block inside the export route (lines 185-194) with:

```typescript
const slug = agent.name.toLowerCase().replace(/\s+/g, "-");
let agentMd = "---\n";
agentMd += `name: ${slug}\n`;
agentMd += `description: ${agent.description}\n`;
if (agent.tools.length > 0) {
  agentMd += `tools: ${agent.tools.join(", ")}\n`;
}
if (agent.disallowedTools.length > 0) {
  agentMd += `disallowedTools: ${agent.disallowedTools.join(", ")}\n`;
}
if (agent.model !== "inherit") {
  agentMd += `model: ${agent.model}\n`;
}
agentMd += `memory: ${agent.memoryScope}\n`;
if (agent.permissionMode !== "default") {
  agentMd += `permissionMode: ${agent.permissionMode}\n`;
}
if (agent.maxTurns != null) {
  agentMd += `maxTurns: ${agent.maxTurns}\n`;
}
if (agent.preloadedSkills.length > 0) {
  agentMd += `skills:\n`;
  for (const skillName of agent.preloadedSkills) {
    agentMd += `  - ${skillName}\n`;
  }
}
agentMd += "---\n\n";
agentMd += agent.systemPrompt;
archive.append(agentMd, { name: `.claude/agents/${slug}.md` });
```

**Step 2: Commit**

```bash
git add server/routes.ts
git commit -m "feat: export all new agent frontmatter fields (disallowedTools, permissionMode, maxTurns, skills)"
```

---

### Task 7: Update export to output all new skill frontmatter fields

**Files:**
- Modify: `server/routes.ts:197-208` (skill markdown generation in export)

**Step 1: Update the skill markdown generation**

Replace the skill markdown block with:

```typescript
for (const skill of agentSkills) {
  const skillSlug = skill.name.toLowerCase().replace(/\s+/g, "-");
  let skillMd = "---\n";
  skillMd += `name: ${skillSlug}\n`;
  skillMd += `description: ${skill.description}\n`;
  if (skill.context && skill.context !== "main") {
    skillMd += `context: ${skill.context}\n`;
  }
  if (skill.context === "fork" && skill.agentType && skill.agentType !== "general-purpose") {
    skillMd += `agent: ${skill.agentType}\n`;
  }
  if (skill.allowedTools.length > 0) {
    skillMd += `allowed-tools: ${skill.allowedTools.join(", ")}\n`;
  }
  if (skill.argumentHint) {
    skillMd += `argument-hint: "${skill.argumentHint}"\n`;
  }
  if (skill.disableModelInvocation === "true") {
    skillMd += `disable-model-invocation: true\n`;
  }
  if (skill.userInvocable === "false") {
    skillMd += `user-invocable: false\n`;
  }
  if (skill.model) {
    skillMd += `model: ${skill.model}\n`;
  }
  skillMd += "---\n\n";
  skillMd += skill.instructions;
  archive.append(skillMd, { name: `.claude/skills/${skillSlug}/SKILL.md` });
}
```

**Step 2: Commit**

```bash
git add server/routes.ts
git commit -m "feat: export all new skill frontmatter fields"
```

---

### Task 8: Update export to output all new command frontmatter fields

**Files:**
- Modify: `server/routes.ts:210-217` (command markdown generation in export)

**Step 1: Update the command markdown generation**

Replace the command markdown block with:

```typescript
for (const cmd of agentCommands) {
  let cmdMd = "---\n";
  cmdMd += `description: ${cmd.description}\n`;
  if (cmd.argumentHint) {
    cmdMd += `argument-hint: "${cmd.argumentHint}"\n`;
  }
  if (cmd.disableModelInvocation === "true") {
    cmdMd += `disable-model-invocation: true\n`;
  }
  if (cmd.userInvocable === "false") {
    cmdMd += `user-invocable: false\n`;
  }
  if (cmd.model) {
    cmdMd += `model: ${cmd.model}\n`;
  }
  if (cmd.context) {
    cmdMd += `context: ${cmd.context}\n`;
  }
  if (cmd.context === "fork" && cmd.agentType) {
    cmdMd += `agent: ${cmd.agentType}\n`;
  }
  if (cmd.allowedTools.length > 0) {
    cmdMd += `allowed-tools: ${cmd.allowedTools.join(", ")}\n`;
  }
  cmdMd += "---\n\n";
  cmdMd += cmd.promptTemplate;
  archive.append(cmdMd, { name: `.claude/commands/${cmd.name}.md` });
}
```

**Step 2: Commit**

```bash
git add server/routes.ts
git commit -m "feat: export all new command frontmatter fields"
```

---

### Task 9: Update agent editor form state and Configuration tab

**Files:**
- Modify: `client/src/pages/agent-editor.tsx:46-55` (form initial state)
- Modify: `client/src/pages/agent-editor.tsx:77-90` (useEffect form sync)
- Modify: `client/src/pages/agent-editor.tsx:244-391` (AgentConfigForm)

**Step 1: Update the form initial state** (line 46-55)

```typescript
const [form, setForm] = useState<InsertAgent>({
  name: "",
  description: "",
  systemPrompt: "",
  model: "sonnet",
  tools: [],
  disallowedTools: [],
  memoryScope: "project",
  permissionMode: "default",
  maxTurns: null,
  preloadedSkills: [],
  icon: "bot",
  color: "#3b82f6",
});
```

**Step 2: Update the useEffect form sync** (line 77-90)

```typescript
useEffect(() => {
  if (agent) {
    setForm({
      name: agent.name,
      description: agent.description,
      systemPrompt: agent.systemPrompt,
      model: agent.model,
      tools: agent.tools,
      disallowedTools: agent.disallowedTools,
      memoryScope: agent.memoryScope,
      permissionMode: agent.permissionMode,
      maxTurns: agent.maxTurns,
      preloadedSkills: agent.preloadedSkills,
      icon: agent.icon,
      color: agent.color,
    });
  }
}, [agent]);
```

**Step 3: Import PERMISSION_MODES from schema**

Update the import on line 9:

```typescript
import { AVAILABLE_TOOLS, AVAILABLE_MODELS, MEMORY_SCOPES, PERMISSION_MODES } from "@shared/schema";
```

**Step 4: Add toggleDisallowedTool handler**

After the `toggleTool` function (around line 122), add:

```typescript
const toggleDisallowedTool = (tool: string) => {
  setForm((prev) => ({
    ...prev,
    disallowedTools: (prev.disallowedTools ?? []).includes(tool)
      ? (prev.disallowedTools ?? []).filter((t) => t !== tool)
      : [...(prev.disallowedTools ?? []), tool],
  }));
};
```

**Step 5: Pass new props to AgentConfigForm**

Update the AgentConfigForm call (line 217-221):

```tsx
<AgentConfigForm
  form={form}
  setForm={setForm}
  toggleTool={toggleTool}
  toggleDisallowedTool={toggleDisallowedTool}
  skills={skills}
/>
```

**Step 6: Update AgentConfigForm props and add new form sections**

Update the function signature and add sections after the Allowed Tools section (before the closing `</div>` of the outer container):

Add the `toggleDisallowedTool` and `skills` props. Then add these sections at the end of the form (after the Allowed Tools section):

1. **Disallowed Tools section** — same toggle badge pattern as tools, using `toggleDisallowedTool`
2. **Permissions section** — `permissionMode` dropdown using `PERMISSION_MODES`, `maxTurns` number input
3. **Preloaded Skills section** — checkbox list from the `skills` array, toggling `preloadedSkills` by skill name slug

Each section separated by `<Separator />`.

For Disallowed Tools:
```tsx
<Separator />

<div className="space-y-3">
  <div>
    <Label>Disallowed Tools</Label>
    <p className="text-xs text-muted-foreground mt-1">
      Tools this agent is explicitly denied from using
    </p>
  </div>
  <div className="flex flex-wrap gap-2">
    {AVAILABLE_TOOLS.map((tool) => (
      <Badge
        key={tool}
        variant={(form.disallowedTools ?? []).includes(tool) ? "destructive" : "outline"}
        className="cursor-pointer"
        onClick={() => toggleDisallowedTool(tool)}
      >
        {tool}
      </Badge>
    ))}
  </div>
</div>
```

For Permission Mode and Max Turns:
```tsx
<Separator />

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <div className="space-y-2">
    <Label>Permission Mode</Label>
    <p className="text-xs text-muted-foreground">
      How the agent handles permission requests
    </p>
    <Select
      value={form.permissionMode ?? "default"}
      onValueChange={(v) => setForm((f) => ({ ...f, permissionMode: v }))}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERMISSION_MODES.map((m) => (
          <SelectItem key={m.value} value={m.value}>
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
  <div className="space-y-2">
    <Label>Max Turns</Label>
    <p className="text-xs text-muted-foreground">
      Limit agentic turns (blank = unlimited)
    </p>
    <Input
      type="number"
      min={1}
      value={form.maxTurns ?? ""}
      onChange={(e) => setForm((f) => ({
        ...f,
        maxTurns: e.target.value ? parseInt(e.target.value, 10) : null,
      }))}
      placeholder="Unlimited"
    />
  </div>
</div>
```

For Preloaded Skills (only show when skills exist):
```tsx
{skills.length > 0 && (
  <>
    <Separator />
    <div className="space-y-3">
      <div>
        <Label>Preloaded Skills</Label>
        <p className="text-xs text-muted-foreground mt-1">
          Skills whose content is injected into this agent's context at startup
        </p>
      </div>
      <div className="space-y-2">
        {skills.map((skill) => {
          const slug = skill.name.toLowerCase().replace(/\s+/g, "-");
          const checked = (form.preloadedSkills ?? []).includes(slug);
          return (
            <label key={skill.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={checked}
                onCheckedChange={(val) => {
                  setForm((f) => ({
                    ...f,
                    preloadedSkills: val
                      ? [...(f.preloadedSkills ?? []), slug]
                      : (f.preloadedSkills ?? []).filter((s) => s !== slug),
                  }));
                }}
              />
              <span className="text-sm">{skill.name}</span>
              <span className="text-xs text-muted-foreground">({slug})</span>
            </label>
          );
        })}
      </div>
    </div>
  </>
)}
```

Note: Import `Checkbox` from `@/components/ui/checkbox` at the top of the file.

**Step 7: Commit**

```bash
git add client/src/pages/agent-editor.tsx
git commit -m "feat: add disallowedTools, permissionMode, maxTurns, preloadedSkills to agent editor UI"
```

---

### Task 10: Add inline editing to Skills tab

**Files:**
- Modify: `client/src/pages/agent-editor.tsx:393-549` (SkillsTab component)

**Step 1: Replace the SkillsTab component**

The current SkillsTab only supports create and delete. Replace it with a version that:

1. Adds an `editingSkillId` state (string | null)
2. Adds an `editForm` state mirroring the skill fields
3. Adds an `updateMutation` that PATCHes `/api/skills/:id`
4. When a skill card is clicked, sets `editingSkillId` and populates `editForm`
5. Shows all fields in edit mode: name, description, instructions, context, agentType (if context=fork), allowedTools (toggle badges), argumentHint, disableModelInvocation (switch), userInvocable (switch), model (dropdown)
6. Save/Cancel buttons on each card in edit mode

Key patterns:
- `editingSkillId === skill.id` toggles between display and edit mode
- The edit form includes all new fields
- `agentType` dropdown only shows when `context === "fork"` — options: "general-purpose", "Explore", "Plan"
- Model dropdown includes "Inherit (Default)", "Sonnet", "Opus", "Haiku"
- Switches for `disableModelInvocation` and `userInvocable` with text labels

The create form (showNew) should also include all new fields, matching the same layout.

**Step 2: Commit**

```bash
git add client/src/pages/agent-editor.tsx
git commit -m "feat: add inline editing with all spec fields to Skills tab"
```

---

### Task 11: Add inline editing to Commands tab

**Files:**
- Modify: `client/src/pages/agent-editor.tsx:551-693` (CommandsTab component)

**Step 1: Replace the CommandsTab component**

Same pattern as Skills tab:

1. `editingCommandId` state
2. `editForm` state with all command fields
3. `updateMutation` that PATCHes `/api/commands/:id`
4. Click card to enter edit mode
5. Edit form includes: name, description, promptTemplate, argumentHint, context (dropdown: none/main/fork), agentType (if context=fork), allowedTools, model, disableModelInvocation (switch), userInvocable (switch)
6. Save/Cancel per card

The create form should also include all new fields.

**Step 2: Commit**

```bash
git add client/src/pages/agent-editor.tsx
git commit -m "feat: add inline editing with all spec fields to Commands tab"
```

---

### Task 12: Update seed data to showcase new fields

**Files:**
- Modify: `server/seed.ts`

**Step 1: Update seed agents to use new fields**

Update the Code Reviewer agent to include:
- `disallowedTools: ["Write", "Edit"]` (reviewer shouldn't modify code)
- `permissionMode: "acceptEdits"`
- `maxTurns: 20`

Update the Architect agent to include:
- `permissionMode: "plan"`
- `maxTurns: 50`

Update the Test Engineer to include:
- `permissionMode: "acceptEdits"`

Update seed skills to include new fields where appropriate:
- `security-audit` skill: `argumentHint: "[file-path]"`, `disableModelInvocation: "false"`, `userInvocable: "true"`
- `adr-writer` skill: `argumentHint: "[topic]"`, `userInvocable: "true"`

Update seed commands:
- `review-pr`: `argumentHint: "[PR-number]"`
- `generate-tests`: `argumentHint: "[file-path]"`, `context: "fork"`

**Step 2: Commit**

```bash
git add server/seed.ts
git commit -m "feat: update seed data to demonstrate new agent/skill/command fields"
```

---

### Task 13: Run full build check and verify

**Step 1: Type-check**

Run: `npx tsc --noEmit`
Expected: No new errors (pre-existing errors in agent-editor.tsx are acceptable if they are the same ones from before)

**Step 2: Push database schema**

Run: `npm run db:push`
Expected: Schema sync succeeds

**Step 3: Start dev server and smoke test**

Run: `npm run dev`
Expected: App starts, navigating to `/agents/new` shows new form fields, saving an agent persists all fields, export includes new frontmatter

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve any issues from P0 integration"
```

---

## Task Dependency Summary

```
Task 1 (agent schema) ─┐
Task 2 (skill schema)  ├─→ Task 4 (storage methods) → Task 5 (routes) ─┐
Task 3 (cmd schema)   ─┘                                                │
                                                                         ├─→ Task 9 (agent editor UI)
Task 6 (export agents) ←─ Task 1                                        ├─→ Task 10 (skills inline edit)
Task 7 (export skills) ←─ Task 2                                        ├─→ Task 11 (commands inline edit)
Task 8 (export cmds)   ←─ Task 3                                        └─→ Task 12 (seed data)
                                                                              │
                                                                              └─→ Task 13 (verify)
```

Tasks 1-3 can run in parallel. Tasks 6-8 can run in parallel after their respective schema tasks. Tasks 9-12 can run in parallel after Task 5. Task 13 runs last.
