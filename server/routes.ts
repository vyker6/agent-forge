import type { Express } from "express";
import { createServer, type Server } from "http";
import archiver from "archiver";
import multer from "multer";
import { storage } from "./storage";
import { parseZipBuffer, importFiles, parseMarkdownContent } from "./import-parser";
import {
  insertAgentSchema, insertSkillSchema, insertCommandSchema,
  insertFileMapEntrySchema, insertProjectSchema, insertProjectAgentSchema,
  insertRuleSchema, insertProjectSettingsSchema, insertHookSchema, insertMcpServerSchema
} from "@shared/schema";
import { isAiAvailable, generateAgentConfig } from "./ai-generate";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

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

  // Import ZIP — must be before /:id routes
  app.post("/api/projects/import", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      const projectName = (req.body.projectName as string) || "Imported Project";
      const files = await parseZipBuffer(req.file.buffer);
      const result = await importFiles(files, projectName);
      res.status(201).json(result);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // Import markdown paste
  app.post("/api/projects/import/markdown", async (req, res) => {
    try {
      const { content, fileType, projectId, agentId } = req.body;
      if (!content || !fileType || !projectId) {
        return res.status(400).json({ error: "content, fileType, and projectId are required" });
      }
      const result = await parseMarkdownContent(content, fileType, projectId, agentId);
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
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

  app.patch("/api/projects/:id", async (req, res) => {
    const parsed = insertProjectSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const project = await storage.updateProject(req.params.id, parsed.data);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  });

  // Rules
  app.get("/api/projects/:id/rules", async (req, res) => {
    const items = await storage.getRules(req.params.id);
    res.json(items);
  });

  app.post("/api/projects/:id/rules", async (req, res) => {
    const data = { ...req.body, projectId: req.params.id };
    const parsed = insertRuleSchema.safeParse(data);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const rule = await storage.createRule(parsed.data);
    res.status(201).json(rule);
  });

  app.patch("/api/rules/:id", async (req, res) => {
    const parsed = insertRuleSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const rule = await storage.updateRule(req.params.id, parsed.data);
    if (!rule) return res.status(404).json({ error: "Rule not found" });
    res.json(rule);
  });

  app.delete("/api/rules/:id", async (req, res) => {
    await storage.deleteRule(req.params.id);
    res.status(204).end();
  });

  // Project Settings
  app.get("/api/projects/:id/settings", async (req, res) => {
    const settings = await storage.getProjectSettings(req.params.id);
    res.json(settings || null);
  });

  app.put("/api/projects/:id/settings", async (req, res) => {
    const parsed = insertProjectSettingsSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const settings = await storage.upsertProjectSettings(req.params.id, parsed.data);
    res.json(settings);
  });

  // Hooks
  app.get("/api/projects/:id/hooks", async (req, res) => {
    const items = await storage.getHooks(req.params.id);
    res.json(items);
  });

  app.post("/api/projects/:id/hooks", async (req, res) => {
    const data = { ...req.body, projectId: req.params.id };
    const parsed = insertHookSchema.safeParse(data);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const hook = await storage.createHook(parsed.data);
    res.status(201).json(hook);
  });

  app.patch("/api/hooks/:id", async (req, res) => {
    const parsed = insertHookSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const hook = await storage.updateHook(req.params.id, parsed.data);
    if (!hook) return res.status(404).json({ error: "Hook not found" });
    res.json(hook);
  });

  app.delete("/api/hooks/:id", async (req, res) => {
    await storage.deleteHook(req.params.id);
    res.status(204).end();
  });

  // MCP Servers
  app.get("/api/projects/:id/mcp-servers", async (req, res) => {
    const items = await storage.getMcpServers(req.params.id);
    res.json(items);
  });

  app.post("/api/projects/:id/mcp-servers", async (req, res) => {
    const data = { ...req.body, projectId: req.params.id };
    const parsed = insertMcpServerSchema.safeParse(data);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const server = await storage.createMcpServer(parsed.data);
    res.status(201).json(server);
  });

  app.patch("/api/mcp-servers/:id", async (req, res) => {
    const parsed = insertMcpServerSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
    const server = await storage.updateMcpServer(req.params.id, parsed.data);
    if (!server) return res.status(404).json({ error: "MCP server not found" });
    res.json(server);
  });

  app.delete("/api/mcp-servers/:id", async (req, res) => {
    await storage.deleteMcpServer(req.params.id);
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

    const projectRules = await storage.getRules(project.id);
    const projectSettings = await storage.getProjectSettings(project.id);
    const projectHooks = await storage.getHooks(project.id);
    const mcpServerList = await storage.getMcpServers(project.id);

    // JSON format for plugin export
    if (req.query.format === "json") {
      const jsonExport = {
        name: project.name,
        description: project.description,
        version: project.pluginVersion || "1.0.0",
        author: project.pluginAuthorName ? {
          name: project.pluginAuthorName,
          email: project.pluginAuthorEmail || undefined,
        } : undefined,
        homepage: project.pluginHomepage || undefined,
        repository: project.pluginRepository || undefined,
        license: project.pluginLicense || "MIT",
        keywords: project.pluginKeywords.length > 0 ? project.pluginKeywords : undefined,
        claudeMd: project.claudeMdContent || undefined,
        agents: agentList.map(({ agent, skills: s, commands: c }) => ({
          name: agent.name,
          description: agent.description,
          model: agent.model,
          tools: agent.tools,
          systemPrompt: agent.systemPrompt,
          skills: s.map((sk) => ({ name: sk.name, description: sk.description })),
          commands: c.map((cm) => ({ name: cm.name, description: cm.description })),
        })),
        rules: projectRules.map((r) => ({ name: r.name, paths: r.paths, content: r.content })),
        settings: projectSettings ? {
          permissions: {
            allow: projectSettings.permissionAllow,
            deny: projectSettings.permissionDeny,
            ask: projectSettings.permissionAsk,
          },
          defaultModel: projectSettings.defaultModel || undefined,
        } : undefined,
        hooks: projectHooks.length > 0 ? projectHooks.map((h) => ({
          event: h.event,
          matcher: h.matcher,
          handlerType: h.handlerType,
          command: h.command || undefined,
          prompt: h.prompt || undefined,
        })) : undefined,
        mcpServers: mcpServerList.length > 0 ? mcpServerList.map((s) => ({
          name: s.name,
          command: s.command,
          args: s.args,
          env: s.env,
          cwd: s.cwd || undefined,
        })) : undefined,
      };
      return res.json(jsonExport);
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
    archive.append("", { name: ".claude/rules/.gitkeep" });

    // Export rules as .claude/rules/{name}.md
    for (const rule of projectRules) {
      const slug = rule.name.toLowerCase().replace(/\s+/g, "-");
      let ruleMd = "";
      if (rule.paths.length > 0) {
        ruleMd += "---\npaths:\n";
        for (const p of rule.paths) {
          ruleMd += `  - "${p}"\n`;
        }
        ruleMd += "---\n\n";
      }
      ruleMd += rule.content;
      archive.append(ruleMd, { name: `.claude/rules/${slug}.md` });
    }

    // Export settings.json with settings + hooks
    const settingsJson: Record<string, unknown> = {};
    if (projectSettings) {
      if (projectSettings.permissionAllow.length > 0 || projectSettings.permissionDeny.length > 0 || projectSettings.permissionAsk.length > 0) {
        const perms: Record<string, string[]> = {};
        if (projectSettings.permissionAllow.length > 0) perms.allow = projectSettings.permissionAllow;
        if (projectSettings.permissionDeny.length > 0) perms.deny = projectSettings.permissionDeny;
        if (projectSettings.permissionAsk.length > 0) perms.ask = projectSettings.permissionAsk;
        settingsJson.permissions = perms;
      }
      if (projectSettings.defaultPermissionMode) {
        settingsJson.defaultPermissionMode = projectSettings.defaultPermissionMode;
      }
      const sandbox: Record<string, unknown> = {};
      if (projectSettings.sandboxEnabled) sandbox.enabled = projectSettings.sandboxEnabled === "true";
      if (projectSettings.sandboxAutoAllow) sandbox.autoAllow = projectSettings.sandboxAutoAllow === "true";
      if (projectSettings.sandboxAllowedDomains.length > 0) sandbox.allowedDomains = projectSettings.sandboxAllowedDomains;
      if (projectSettings.sandboxAllowLocalBinding) sandbox.allowLocalBinding = projectSettings.sandboxAllowLocalBinding === "true";
      if (projectSettings.sandboxExcludedCommands.length > 0) sandbox.excludedCommands = projectSettings.sandboxExcludedCommands;
      if (Object.keys(sandbox).length > 0) {
        settingsJson.sandbox = sandbox;
      }
      if (projectSettings.defaultModel) {
        settingsJson.defaultModel = projectSettings.defaultModel;
      }
    }

    // Group hooks by event, then by matcher
    if (projectHooks.length > 0) {
      const hooksMap: Record<string, Array<{ matcher: string; hooks: Array<Record<string, unknown>> }>> = {};
      for (const hook of projectHooks) {
        if (!hooksMap[hook.event]) hooksMap[hook.event] = [];
        const entry: Record<string, unknown> = { type: hook.handlerType };
        if (hook.handlerType === "command" && hook.command) entry.command = hook.command;
        if (hook.handlerType === "prompt" && hook.prompt) entry.prompt = hook.prompt;
        if (hook.timeout != null) entry.timeout = hook.timeout;
        if (hook.statusMessage) entry.statusMessage = hook.statusMessage;
        if (hook.isAsync === "true") entry.async = true;
        if (hook.once === "true") entry.once = true;

        const existing = hooksMap[hook.event].find((g) => g.matcher === hook.matcher);
        if (existing) {
          existing.hooks.push(entry);
        } else {
          hooksMap[hook.event].push({ matcher: hook.matcher, hooks: [entry] });
        }
      }
      settingsJson.hooks = hooksMap;
    }

    if (Object.keys(settingsJson).length > 0) {
      archive.append(JSON.stringify(settingsJson, null, 2), { name: ".claude/settings.json" });
    }

    for (const { agent, skills: agentSkills, commands: agentCommands } of agentList) {
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
        for (const s of agent.preloadedSkills) {
          agentMd += `  - ${s}\n`;
        }
      }
      if (agent.mcpServers.length > 0) {
        agentMd += `mcpServers:\n`;
        for (const s of agent.mcpServers) {
          agentMd += `  - ${s}\n`;
        }
      }
      agentMd += "---\n\n";
      agentMd += agent.systemPrompt;
      archive.append(agentMd, { name: `.claude/agents/${slug}.md` });

      for (const skill of agentSkills) {
        const skillSlug = skill.name.toLowerCase().replace(/\s+/g, "-");
        let skillMd = "---\n";
        skillMd += `name: ${skillSlug}\n`;
        skillMd += `description: ${skill.description}\n`;
        if (skill.context !== "main") {
          skillMd += `context: ${skill.context}\n`;
        }
        if (skill.context === "fork" && skill.agentType !== "general-purpose") {
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
    }

    // Export .mcp.json at root level
    if (mcpServerList.length > 0) {
      const mcpJson: Record<string, { command: string; args: string[]; env: Record<string, string>; cwd?: string }> = {};
      for (const s of mcpServerList) {
        mcpJson[s.name] = {
          command: s.command,
          args: s.args,
          env: (s.env as Record<string, string>) || {},
        };
        if (s.cwd) mcpJson[s.name].cwd = s.cwd;
      }
      archive.append(JSON.stringify({ mcpServers: mcpJson }, null, 2), { name: ".mcp.json" });
    }

    await archive.finalize();
  });

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
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      const message = err instanceof Error ? err.message : "Generation failed";
      if (status === 401 || status === 403 || message.includes("authentication_error") || message.startsWith("401")) {
        return res.status(502).json({
          error: "API key is invalid or expired — check your ANTHROPIC_API_KEY secret",
        });
      }
      res.status(422).json({ error: message });
    }
  });

  return httpServer;
}
