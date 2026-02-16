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
