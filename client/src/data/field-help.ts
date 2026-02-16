export const fieldHelp: Record<string, string> = {
  // Agent fields
  agentName: "Give your agent a short, clear name like 'Code Reviewer' or 'Test Writer'. This becomes the filename when exported.",
  agentDescription: "A one-line summary of what this agent does. Shown in the agent list.",
  systemPrompt: "Tell this agent who it is and how it should behave. This is the most important field — it shapes everything the agent does.",
  model: "Which version of Claude to use. Sonnet is a good default — fast and capable. Opus is slower but better at complex reasoning. Haiku is fastest for simple tasks.",
  memoryScope: "How long this agent remembers things. 'Project' = remembers within this project. 'User' = remembers across all projects. 'Local' = forgets after each session.",
  tools: "What this agent can do. 'Read' lets it look at files, 'Write' lets it create files, 'Bash' lets it run terminal commands. Only enable what it needs.",
  disallowedTools: "Capabilities this agent is never allowed to use, even if otherwise available. Use this for safety guardrails.",
  permissionMode: "What happens when this agent wants to do something requiring approval. 'Default' asks every time. 'Accept Edits' auto-approves file changes. 'Don't Ask' auto-approves everything.",
  maxTurns: "Maximum back-and-forth steps before the agent stops. Leave blank for no limit.",

  // Skill fields
  skillName: "A short name for this skill using lowercase and hyphens (e.g., 'security-scan'). Used as the folder name.",
  skillDescription: "Describe when and why this skill should be used. Helps the agent decide when to activate it automatically.",
  skillInstructions: "The full instructions for this skill, written in markdown. This is what the agent reads when the skill is activated.",
  skillContext: "Where this skill runs. 'Same conversation' keeps the current context. 'Separate conversation' starts fresh — useful for isolated tasks.",
  skillAllowedTools: "Which capabilities this skill can use when running.",
  skillArgumentHint: "A hint shown to users about what input this skill expects (e.g., '[file-path]').",
  skillModel: "Override the AI model for this skill. Leave as 'Inherit' to use the agent's model.",
  skillAgentType: "When running in a separate conversation, which type of worker to use.",

  // Command fields
  commandName: "The shortcut name without the / (e.g., 'review-code'). Users type /review-code to trigger it.",
  commandDescription: "A brief description shown in the slash command menu.",
  commandPromptTemplate: "What to do when this command is triggered. Use $ARGUMENTS for any input the user provides.",
  commandArgumentHint: "A hint about what input this command expects (e.g., '[PR-number]').",
  commandContext: "Where the command runs. 'Same conversation' runs inline. 'Separate conversation' runs in isolation.",
  commandAllowedTools: "Which capabilities this command can use when running.",
  commandModel: "Override the AI model for this command. Leave as 'Inherit' to use the agent's model.",
};
