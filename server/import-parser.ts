import matter from "gray-matter";
import { storage } from "./storage";
import type { InsertAgent, InsertSkill, InsertCommand, InsertRule } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";
import { createRequire } from "module";

// Use dynamic import approach for unzipper compatibility
let unzipBuffer: (buf: Buffer) => Promise<{ files: Record<string, { buffer: () => Promise<Buffer> }> }>;

interface ParsedFile {
  path: string;
  content: string;
}

interface ImportResult {
  project: { id: string; name: string };
  agents: { name: string; id: string }[];
  skills: { name: string; agentName: string }[];
  commands: { name: string; agentName: string }[];
  rules: { name: string }[];
  settings: boolean;
  hooks: number;
  warnings: string[];
}

export async function parseZipBuffer(buffer: Buffer): Promise<ParsedFile[]> {
  const AdmZip = (await import("adm-zip")).default;
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  const files: ParsedFile[] = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const content = entry.getData().toString("utf-8");
    files.push({ path: entry.entryName, content });
  }

  return files;
}

function findClaudeDir(files: ParsedFile[]): string {
  // Look for .claude/ at root or nested
  for (const f of files) {
    if (f.path.includes(".claude/")) {
      const idx = f.path.indexOf(".claude/");
      return f.path.substring(0, idx);
    }
  }
  return "";
}

function getRelativePath(filePath: string, prefix: string): string {
  return filePath.substring(prefix.length);
}

