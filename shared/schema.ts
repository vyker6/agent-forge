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
  memoryScope: text("memory_scope").notNull().default("project"),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const commands = pgTable("commands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  promptTemplate: text("prompt_template").notNull().default(""),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projectAgents = pgTable("project_agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  agentId: varchar("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
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

export const AVAILABLE_TOOLS = [
  "Read", "Write", "Edit", "Bash", "Glob", "Grep",
  "MultiEdit", "TodoRead", "TodoWrite", "WebFetch",
  "WebSearch", "mcp__*"
] as const;

export const AVAILABLE_MODELS = [
  { value: "sonnet", label: "Claude Sonnet" },
  { value: "opus", label: "Claude Opus" },
  { value: "haiku", label: "Claude Haiku" },
] as const;

export const MEMORY_SCOPES = [
  { value: "user", label: "User (Global)" },
  { value: "project", label: "Project" },
  { value: "local", label: "Local" },
] as const;

export const AGENT_ICONS = [
  "bot", "brain", "code", "shield", "search", "zap",
  "terminal", "file-text", "git-branch", "database",
  "globe", "lock", "layers", "cpu", "settings", "wand"
] as const;
