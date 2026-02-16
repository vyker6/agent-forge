import type { Agent, Skill, Command, Project, Rule, ProjectSettings, Hook, McpServer, FileMapEntry } from "@shared/schema";

export function generateAgentMarkdown(
  agent: Agent | { name: string; description: string; tools: string[]; disallowedTools: string[]; model: string; memoryScope: string; permissionMode: string; maxTurns: number | null; preloadedSkills: string[]; mcpServers: string[]; systemPrompt: string },
  skills: Skill[] = [],
  commands: Command[] = []
): Record<string, string> {
  const slug = agent.name.toLowerCase().replace(/\s+/g, "-");
  const files: Record<string, string> = {};

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
  files[`.claude/agents/${slug}.md`] = agentMd;

  for (const skill of skills) {
    files[`.claude/skills/${skill.name.toLowerCase().replace(/\s+/g, "-")}/SKILL.md`] = generateSkillMarkdown(skill);
  }

  for (const cmd of commands) {
    files[`.claude/commands/${cmd.name}.md`] = generateCommandMarkdown(cmd);
  }

  return files;
}

export function generateSkillMarkdown(skill: Skill): string {
  const skillSlug = skill.name.toLowerCase().replace(/\s+/g, "-");
  let md = "---\n";
  md += `name: ${skillSlug}\n`;
  md += `description: ${skill.description}\n`;
  if (skill.context !== "main") {
    md += `context: ${skill.context}\n`;
  }
  if (skill.context === "fork" && skill.agentType !== "general-purpose") {
    md += `agent: ${skill.agentType}\n`;
  }
  if (skill.allowedTools.length > 0) {
    md += `allowed-tools: ${skill.allowedTools.join(", ")}\n`;
  }
  if (skill.argumentHint) {
    md += `argument-hint: "${skill.argumentHint}"\n`;
  }
  if (skill.disableModelInvocation === "true") {
    md += `disable-model-invocation: true\n`;
  }
  if (skill.userInvocable === "false") {
    md += `user-invocable: false\n`;
  }
  if (skill.model) {
    md += `model: ${skill.model}\n`;
  }
  md += "---\n\n";
  md += skill.instructions;
  return md;
}

export function generateCommandMarkdown(cmd: Command): string {
  let md = "---\n";
  md += `description: ${cmd.description}\n`;
  if (cmd.argumentHint) {
    md += `argument-hint: "${cmd.argumentHint}"\n`;
  }
  if (cmd.disableModelInvocation === "true") {
    md += `disable-model-invocation: true\n`;
  }
  if (cmd.userInvocable === "false") {
    md += `user-invocable: false\n`;
  }
  if (cmd.model) {
    md += `model: ${cmd.model}\n`;
  }
  if (cmd.context) {
    md += `context: ${cmd.context}\n`;
  }
  if (cmd.context === "fork" && cmd.agentType) {
    md += `agent: ${cmd.agentType}\n`;
  }
  if (cmd.allowedTools.length > 0) {
    md += `allowed-tools: ${cmd.allowedTools.join(", ")}\n`;
  }
  md += "---\n\n";
  md += cmd.promptTemplate;
  return md;
}

export function generateClaudeMd(
  project: Project,
  agentList: Array<{ agent: Agent; fileMap: FileMapEntry[] }>
): string {
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
  return claudeMd;
}

export function generateRuleMarkdown(rule: Rule): string {
  let md = "";
  if (rule.paths.length > 0) {
    md += "---\npaths:\n";
    for (const p of rule.paths) {
      md += `  - "${p}"\n`;
    }
    md += "---\n\n";
  }
  md += rule.content;
  return md;
}

export function generateSettingsJson(settings: ProjectSettings | null, hooks: Hook[]): string {
  const settingsJson: Record<string, unknown> = {};
  if (settings) {
    if (settings.permissionAllow.length > 0 || settings.permissionDeny.length > 0 || settings.permissionAsk.length > 0) {
      const perms: Record<string, string[]> = {};
      if (settings.permissionAllow.length > 0) perms.allow = settings.permissionAllow;
      if (settings.permissionDeny.length > 0) perms.deny = settings.permissionDeny;
      if (settings.permissionAsk.length > 0) perms.ask = settings.permissionAsk;
      settingsJson.permissions = perms;
    }
    if (settings.defaultPermissionMode) {
      settingsJson.defaultPermissionMode = settings.defaultPermissionMode;
    }
    const sandbox: Record<string, unknown> = {};
    if (settings.sandboxEnabled) sandbox.enabled = settings.sandboxEnabled === "true";
    if (settings.sandboxAutoAllow) sandbox.autoAllow = settings.sandboxAutoAllow === "true";
    if (settings.sandboxAllowedDomains.length > 0) sandbox.allowedDomains = settings.sandboxAllowedDomains;
    if (settings.sandboxAllowLocalBinding) sandbox.allowLocalBinding = settings.sandboxAllowLocalBinding === "true";
    if (settings.sandboxExcludedCommands.length > 0) sandbox.excludedCommands = settings.sandboxExcludedCommands;
    if (Object.keys(sandbox).length > 0) {
      settingsJson.sandbox = sandbox;
    }
    if (settings.defaultModel) {
      settingsJson.defaultModel = settings.defaultModel;
    }
  }

  if (hooks.length > 0) {
    const hooksMap: Record<string, Array<{ matcher: string; hooks: Array<Record<string, unknown>> }>> = {};
    for (const hook of hooks) {
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

  if (Object.keys(settingsJson).length === 0) return "";
  return JSON.stringify(settingsJson, null, 2);
}

export function generateMcpJson(mcpServers: McpServer[]): string {
  if (mcpServers.length === 0) return "";
  const mcpJson: Record<string, { command: string; args: string[]; env: Record<string, string>; cwd?: string }> = {};
  for (const s of mcpServers) {
    mcpJson[s.name] = {
      command: s.command,
      args: s.args,
      env: (s.env as Record<string, string>) || {},
    };
    if (s.cwd) mcpJson[s.name].cwd = s.cwd;
  }
  return JSON.stringify({ mcpServers: mcpJson }, null, 2);
}

/** Build the complete file map for a project export */
export function buildExportFiles(
  project: Project,
  agentList: Array<{ agent: Agent; skills: Skill[]; commands: Command[]; fileMap: FileMapEntry[] }>,
  rules: Rule[],
  settings: ProjectSettings | null,
  hooks: Hook[],
  mcpServers: McpServer[]
): Record<string, string> {
  const files: Record<string, string> = {};

  files[".claude/CLAUDE.md"] = generateClaudeMd(project, agentList);

  for (const rule of rules) {
    const slug = rule.name.toLowerCase().replace(/\s+/g, "-");
    files[`.claude/rules/${slug}.md`] = generateRuleMarkdown(rule);
  }

  const settingsContent = generateSettingsJson(settings, hooks);
  if (settingsContent) {
    files[".claude/settings.json"] = settingsContent;
  }

  for (const { agent, skills, commands } of agentList) {
    const agentFiles = generateAgentMarkdown(agent, skills, commands);
    Object.assign(files, agentFiles);
  }

  const mcpContent = generateMcpJson(mcpServers);
  if (mcpContent) {
    files[".mcp.json"] = mcpContent;
  }

  return files;
}