function parseToolsList(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

export async function importFiles(
  files: ParsedFile[],
  projectName: string
): Promise<ImportResult> {
  const warnings: string[] = [];
  const prefix = findClaudeDir(files);

  // Create project
  const project = await storage.createProject({
    name: projectName,
    description: "",
    claudeMdContent: "",
  });

  // Parse CLAUDE.md
  const claudeMdFile = files.find(
    (f) => getRelativePath(f.path, prefix) === ".claude/CLAUDE.md"
      || getRelativePath(f.path, prefix) === "CLAUDE.md"
  );
  if (claudeMdFile) {
    await storage.updateProject(project.id, { claudeMdContent: claudeMdFile.content });
  }

  // Parse agents
  const agentFiles = files.filter((f) => {
    const rel = getRelativePath(f.path, prefix);
    return rel.startsWith(".claude/agents/") && rel.endsWith(".md") && !rel.endsWith(".gitkeep");
  });

  const agentMap = new Map<string, { id: string; name: string }>();
  const createdAgents: { name: string; id: string }[] = [];

  for (const file of agentFiles) {
    try {
      const { data: fm, content } = matter(file.content);
      const slug = path.basename(file.path, ".md");
      const name = (fm.name as string) || slug;

      const agentData: InsertAgent = {
        name,
        description: (fm.description as string) || "",
        systemPrompt: content.trim(),
        model: (fm.model as string) || "sonnet",
        tools: parseToolsList(fm.tools),
        disallowedTools: parseToolsList(fm.disallowedTools),
        memoryScope: (fm.memory as string) || "project",
        permissionMode: (fm.permissionMode as string) || "default",
        maxTurns: fm.maxTurns != null ? Number(fm.maxTurns) : null,
        preloadedSkills: Array.isArray(fm.skills) ? fm.skills.map(String) : [],
        icon: "bot",
        color: "#3b82f6",
      };

      const agent = await storage.createAgent(agentData);
      await storage.addProjectAgent({ projectId: project.id, agentId: agent.id });
      agentMap.set(slug, { id: agent.id, name: agent.name });
      createdAgents.push({ name: agent.name, id: agent.id });
    } catch (e) {
      warnings.push(`Failed to parse agent: ${file.path} — ${(e as Error).message}`);
    }
  }

  // Parse skills
  const skillFiles = files.filter((f) => {
    const rel = getRelativePath(f.path, prefix);
    return rel.startsWith(".claude/skills/") && rel.endsWith("SKILL.md");
  });

  const createdSkills: { name: string; agentName: string }[] = [];

  for (const file of skillFiles) {
    try {
      const { data: fm, content } = matter(file.content);
      const skillSlug = (fm.name as string) || path.basename(path.dirname(file.path));

      // Determine agent association: check which agent has this skill preloaded
      let agentId: string | undefined;
      let agentName = "Unassigned";

      for (const [slug, agent] of Array.from(agentMap.entries())) {
        // Check if any agent has this skill in preloadedSkills
        const a = await storage.getAgent(agent.id);
        if (a && a.preloadedSkills.includes(skillSlug)) {
          agentId = agent.id;
          agentName = agent.name;
          break;
        }
      }

      // Default: assign to first agent
      if (!agentId && agentMap.size > 0) {
        const first = agentMap.values().next().value!;
        agentId = first.id;
        agentName = first.name;
        warnings.push(`Skill "${skillSlug}" auto-assigned to agent "${agentName}"`);
      }

      if (!agentId) {
        warnings.push(`Skill "${skillSlug}" skipped — no agents to assign to`);
        continue;
      }

      const skillData: InsertSkill = {
        agentId,
        name: skillSlug,
        description: (fm.description as string) || "",
        instructions: content.trim(),
        context: (fm.context as string) || "main",
        allowedTools: parseToolsList(fm["allowed-tools"]),
        argumentHint: (fm["argument-hint"] as string) || "",
        disableModelInvocation: fm["disable-model-invocation"] === true ? "true" : "false",
        userInvocable: fm["user-invocable"] === false ? "false" : "true",
        model: (fm.model as string) || "",
        agentType: (fm.agent as string) || "general-purpose",
      };

      await storage.createSkill(skillData);
      createdSkills.push({ name: skillSlug, agentName });
    } catch (e) {
      warnings.push(`Failed to parse skill: ${file.path} — ${(e as Error).message}`);
    }
  }

  // Parse commands
  const commandFiles = files.filter((f) => {
    const rel = getRelativePath(f.path, prefix);
    return rel.startsWith(".claude/commands/") && rel.endsWith(".md") && !rel.endsWith(".gitkeep");
  });

  const createdCommands: { name: string; agentName: string }[] = [];

  for (const file of commandFiles) {
    try {
      const { data: fm, content } = matter(file.content);
      const cmdName = path.basename(file.path, ".md");

      // Assign to first agent
      let agentId: string | undefined;
      let agentName = "Unassigned";

      if (agentMap.size > 0) {
        const first = agentMap.values().next().value!;
        agentId = first.id;
        agentName = first.name;
      }

      if (!agentId) {
        warnings.push(`Command "${cmdName}" skipped — no agents to assign to`);
        continue;
      }

      const cmdData: InsertCommand = {
        agentId,
        name: cmdName,
        description: (fm.description as string) || "",
        promptTemplate: content.trim(),
        argumentHint: (fm["argument-hint"] as string) || "",
        disableModelInvocation: fm["disable-model-invocation"] === true ? "true" : "false",
        userInvocable: fm["user-invocable"] === false ? "false" : "true",
        model: (fm.model as string) || "",
        context: (fm.context as string) || "",
        agentType: (fm.agent as string) || "",
        allowedTools: parseToolsList(fm["allowed-tools"]),
      };

      await storage.createCommand(cmdData);
      createdCommands.push({ name: cmdName, agentName });
    } catch (e) {
      warnings.push(`Failed to parse command: ${file.path} — ${(e as Error).message}`);
    }
  }

  // Parse rules
  const ruleFiles = files.filter((f) => {
    const rel = getRelativePath(f.path, prefix);
    return rel.startsWith(".claude/rules/") && rel.endsWith(".md") && !rel.endsWith(".gitkeep");
  });

  const createdRules: { name: string }[] = [];
  let ruleOrder = 0;

  for (const file of ruleFiles) {
    try {
      const { data: fm, content } = matter(file.content);
      const ruleName = path.basename(file.path, ".md")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const paths: string[] = Array.isArray(fm.paths)
        ? fm.paths.map(String)
        : [];

      await storage.createRule({
        projectId: project.id,
        name: ruleName,
        paths,
        content: content.trim(),
        sortOrder: ruleOrder++,
      });

      createdRules.push({ name: ruleName });
    } catch (e) {
      warnings.push(`Failed to parse rule: ${file.path} — ${(e as Error).message}`);
    }
  }

  // Parse settings.json
  let settingsImported = false;
  let hooksImported = 0;

  const settingsFile = files.find((f) => {
    const rel = getRelativePath(f.path, prefix);
    return rel === ".claude/settings.json";
  });

  if (settingsFile) {
    try {
      const json = JSON.parse(settingsFile.content);

      const settingsData: Record<string, unknown> = {};
      if (json.permissions) {
        if (json.permissions.allow) settingsData.permissionAllow = json.permissions.allow;
        if (json.permissions.deny) settingsData.permissionDeny = json.permissions.deny;
        if (json.permissions.ask) settingsData.permissionAsk = json.permissions.ask;
      }
      if (json.defaultPermissionMode) settingsData.defaultPermissionMode = json.defaultPermissionMode;
      if (json.sandbox) {
        if (json.sandbox.enabled != null) settingsData.sandboxEnabled = String(json.sandbox.enabled);
        if (json.sandbox.autoAllow != null) settingsData.sandboxAutoAllow = String(json.sandbox.autoAllow);
        if (json.sandbox.allowedDomains) settingsData.sandboxAllowedDomains = json.sandbox.allowedDomains;
        if (json.sandbox.allowLocalBinding != null) settingsData.sandboxAllowLocalBinding = String(json.sandbox.allowLocalBinding);
        if (json.sandbox.excludedCommands) settingsData.sandboxExcludedCommands = json.sandbox.excludedCommands;
      }
      if (json.defaultModel) settingsData.defaultModel = json.defaultModel;

      if (Object.keys(settingsData).length > 0) {
        await storage.upsertProjectSettings(project.id, settingsData);
        settingsImported = true;
      }

      // Parse hooks from settings
      if (json.hooks && typeof json.hooks === "object") {
        let hookOrder = 0;
        for (const [event, matcherGroups] of Object.entries(json.hooks as Record<string, unknown[]>)) {
          if (!Array.isArray(matcherGroups)) continue;
          for (const group of matcherGroups) {
            const g = group as { matcher?: string; hooks?: Array<Record<string, unknown>> };
            const matcher = g.matcher || "";
            const hookList = g.hooks || [];
            for (const h of hookList) {
              await storage.createHook({
                projectId: project.id,
                event,
                matcher,
                handlerType: (h.type as string) || "command",
                command: (h.command as string) || "",
                prompt: (h.prompt as string) || "",
                timeout: h.timeout != null ? Number(h.timeout) : null,
                statusMessage: (h.statusMessage as string) || "",
                isAsync: h.async === true ? "true" : "false",
                once: h.once === true ? "true" : "false",
                sortOrder: hookOrder++,
              });
              hooksImported++;
            }
          }
        }
      }
    } catch (e) {
      warnings.push(`Failed to parse settings.json — ${(e as Error).message}`);
    }
  }

  return {
    project: { id: project.id, name: project.name },
    agents: createdAgents,
    skills: createdSkills,
    commands: createdCommands,
    rules: createdRules,
    settings: settingsImported,
    hooks: hooksImported,
    warnings,
  };
}

export async function parseMarkdownContent(
  content: string,
  fileType: "agent" | "skill" | "command" | "rule",
  projectId: string,
  agentId?: string,
): Promise<{ success: boolean; name: string; warnings: string[] }> {
  const warnings: string[] = [];
  const { data: fm, content: body } = matter(content);

  try {
    switch (fileType) {
      case "agent": {
        const name = (fm.name as string) || "Imported Agent";
        const agent = await storage.createAgent({
          name,
          description: (fm.description as string) || "",
          systemPrompt: body.trim(),
          model: (fm.model as string) || "sonnet",
          tools: parseToolsList(fm.tools),
          disallowedTools: parseToolsList(fm.disallowedTools),
          memoryScope: (fm.memory as string) || "project",
          permissionMode: (fm.permissionMode as string) || "default",
          maxTurns: fm.maxTurns != null ? Number(fm.maxTurns) : null,
          preloadedSkills: Array.isArray(fm.skills) ? fm.skills.map(String) : [],
          icon: "bot",
          color: "#3b82f6",
        });
        await storage.addProjectAgent({ projectId, agentId: agent.id });
        return { success: true, name, warnings };
      }
      case "skill": {
        if (!agentId) {
          return { success: false, name: "", warnings: ["Agent ID required for skill import"] };
        }
        const name = (fm.name as string) || "imported-skill";
        await storage.createSkill({
          agentId,
          name,
          description: (fm.description as string) || "",
          instructions: body.trim(),
          context: (fm.context as string) || "main",
          allowedTools: parseToolsList(fm["allowed-tools"]),
          argumentHint: (fm["argument-hint"] as string) || "",
          disableModelInvocation: fm["disable-model-invocation"] === true ? "true" : "false",
          userInvocable: fm["user-invocable"] === false ? "false" : "true",
          model: (fm.model as string) || "",
          agentType: (fm.agent as string) || "general-purpose",
        });
        return { success: true, name, warnings };
      }
      case "command": {
        if (!agentId) {
          return { success: false, name: "", warnings: ["Agent ID required for command import"] };
        }
        const name = (fm.name as string) || "imported-command";
        await storage.createCommand({
          agentId,
          name,
          description: (fm.description as string) || "",
          promptTemplate: body.trim(),
          argumentHint: (fm["argument-hint"] as string) || "",
          disableModelInvocation: fm["disable-model-invocation"] === true ? "true" : "false",
          userInvocable: fm["user-invocable"] === false ? "false" : "true",
          model: (fm.model as string) || "",
          context: (fm.context as string) || "",
          agentType: (fm.agent as string) || "",
          allowedTools: parseToolsList(fm["allowed-tools"]),
        });
        return { success: true, name, warnings };
      }
      case "rule": {
        const name = (fm.name as string) || "Imported Rule";
        const paths: string[] = Array.isArray(fm.paths) ? fm.paths.map(String) : [];
        await storage.createRule({
          projectId,
          name,
          paths,
          content: body.trim(),
          sortOrder: 0,
        });
        return { success: true, name, warnings };
      }
    }
  } catch (e) {
    return { success: false, name: "", warnings: [(e as Error).message] };
  }
}
