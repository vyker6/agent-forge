import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  mcpServers: text("mcp_servers").array().notNull().default(sql`ARRAY[]::text[]`),
  icon: text("icon").notNull().default("bot"),
  color: text("color").notNull().default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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

export const fileMapEntries = pgTable("file_map_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  description: text("description").notNull().default(""),
  entryType: text("entry_type").notNull().default("directory"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  claudeMdContent: text("claude_md_content").notNull().default(""),
  pluginVersion: text("plugin_version").notNull().default(""),
  pluginAuthorName: text("plugin_author_name").notNull().default(""),
  pluginAuthorEmail: text("plugin_author_email").notNull().default(""),
  pluginHomepage: text("plugin_homepage").notNull().default(""),
  pluginRepository: text("plugin_repository").notNull().default(""),
  pluginLicense: text("plugin_license").notNull().default("MIT"),
  pluginKeywords: text("plugin_keywords").array().notNull().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectAgents = pgTable("project_agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  agentId: varchar("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
});

export const rules = pgTable("rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  paths: text("paths").array().notNull().default(sql`ARRAY[]::text[]`),
  content: text("content").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectSettings = pgTable("project_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  permissionAllow: text("permission_allow").array().notNull().default(sql`ARRAY[]::text[]`),
  permissionDeny: text("permission_deny").array().notNull().default(sql`ARRAY[]::text[]`),
  permissionAsk: text("permission_ask").array().notNull().default(sql`ARRAY[]::text[]`),
  defaultPermissionMode: text("default_permission_mode").notNull().default(""),
  sandboxEnabled: text("sandbox_enabled").notNull().default(""),
  sandboxAutoAllow: text("sandbox_auto_allow").notNull().default(""),
  sandboxAllowedDomains: text("sandbox_allowed_domains").array().notNull().default(sql`ARRAY[]::text[]`),
  sandboxAllowLocalBinding: text("sandbox_allow_local_binding").notNull().default(""),
  sandboxExcludedCommands: text("sandbox_excluded_commands").array().notNull().default(sql`ARRAY[]::text[]`),
  defaultModel: text("default_model").notNull().default(""),
});

export const hooks = pgTable("hooks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  event: text("event").notNull(),
  matcher: text("matcher").notNull().default(""),
  handlerType: text("handler_type").notNull(),
  command: text("command").notNull().default(""),
  prompt: text("prompt").notNull().default(""),
  timeout: integer("timeout"),
  statusMessage: text("status_message").notNull().default(""),
  isAsync: text("is_async").notNull().default("false"),
  once: text("once").notNull().default("false"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mcpServers = pgTable("mcp_servers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  command: text("command").notNull(),
  args: text("args").array().notNull().default(sql`ARRAY[]::text[]`),
  env: jsonb("env").notNull().default({}),
  cwd: text("cwd").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const agentLikes = pgTable("agent_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  clientId: varchar("client_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAgentSchema = createInsertSchema(agents).omit({ id: true, createdAt: true });
export const insertSkillSchema = createInsertSchema(skills).omit({ id: true, createdAt: true });
export const insertCommandSchema = createInsertSchema(commands).omit({ id: true, createdAt: true });
export const insertFileMapEntrySchema = createInsertSchema(fileMapEntries).omit({ id: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertProjectAgentSchema = createInsertSchema(projectAgents).omit({ id: true });

export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Agent = typeof agents.$inferSelect;
export type InsertSkill = z.infer<typeof insertSkillSchema>;
export type Skill = typeof skills.$inferSelect;
export type InsertCommand = z.infer<typeof insertCommandSchema>;
export type Command = typeof commands.$inferSelect;
export type InsertFileMapEntry = z.infer<typeof insertFileMapEntrySchema>;
export type FileMapEntry = typeof fileMapEntries.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProjectAgent = z.infer<typeof insertProjectAgentSchema>;
export type ProjectAgent = typeof projectAgents.$inferSelect;

export const insertRuleSchema = createInsertSchema(rules).omit({ id: true, createdAt: true });
export type InsertRule = z.infer<typeof insertRuleSchema>;
export type Rule = typeof rules.$inferSelect;

export const insertProjectSettingsSchema = createInsertSchema(projectSettings).omit({ id: true });
export type InsertProjectSettings = z.infer<typeof insertProjectSettingsSchema>;
export type ProjectSettings = typeof projectSettings.$inferSelect;

export const insertHookSchema = createInsertSchema(hooks).omit({ id: true, createdAt: true });
export type InsertHook = z.infer<typeof insertHookSchema>;
export type Hook = typeof hooks.$inferSelect;

export const insertMcpServerSchema = createInsertSchema(mcpServers).omit({ id: true, createdAt: true });
export type InsertMcpServer = z.infer<typeof insertMcpServerSchema>;
export type McpServer = typeof mcpServers.$inferSelect;

export type AgentLike = typeof agentLikes.$inferSelect;

export const AVAILABLE_TOOLS = [
  "Read", "Write", "Edit", "Bash", "Glob", "Grep",
  "MultiEdit", "TodoRead", "TodoWrite", "WebFetch",
  "WebSearch", "mcp__*"
] as const;

export const AVAILABLE_MODELS = [
  { value: "inherit", label: "Inherit (Default)" },
  { value: "sonnet", label: "Claude Sonnet" },
  { value: "opus", label: "Claude Opus" },
  { value: "haiku", label: "Claude Haiku" },
] as const;

export const MEMORY_SCOPES = [
  { value: "user", label: "User (Global)" },
  { value: "project", label: "Project" },
  { value: "local", label: "Local" },
] as const;

export const PERMISSION_MODES = [
  { value: "default", label: "Default" },
  { value: "acceptEdits", label: "Accept Edits" },
  { value: "delegate", label: "Delegate" },
  { value: "dontAsk", label: "Don't Ask" },
  { value: "bypassPermissions", label: "Bypass Permissions" },
  { value: "plan", label: "Plan Mode" },
] as const;

export const AGENT_ICONS = [
  "bot", "brain", "code", "shield", "search", "zap",
  "terminal", "file-text", "git-branch", "database",
  "globe", "lock", "layers", "cpu", "settings", "wand"
] as const;

export const HOOK_EVENTS = [
  { value: "SessionStart", label: "Session Start", group: "Session" },
  { value: "SessionEnd", label: "Session End", group: "Session" },
  { value: "UserPromptSubmit", label: "User Prompt Submit", group: "User" },
  { value: "PreToolUse", label: "Pre Tool Use", group: "Tool" },
  { value: "PermissionRequest", label: "Permission Request", group: "Tool" },
  { value: "PostToolUse", label: "Post Tool Use", group: "Tool" },
  { value: "PostToolUseFailure", label: "Post Tool Use Failure", group: "Tool" },
  { value: "SubagentStart", label: "Subagent Start", group: "Agent" },
  { value: "SubagentStop", label: "Subagent Stop", group: "Agent" },
  { value: "Stop", label: "Stop", group: "Completion" },
  { value: "TeammateIdle", label: "Teammate Idle", group: "Completion" },
  { value: "TaskCompleted", label: "Task Completed", group: "Completion" },
  { value: "PreCompact", label: "Pre Compact", group: "Maintenance" },
  { value: "Notification", label: "Notification", group: "Notification" },
] as const;

export const HOOK_HANDLER_TYPES = [
  { value: "command", label: "Shell Command" },
  { value: "prompt", label: "Prompt" },
] as const;

export const MCP_SERVER_TEMPLATES = [
  { label: "GitHub", name: "github", command: "npx", args: ["-y", "@modelcontextprotocol/server-github"], env: { GITHUB_PERSONAL_ACCESS_TOKEN: "" } },
  { label: "Filesystem", name: "filesystem", command: "npx", args: ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/directory"], env: {} },
  { label: "PostgreSQL", name: "postgres", command: "npx", args: ["-y", "@modelcontextprotocol/server-postgres"], env: { POSTGRES_CONNECTION_STRING: "" } },
  { label: "Brave Search", name: "brave-search", command: "npx", args: ["-y", "@modelcontextprotocol/server-brave-search"], env: { BRAVE_API_KEY: "" } },
] as const;
