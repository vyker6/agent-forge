import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Sparkles, Bot, RefreshCw, Puzzle, Terminal as TerminalIcon, Check, Copy, Settings2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

function describeCapabilities(tools: string[]): string[] {
  const caps: string[] = [];
  const has = (t: string) => tools.includes(t);
  if (has("Read") || has("Glob") || has("Grep")) caps.push("Read your files");
  if (has("Write") || has("Edit")) caps.push("Edit your code");
  if (has("Bash")) caps.push("Run commands");
  if (has("WebFetch") || has("WebSearch")) caps.push("Search the web");
  if (has("Task")) caps.push("Break work into subtasks");
  if (caps.length === 0 && tools.length > 0) caps.push(`${tools.length} tools enabled`);
  return caps;
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
  const [createdAgent, setCreatedAgent] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startProgress = useCallback(() => {
    setProgress(0);
    let current = 0;
    progressInterval.current = setInterval(() => {
      // Slow down as we approach 90% — never reach 100% until done
      const remaining = 90 - current;
      const step = Math.max(0.3, remaining * 0.04);
      current = Math.min(90, current + step);
      setProgress(Math.round(current));
    }, 200);
  }, []);

  const stopProgress = useCallback((success: boolean) => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    if (success) {
      setProgress(100);
      setTimeout(() => setProgress(0), 600);
    } else {
      setProgress(0);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, []);

  const handleGenerate = async (desc?: string) => {
    const text = desc || description;
    if (!text.trim()) return;

    setIsGenerating(true);
    setError(null);
    startProgress();
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
      stopProgress(true);
      setConfig(result);
      setRefinement("");
    } catch (err) {
      stopProgress(false);
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

      // Create skills — coerce AI booleans to strings and strip extra fields
      for (const skill of config.skills) {
        await apiRequest("POST", `/api/agents/${agent.id}/skills`, {
          name: skill.name,
          description: skill.description,
          instructions: skill.instructions,
          context: skill.context,
          allowedTools: skill.allowedTools,
          userInvocable: String(skill.userInvocable ?? "true"),
        });
      }

      // Create commands — strip extra fields to match schema
      for (const cmd of config.commands) {
        await apiRequest("POST", `/api/agents/${agent.id}/commands`, {
          name: cmd.name,
          description: cmd.description,
          promptTemplate: cmd.promptTemplate,
          context: cmd.context,
          allowedTools: cmd.allowedTools,
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });

      const slug = config.agent.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      setCreatedAgent({ id: agent.id, name: config.agent.name, slug });
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

  if (createdAgent) {
    const cliCommand = `claude agent add ${createdAgent.slug}`;
    const handleCopy = () => {
      navigator.clipboard.writeText(cliCommand);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    return (
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
        <div className="flex flex-col items-center text-center gap-4 py-8">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Agent Created!</h1>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>{createdAgent.name}</strong> is ready to install
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Install via CLI</h3>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-muted p-3 rounded-md text-xs font-mono overflow-auto">
                  {cliCommand}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopy} data-testid="button-copy-cli">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button asChild className="flex-1" data-testid="button-open-editor">
            <Link href={`/agents/${createdAgent.id}`}>
              <Settings2 className="h-4 w-4 mr-2" />
              Open in Editor
            </Link>
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setCreatedAgent(null);
              setConfig(null);
              setDescription("");
            }}
            data-testid="button-create-another"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Another
          </Button>
        </div>
      </div>
    );
  }

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
                    onClick={() => setDescription(chip.description)}
                    disabled={isGenerating}
                  >
                    {chip.label}
                  </Button>
                ))}
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              {isGenerating ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Building your agent...</span>
                    <span className="font-mono text-xs text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleGenerate()}
                  disabled={!description.trim()}
                  data-testid="button-generate"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Agent
                </Button>
              )}
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
                <h3 className="text-sm font-medium">What this agent can do:</h3>
                <div className="flex flex-wrap gap-1.5">
                  {describeCapabilities(config.agent.tools).map((cap) => (
                    <Badge key={cap} variant="secondary" className="text-xs">{cap}</Badge>
                  ))}
                </div>
              </div>

              {(config.skills.length > 0 || config.commands.length > 0) && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Extras included:</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {config.skills.map((s) => (
                      <Badge key={s.name} variant="outline" className="gap-1 text-xs">
                        <Puzzle className="h-3 w-3" />
                        {s.name}
                      </Badge>
                    ))}
                    {config.commands.map((c) => (
                      <Badge key={c.name} variant="outline" className="gap-1 text-xs">
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
              {isGenerating ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Updating your agent...</span>
                    <span className="font-mono text-xs text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => handleGenerate()}
                  disabled={!refinement.trim()}
                  data-testid="button-refine"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update Agent
                </Button>
              )}
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
