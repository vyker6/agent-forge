import { useState } from "react";
import { useLocation } from "wouter";
import { Sparkles, Bot, Loader2, RefreshCw, Puzzle, Terminal as TerminalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { toolDescriptions } from "@/data/tool-descriptions";

const QUICK_START_CHIPS = [
  { label: "Code reviewer", description: "An agent that reviews my code for bugs, security issues, and style problems" },
  { label: "Documentation writer", description: "An agent that generates documentation from my codebase" },
  { label: "Test generator", description: "An agent that writes comprehensive tests for my code" },
  { label: "Refactoring helper", description: "An agent that identifies and suggests code refactoring opportunities" },
  { label: "Bug fixer", description: "An agent that analyzes bugs, identifies root causes, and suggests fixes" },
  { label: "Security auditor", description: "An agent that performs security analysis and identifies vulnerabilities" },
];

interface GeneratedConfig {
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

export default function AgentBuilderPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [description, setDescription] = useState("");
  const [refinement, setRefinement] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [config, setConfig] = useState<GeneratedConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (desc?: string) => {
    const text = desc || description;
    if (!text.trim()) return;

    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: text,
          refinement: config ? refinement : undefined,
          previousConfig: config || undefined,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }

      const result = await res.json();
      setConfig(result);
      setRefinement("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = async () => {
    if (!config) return;
    setIsCreating(true);
    try {
      // Create the agent
      const agentRes = await apiRequest("POST", "/api/agents", {
        ...config.agent,
        preloadedSkills: [],
        mcpServers: [],
      });
      const agent = await agentRes.json();

      // Create skills
      for (const skill of config.skills) {
        await apiRequest("POST", `/api/agents/${agent.id}/skills`, skill);
      }

      // Create commands
      for (const cmd of config.commands) {
        await apiRequest("POST", `/api/agents/${agent.id}/commands`, cmd);
      }

      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });

      toast({
        title: "Agent created!",
        description: `"${config.agent.name}" is ready to use`,
      });

      navigate(`/agents/${agent.id}`);
    } catch (err) {
      toast({
        title: "Creation failed",
        description: err instanceof Error ? err.message : "Could not create agent",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Build an Agent</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Describe what you want and we'll generate the configuration for you
        </p>
      </div>

      {!config ? (
        <>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., I want an agent that reviews my Python code for bugs and security issues, suggests fixes, and explains what it found."
                className="min-h-[120px] text-sm"
                data-testid="textarea-agent-description"
              />
              <div className="flex flex-wrap gap-2">
                {QUICK_START_CHIPS.map((chip) => (
                  <Button
                    key={chip.label}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDescription(chip.description);
                      handleGenerate(chip.description);
                    }}
                    disabled={isGenerating}
                  >
                    {chip.label}
                  </Button>
                ))}
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button
                className="w-full"
                onClick={() => handleGenerate()}
                disabled={!description.trim() || isGenerating}
                data-testid="button-generate"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Agent
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg">{config.agent.name}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {config.summary}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">How it works:</h3>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Can use: {config.agent.tools.map((t) => toolDescriptions[t] || t).join(", ")}
                  </p>
                  {config.agent.disallowedTools.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Cannot use: {config.agent.disallowedTools.join(", ")}
                    </p>
                  )}
                </div>
              </div>

              {(config.skills.length > 0 || config.commands.length > 0) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Also included:</h3>
                  <div className="flex flex-wrap gap-2">
                    {config.skills.map((s) => (
                      <Badge key={s.name} variant="secondary" className="gap-1">
                        <Puzzle className="h-3 w-3" />
                        Skill: {s.name}
                      </Badge>
                    ))}
                    {config.commands.map((c) => (
                      <Badge key={c.name} variant="secondary" className="gap-1">
                        <TerminalIcon className="h-3 w-3" />
                        /{c.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1"
                  onClick={handleCreate}
                  disabled={isCreating}
                  data-testid="button-create-agent"
                >
                  {isCreating ? "Creating..." : "Create Agent"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigate("/agents/new");
                  }}
                >
                  Customize in Editor
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-3">
              <h3 className="text-sm font-medium">Want to change anything?</h3>
              <Textarea
                value={refinement}
                onChange={(e) => setRefinement(e.target.value)}
                placeholder="e.g., Make it also check for performance issues, or restrict it from running Bash commands"
                className="min-h-[80px] text-sm"
                data-testid="textarea-refinement"
              />
              <Button
                variant="outline"
                onClick={() => handleGenerate()}
                disabled={!refinement.trim() || isGenerating}
                data-testid="button-refine"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update Agent
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => { setConfig(null); setDescription(""); }}
          >
            Start over
          </Button>
        </>
      )}
    </div>
  );
}
