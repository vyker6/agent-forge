export const fieldHelp: Record<string, string> = {
  // Agent fields
  agentName: "A short, descriptive name for your agent. Used as the filename slug (e.g., 'Code Reviewer' becomes code-reviewer.md).",
  agentDescription: "A brief summary of what this agent does. Shown in the agent list and used as metadata in the exported markdown.",
  systemPrompt: "The core instructions that define this agent's behavior. This becomes the markdown body of the agent file and is loaded into the agent's context.",
  model: "Which Claude model this agent uses. 'Inherit' uses the project default. Opus is most capable, Haiku is fastest.",
  memoryScope: "Where the agent stores its memory. 'User' persists globally, 'Project' persists per-project, 'Local' is session-only.",
  tools: "The tools this agent is allowed to use. Select only the tools needed for the agent's purpose to follow the principle of least privilege.",
  disallowedTools: "Tools this agent is explicitly denied from using, even if they would otherwise be available.",
  permissionMode: "Controls how the agent handles permission prompts. 'Default' asks for each action, 'Don't Ask' auto-approves, 'Plan' enters planning mode.",
  maxTurns: "Maximum number of agentic turns (API round-trips) before the agent stops. Leave blank for unlimited turns.",

  // Skill fields
  skillName: "A unique name for this skill, used as the directory name. Use lowercase with hyphens (e.g., 'pdf-processing').",
  skillDescription: "When and why this skill should be used. Helps Claude decide when to invoke it automatically.",
  skillInstructions: "The full instructions for this skill, written in markdown. This becomes the SKILL.md content.",
  skillContext: "Where the skill runs. 'Main' runs in the current context, 'Fork' runs in a separate agent context.",
  skillAllowedTools: "The tools this skill is allowed to use when invoked.",
  skillArgumentHint: "A hint shown to users about what arguments this skill accepts (e.g., '[file-path]').",
  skillModel: "Override the model for this skill. Leave as 'Inherit' to use the agent's model.",
  skillAgentType: "When context is 'Fork', which type of agent to use for the forked context.",

  // Command fields
  commandName: "The slash command name (without the /). Use lowercase with hyphens (e.g., 'review-code').",
  commandDescription: "A brief description shown in the slash command menu.",
  commandPromptTemplate: "The prompt template sent to the agent when this command is invoked. Can include $ARGUMENTS for user input.",
  commandArgumentHint: "A hint shown to users about what arguments this command accepts (e.g., '[PR-number]').",
  commandContext: "Where the command runs. 'Main' runs inline, 'Fork' runs in a separate context.",
  commandAllowedTools: "The tools this command is allowed to use when invoked.",
  commandModel: "Override the model for this command. Leave as 'Inherit' to use the agent's model.",
};
