import type { Express } from "express";
import { createServer, type Server } from "http";
import archiver from "archiver";
import { storage } from "./storage";
import {
  insertAgentSchema, insertSkillSchema, insertCommandSchema,
  insertFileMapEntrySchema, insertProjectSchema, insertProjectAgentSchema
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/agents", async (_req, res) => {
    const agents = await storage.getAgents();
    res.json(agents);
  });

  app.get("/api/agents/:id", async (req, res) => {
    const agent = await storage.getAgent(req.params.id);
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    res.json(agent);
  });

  app.post("/api/agents", async (req, res) => {
    const parsed = insertAgentSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const agent = await storage.createAgent(parsed.data);
    res.status(201).json(agent);
  });

  app.patch("/api/agents/:id", async (req, res) => {
    const parsed = insertAgentSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const agent = await storage.updateAgent(req.params.id, parsed.data);
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    res.json(agent);
  });

  app.delete("/api/agents/:id", async (req, res) => {
    await storage.deleteAgent(req.params.id);
    res.status(204).end();
  });

  app.post("/api/agents/:id/duplicate", async (req, res) => {
    const agent = await storage.duplicateAgent(req.params.id);
    if (!agent) return res.status(404).json({ error: "Agent not found" });
    res.status(201).json(agent);
  });

  app.get("/api/agents/:id/skills", async (req, res) => {
    const items = await storage.getSkills(req.params.id);
    res.json(items);
  });

  app.post("/api/agents/:id/skills", async (req, res) => {
    const data = { ...req.body, agentId: req.params.id };
    const parsed = insertSkillSchema.safeParse(data);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const skill = await storage.createSkill(parsed.data);
    res.status(201).json(skill);
  });

  app.patch("/api/skills/:id", async (req, res) => {
    const parsed = insertSkillSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const skill = await storage.updateSkill(req.params.id, parsed.data);
    if (!skill) return res.status(404).json({ error: "Skill not found" });
    res.json(skill);
  });

  app.delete("/api/skills/:id", async (req, res) => {
    await storage.deleteSkill(req.params.id);
    res.status(204).end();
  });

  app.get("/api/agents/:id/commands", async (req, res) => {
    const items = await storage.getCommands(req.params.id);
    res.json(items);
  });

  app.post("/api/agents/:id/commands", async (req, res) => {
    const data = { ...req.body, agentId: req.params.id };
    const parsed = insertCommandSchema.safeParse(data);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const cmd = await storage.createCommand(parsed.data);
    res.status(201).json(cmd);
  });

  app.patch("/api/commands/:id", async (req, res) => {
    const parsed = insertCommandSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const cmd = await storage.updateCommand(req.params.id, parsed.data);
    if (!cmd) return res.status(404).json({ error: "Command not found" });
    res.json(cmd);
  });

  app.delete("/api/commands/:id", async (req, res) => {
    await storage.deleteCommand(req.params.id);
    res.status(204).end();
  });

  app.get("/api/agents/:id/file-map", async (req, res) => {
    const items = await storage.getFileMapEntries(req.params.id);
    res.json(items);
  });

  app.post("/api/agents/:id/file-map", async (req, res) => {
    const data = { ...req.body, agentId: req.params.id };
    const parsed = insertFileMapEntrySchema.safeParse(data);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const entry = await storage.createFileMapEntry(parsed.data);
    res.status(201).json(entry);
  });

  app.delete("/api/file-map/:id", async (req, res) => {
    await storage.deleteFileMapEntry(req.params.id);
    res.status(204).end();
  });

  app.get("/api/projects", async (_req, res) => {
    const items = await storage.getProjects();
    res.json(items);
  });

  app.post("/api/projects", async (req, res) => {
    const parsed = insertProjectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const project = await storage.createProject(parsed.data);
    res.status(201).json(project);
  });

  app.delete("/api/projects/:id", async (req, res) => {
    await storage.deleteProject(req.params.id);
    res.status(204).end();
  });

  app.get("/api/projects/:id/agents", async (req, res) => {
    const items = await storage.getProjectAgents(req.params.id);
    res.json(items);
  });

  app.post("/api/projects/:id/agents", async (req, res) => {
    const data = { projectId: req.params.id, agentId: req.body.agentId };
    const parsed = insertProjectAgentSchema.safeParse(data);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const pa = await storage.addProjectAgent(parsed.data);
    res.status(201).json(pa);
  });

  app.delete("/api/projects/:id/agents/:agentId", async (req, res) => {
    await storage.removeProjectAgent(req.params.id, req.params.agentId);
    res.status(204).end();
  });

  app.get("/api/projects/:id/export", async (req, res) => {
    const project = await storage.getProject(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const pas = await storage.getProjectAgents(project.id);
    const agentIds = pas.map((pa) => pa.agentId);

    const agentList = [];
    for (const aid of agentIds) {
      const agent = await storage.getAgent(aid);
      if (!agent) continue;
      const agentSkills = await storage.getSkills(aid);
      const agentCommands = await storage.getCommands(aid);
      const agentFileMap = await storage.getFileMapEntries(aid);
      agentList.push({ agent, skills: agentSkills, commands: agentCommands, fileMap: agentFileMap });
    }

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${project.name}-claude-config.zip"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.pipe(res);

    let claudeMd = project.claudeMdContent || `# ${project.name}\n\n${project.description}`;
    if (agentList.length > 0) {
      const fileMapSections = agentList.filter(({ fileMap }) => fileMap.length > 0);
      if (fileMapSections.length > 0) {
        claudeMd += "\n\n## File Maps\n";
        for (const { agent, fileMap } of fileMapSections) {
          claudeMd += `\n### ${agent.name} File Map\n`;
          for (const entry of fileMap) {
            claudeMd += `- \`${entry.path}\` - ${entry.description}\n`;
          }
        }
      }
    }
    archive.append(claudeMd, { name: ".claude/CLAUDE.md" });

    archive.append("", { name: ".claude/agents/.gitkeep" });
    archive.append("", { name: ".claude/commands/.gitkeep" });
    archive.append("", { name: ".claude/skills/.gitkeep" });

    for (const { agent, skills: agentSkills, commands: agentCommands } of agentList) {
      const slug = agent.name.toLowerCase().replace(/\s+/g, "-");
      let agentMd = "---\n";
      agentMd += `name: ${slug}\n`;
      agentMd += `description: ${agent.description}\n`;
      agentMd += `memory: ${agent.memoryScope}\n`;
      if (agent.tools.length > 0) {
        agentMd += `tools: ${agent.tools.join(", ")}\n`;
      }
      agentMd += `model: ${agent.model}\n`;
      agentMd += "---\n\n";
      agentMd += agent.systemPrompt;
      archive.append(agentMd, { name: `.claude/agents/${slug}.md` });

      for (const skill of agentSkills) {
        const skillSlug = skill.name.toLowerCase().replace(/\s+/g, "-");
        let skillMd = "---\n";
        skillMd += `name: ${skillSlug}\n`;
        skillMd += `description: ${skill.description}\n`;
        skillMd += `context: ${skill.context}\n`;
        if (skill.allowedTools.length > 0) {
          skillMd += `allowed-tools: ${skill.allowedTools.join(", ")}\n`;
        }
        skillMd += "---\n\n";
        skillMd += skill.instructions;
        archive.append(skillMd, { name: `.claude/skills/${skillSlug}/SKILL.md` });
      }

      for (const cmd of agentCommands) {
        let cmdMd = "---\n";
        cmdMd += `description: ${cmd.description}\n`;
        cmdMd += "---\n\n";
        cmdMd += cmd.promptTemplate;
        archive.append(cmdMd, { name: `.claude/commands/${cmd.name}.md` });
      }
    }

    await archive.finalize();
  });

  return httpServer;
}
