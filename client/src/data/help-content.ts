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
