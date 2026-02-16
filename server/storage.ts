import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  agents, skills, commands, fileMapEntries, projects, projectAgents,
  rules, projectSettings, hooks, mcpServers,
  type Agent, type InsertAgent,
  type Skill, type InsertSkill,
  type Command, type InsertCommand,
  type FileMapEntry, type InsertFileMapEntry,
  type Project, type InsertProject,
  type ProjectAgent, type InsertProjectAgent,
  type Rule, type InsertRule,
  type ProjectSettings, type InsertProjectSettings,
  type Hook, type InsertHook,
  type McpServer, type InsertMcpServer,
} from "@shared/schema";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export interface IStorage {
  getAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | undefined>;
  createAgent(data: InsertAgent): Promise<Agent>;
  updateAgent(id: string, data: Partial<InsertAgent>): Promise<Agent | undefined>;
  deleteAgent(id: string): Promise<void>;
  duplicateAgent(id: string): Promise<Agent | undefined>;

  getSkills(agentId: string): Promise<Skill[]>;
  createSkill(data: InsertSkill): Promise<Skill>;
  deleteSkill(id: string): Promise<void>;
  updateSkill(id: string, data: Partial<InsertSkill>): Promise<Skill | undefined>;

  getCommands(agentId: string): Promise<Command[]>;
  createCommand(data: InsertCommand): Promise<Command>;
  deleteCommand(id: string): Promise<void>;
  updateCommand(id: string, data: Partial<InsertCommand>): Promise<Command | undefined>;

  getFileMapEntries(agentId: string): Promise<FileMapEntry[]>;
  createFileMapEntry(data: InsertFileMapEntry): Promise<FileMapEntry>;
  deleteFileMapEntry(id: string): Promise<void>;

  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(data: InsertProject): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined>;

  getProjectAgents(projectId: string): Promise<ProjectAgent[]>;
  addProjectAgent(data: InsertProjectAgent): Promise<ProjectAgent>;
  removeProjectAgent(projectId: string, agentId: string): Promise<void>;

  getRules(projectId: string): Promise<Rule[]>;
  createRule(data: InsertRule): Promise<Rule>;
  updateRule(id: string, data: Partial<InsertRule>): Promise<Rule | undefined>;
  deleteRule(id: string): Promise<void>;

  getProjectSettings(projectId: string): Promise<ProjectSettings | undefined>;
  upsertProjectSettings(projectId: string, data: Partial<InsertProjectSettings>): Promise<ProjectSettings>;

  getHooks(projectId: string): Promise<Hook[]>;
  createHook(data: InsertHook): Promise<Hook>;
  updateHook(id: string, data: Partial<InsertHook>): Promise<Hook | undefined>;
  deleteHook(id: string): Promise<void>;

  getMcpServers(projectId: string): Promise<McpServer[]>;
  createMcpServer(data: InsertMcpServer): Promise<McpServer>;
  updateMcpServer(id: string, data: Partial<InsertMcpServer>): Promise<McpServer | undefined>;
  deleteMcpServer(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAgents(): Promise<Agent[]> {
    return db.select().from(agents).orderBy(agents.createdAt);
  }

  async getAgent(id: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  }

  async createAgent(data: InsertAgent): Promise<Agent> {
    const [agent] = await db.insert(agents).values(data).returning();
    return agent;
  }

  async updateAgent(id: string, data: Partial<InsertAgent>): Promise<Agent | undefined> {
    const [agent] = await db.update(agents).set(data).where(eq(agents.id, id)).returning();
    return agent;
  }

  async deleteAgent(id: string): Promise<void> {
    await db.delete(agents).where(eq(agents.id, id));
  }

  async duplicateAgent(id: string): Promise<Agent | undefined> {
    const original = await this.getAgent(id);
    if (!original) return undefined;
    const { id: _, createdAt, ...rest } = original;
    return this.createAgent({ ...rest, name: `${rest.name} (Copy)` });
  }

  async getSkills(agentId: string): Promise<Skill[]> {
    return db.select().from(skills).where(eq(skills.agentId, agentId)).orderBy(skills.createdAt);
  }

  async createSkill(data: InsertSkill): Promise<Skill> {
    const [skill] = await db.insert(skills).values(data).returning();
    return skill;
  }

  async deleteSkill(id: string): Promise<void> {
    await db.delete(skills).where(eq(skills.id, id));
  }

  async updateSkill(id: string, data: Partial<InsertSkill>): Promise<Skill | undefined> {
    const [skill] = await db.update(skills).set(data).where(eq(skills.id, id)).returning();
    return skill;
  }

  async getCommands(agentId: string): Promise<Command[]> {
    return db.select().from(commands).where(eq(commands.agentId, agentId)).orderBy(commands.createdAt);
  }

  async createCommand(data: InsertCommand): Promise<Command> {
    const [cmd] = await db.insert(commands).values(data).returning();
    return cmd;
  }

  async deleteCommand(id: string): Promise<void> {
    await db.delete(commands).where(eq(commands.id, id));
  }

  async updateCommand(id: string, data: Partial<InsertCommand>): Promise<Command | undefined> {
    const [cmd] = await db.update(commands).set(data).where(eq(commands.id, id)).returning();
    return cmd;
  }

  async getFileMapEntries(agentId: string): Promise<FileMapEntry[]> {
    return db.select().from(fileMapEntries).where(eq(fileMapEntries.agentId, agentId)).orderBy(fileMapEntries.sortOrder);
  }

  async createFileMapEntry(data: InsertFileMapEntry): Promise<FileMapEntry> {
    const [entry] = await db.insert(fileMapEntries).values(data).returning();
    return entry;
  }

  async deleteFileMapEntry(id: string): Promise<void> {
    await db.delete(fileMapEntries).where(eq(fileMapEntries.id, id));
  }

  async getProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(projects.createdAt);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async createProject(data: InsertProject): Promise<Project> {
    const [project] = await db.insert(projects).values(data).returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined> {
    const [project] = await db.update(projects).set(data).where(eq(projects.id, id)).returning();
    return project;
  }

  async getProjectAgents(projectId: string): Promise<ProjectAgent[]> {
    return db.select().from(projectAgents).where(eq(projectAgents.projectId, projectId));
  }

  async addProjectAgent(data: InsertProjectAgent): Promise<ProjectAgent> {
    const [pa] = await db.insert(projectAgents).values(data).returning();
    return pa;
  }

  async removeProjectAgent(projectId: string, agentId: string): Promise<void> {
    const all = await db.select().from(projectAgents)
      .where(eq(projectAgents.projectId, projectId));
    const match = all.find((pa) => pa.agentId === agentId);
    if (match) {
      await db.delete(projectAgents).where(eq(projectAgents.id, match.id));
    }
  }

  async getRules(projectId: string): Promise<Rule[]> {
    return db.select().from(rules).where(eq(rules.projectId, projectId)).orderBy(rules.sortOrder);
  }

  async createRule(data: InsertRule): Promise<Rule> {
    const [rule] = await db.insert(rules).values(data).returning();
    return rule;
  }

  async updateRule(id: string, data: Partial<InsertRule>): Promise<Rule | undefined> {
    const [rule] = await db.update(rules).set(data).where(eq(rules.id, id)).returning();
    return rule;
  }

  async deleteRule(id: string): Promise<void> {
    await db.delete(rules).where(eq(rules.id, id));
  }

  async getProjectSettings(projectId: string): Promise<ProjectSettings | undefined> {
    const [settings] = await db.select().from(projectSettings).where(eq(projectSettings.projectId, projectId));
    return settings;
  }

  async upsertProjectSettings(projectId: string, data: Partial<InsertProjectSettings>): Promise<ProjectSettings> {
    const existing = await this.getProjectSettings(projectId);
    if (existing) {
      const [updated] = await db.update(projectSettings).set(data).where(eq(projectSettings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(projectSettings).values({ ...data, projectId }).returning();
    return created;
  }

  async getHooks(projectId: string): Promise<Hook[]> {
    return db.select().from(hooks).where(eq(hooks.projectId, projectId)).orderBy(hooks.sortOrder);
  }

  async createHook(data: InsertHook): Promise<Hook> {
    const [hook] = await db.insert(hooks).values(data).returning();
    return hook;
  }

  async updateHook(id: string, data: Partial<InsertHook>): Promise<Hook | undefined> {
    const [hook] = await db.update(hooks).set(data).where(eq(hooks.id, id)).returning();
    return hook;
  }

  async deleteHook(id: string): Promise<void> {
    await db.delete(hooks).where(eq(hooks.id, id));
  }

  async getMcpServers(projectId: string): Promise<McpServer[]> {
    return db.select().from(mcpServers).where(eq(mcpServers.projectId, projectId)).orderBy(mcpServers.sortOrder);
  }

  async createMcpServer(data: InsertMcpServer): Promise<McpServer> {
    const [server] = await db.insert(mcpServers).values(data).returning();
    return server;
  }

  async updateMcpServer(id: string, data: Partial<InsertMcpServer>): Promise<McpServer | undefined> {
    const [server] = await db.update(mcpServers).set(data).where(eq(mcpServers.id, id)).returning();
    return server;
  }

  async deleteMcpServer(id: string): Promise<void> {
    await db.delete(mcpServers).where(eq(mcpServers.id, id));
  }
}

export const storage = new DatabaseStorage();
