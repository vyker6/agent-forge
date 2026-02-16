import Anthropic from "@anthropic-ai/sdk";
import { AGENT_GENERATION_SYSTEM_PROMPT } from "./ai-prompts";
import { insertAgentSchema } from "@shared/schema";

let client: Anthropic | null = null;
let keyValid = false;

function createClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

async function validateKey(): Promise<boolean> {
  client = createClient();
  if (!client) return false;
  try {
    await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1,
      messages: [{ role: "user", content: "hi" }],
    });
    return true;
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    const message = err instanceof Error ? err.message : "";
    if (status === 401 || status === 403 || message.includes("authentication_error")) {
      console.warn(`[ai] API key validation failed — AI features disabled. Check your ANTHROPIC_API_KEY secret.`);
      return false;
    }
    return true;
  }
}

export async function initAi(): Promise<void> {
  client = createClient();
  if (!client) {
    console.log("[ai] No ANTHROPIC_API_KEY set — AI features disabled");
    return;
  }
  keyValid = await validateKey();
  console.log(`[ai] Key validation: ${keyValid ? "valid" : "invalid"}`);
}

export function isAiAvailable(): boolean {
  return client !== null && keyValid;
}

interface GenerateResult {
  agent: {
    name: string;
    description: string;
    systemPrompt: string;
    model: string;
    tools: string[];
    disallowedTools: string[];
    memoryScope: string;
    permissionMode: string;
    maxTurns: number | null;
    icon: string;
    color: string;
  };
  skills: Array<{
    name: string;
    description: string;
    instructions: string;
    context: string;
    allowedTools: string[];
    userInvocable?: boolean;
    autoInvoke?: boolean;
  }>;
  commands: Array<{
    name: string;
    description: string;
    promptTemplate: string;
    context: string;
    allowedTools: string[];
  }>;
  summary: string;
}

export async function generateAgentConfig(
  description: string,
  refinement?: string,
  previousConfig?: object
): Promise<GenerateResult> {
  if (!client) {
    throw new Error("AI generation is not available — no API key configured");
  }

  const messages: Anthropic.MessageParam[] = [];

  if (previousConfig && refinement) {
    messages.push({
      role: "user",
      content: `Generate an agent configuration for: ${description}`,
    });
    messages.push({
      role: "assistant",
      content: JSON.stringify(previousConfig),
    });
    messages.push({
      role: "user",
      content: `Please adjust the configuration: ${refinement}`,
    });
  } else {
    messages.push({
      role: "user",
      content: `Generate an agent configuration for: ${description}`,
    });
  }

  const response = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 4096,
    system: AGENT_GENERATION_SYSTEM_PROMPT,
    messages,
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  let parsed: GenerateResult;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Retry once with error context
    const retryResponse = await client.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 4096,
      system: AGENT_GENERATION_SYSTEM_PROMPT,
      messages: [
        ...messages,
        { role: "assistant", content: text },
        {
          role: "user",
          content:
            "Your response was not valid JSON. Please respond with ONLY the JSON object, no markdown fences or explanation.",
        },
      ],
    });

    const retryText = retryResponse.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    try {
      parsed = JSON.parse(retryText);
    } catch {
      throw new Error("Failed to generate valid configuration after retry");
    }
  }

  // Validate agent against schema
  const agentValidation = insertAgentSchema.safeParse({
    ...parsed.agent,
    preloadedSkills: [],
    mcpServers: [],
  });
  if (!agentValidation.success) {
    throw new Error(`Invalid agent configuration: ${agentValidation.error.message}`);
  }

  return parsed;
}
