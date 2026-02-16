import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft, Save, FileText, Puzzle, Terminal as TerminalIcon,
  FolderTree, Plus, Trash2, GripVertical, ChevronRight, Folder, File, Eye
} from "lucide-react";
import type { Agent, Skill, Command, FileMapEntry, InsertAgent, McpServer, ProjectAgent } from "@shared/schema";
import { AVAILABLE_TOOLS, AVAILABLE_MODELS, MEMORY_SCOPES, PERMISSION_MODES } from "@shared/schema";
import { AgentIcon, AgentIconPicker } from "@/components/agent-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MarkdownPreview } from "@/components/markdown-preview";
import { generateAgentMarkdown } from "@/lib/generate-markdown";
import { FieldTooltip } from "@/components/field-tooltip";
import { HelpSection } from "@/components/help-section";
import { toolDescriptions } from "@/data/tool-descriptions";

export default function AgentEditorPage() {
  const [, params] = useRoute("/agents/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isNew = params?.id === "new";
  const agentId = isNew ? null : params?.id;

  const [form, setForm] = useState<InsertAgent>({
    name: "",
    description: "",
    systemPrompt: "",
    model: "sonnet",
    tools: [],
    disallowedTools: [],
    memoryScope: "project",
    permissionMode: "default",
    maxTurns: null,
    preloadedSkills: [],
    mcpServers: [],
    icon: "bot",
    color: "#3b82f6",
  });

  const { data: agent, isLoading: agentLoading } = useQuery<Agent>({
    queryKey: ["/api/agents", agentId],
    enabled: !!agentId,
  });

  const { data: skills = [] } = useQuery<Skill[]>({
    queryKey: ["/api/agents", agentId, "skills"],
    enabled: !!agentId,
  });

  const { data: commands = [] } = useQuery<Command[]>({
    queryKey: ["/api/agents", agentId, "commands"],
    enabled: !!agentId,
  });

  const { data: fileMap = [] } = useQuery<FileMapEntry[]>({
    queryKey: ["/api/agents", agentId, "file-map"],
    enabled: !!agentId,
  });

  // Find the project this agent belongs to, then fetch its MCP servers
  const { data: allProjectAgents = [] } = useQuery<(ProjectAgent & { projectId: string })[]>({
    queryKey: ["/api/project-agents-for-agent", agentId],
    queryFn: async () => {
      const projectsRes = await fetch("/api/projects", { credentials: "include" });
      if (!projectsRes.ok) return [];
      const projects = await projectsRes.json();
      for (const p of projects) {
        const pasRes = await fetch(`/api/projects/${p.id}/agents`, { credentials: "include" });
        if (!pasRes.ok) continue;
        const pas = await pasRes.json();
        const match = pas.find((pa: ProjectAgent) => pa.agentId === agentId);
        if (match) return [match];
      }
      return [];
    },
    enabled: !!agentId,
  });

  const projectId = allProjectAgents.length > 0 ? allProjectAgents[0].projectId : null;

  const { data: projectMcpServers = [] } = useQuery<McpServer[]>({
    queryKey: ["/api/projects", projectId, "mcp-servers"],
    enabled: !!projectId,
  });

  useEffect(() => {
    if (agent) {
      setForm({
        name: agent.name,
        description: agent.description,
        systemPrompt: agent.systemPrompt,
        model: agent.model,
        tools: agent.tools,
        disallowedTools: agent.disallowedTools,
        memoryScope: agent.memoryScope,
        permissionMode: agent.permissionMode,
        maxTurns: agent.maxTurns,
        preloadedSkills: agent.preloadedSkills,
        mcpServers: agent.mcpServers,
        icon: agent.icon,
        color: agent.color,
      });
    }
  }, [agent]);

  const saveMutation = useMutation({
    mutationFn: async (data: InsertAgent) => {
      if (isNew) {
        const res = await apiRequest("POST", "/api/agents", data);
        return res.json();
      } else {
        const res = await apiRequest("PATCH", `/api/agents/${agentId}`, data);
        return res.json();
      }
    },
    onSuccess: (result: Agent) => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({ title: isNew ? "Agent created" : "Agent saved" });
      if (isNew) {
        navigate(`/agents/${result.id}`);
      }
    },
    onError: (err: Error) => {
      toast({ title: "Error saving agent", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    saveMutation.mutate(form);
  };

  const toggleTool = (tool: string) => {
    setForm((prev) => ({
      ...prev,
      tools: (prev.tools ?? []).includes(tool)
        ? (prev.tools ?? []).filter((t) => t !== tool)
        : [...(prev.tools ?? []), tool],
    }));
  };

  const toggleDisallowedTool = (tool: string) => {
    setForm((prev) => ({
      ...prev,
      disallowedTools: (prev.disallowedTools ?? []).includes(tool)
        ? (prev.disallowedTools ?? []).filter((t: string) => t !== tool)
        : [...(prev.disallowedTools ?? []), tool],
    }));
  };

  if (!isNew && agentLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-3 p-4 border-b flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <AgentIcon icon={form.icon ?? "bot"} color={form.color ?? "#3b82f6"} size="md" className="p-1.5 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold truncate" data-testid="text-editor-title">
              {isNew ? "New Agent" : form.name || "Untitled"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isNew ? "Configure your new agent" : "Edit agent configuration"}
            </p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-agent">
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="config" className="h-full flex flex-col">
          <div className="border-b px-4">
            <TabsList className="bg-transparent gap-2 h-auto p-0">
              <TabsTrigger
                value="config"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-3 py-2"
                data-testid="tab-config"
              >
                <FileText className="h-4 w-4 mr-1.5" />
                Configuration
              </TabsTrigger>
              {!isNew && (
                <>
                  <TabsTrigger
                    value="skills"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-3 py-2"
                    data-testid="tab-skills"
                  >
                    <Puzzle className="h-4 w-4 mr-1.5" />
                    Skills
                    {skills.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{skills.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="commands"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-3 py-2"
                    data-testid="tab-commands"
                  >
                    <TerminalIcon className="h-4 w-4 mr-1.5" />
                    Commands
                    {commands.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{commands.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="filemap"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-3 py-2"
                    data-testid="tab-filemap"
                  >
                    <FolderTree className="h-4 w-4 mr-1.5" />
                    File Map
                    {fileMap.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{fileMap.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-3 py-2"
                    data-testid="tab-preview"
                  >
                    <Eye className="h-4 w-4 mr-1.5" />
                    Preview
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="config" className="p-6 mt-0 space-y-6 max-w-3xl">
              <AgentConfigForm
                form={form}
                setForm={setForm}
                toggleTool={toggleTool}
                toggleDisallowedTool={toggleDisallowedTool}
                skills={skills}
                projectMcpServers={projectMcpServers}
              />
            </TabsContent>

            {!isNew && agentId && (
              <>
                <TabsContent value="skills" className="p-6 mt-0 max-w-3xl">
                  <SkillsTab agentId={agentId} skills={skills} />
                </TabsContent>
                <TabsContent value="commands" className="p-6 mt-0 max-w-3xl">
                  <CommandsTab agentId={agentId} commands={commands} />
                </TabsContent>
                <TabsContent value="filemap" className="p-6 mt-0 max-w-3xl">
                  <FileMapTab agentId={agentId} entries={fileMap} />
                </TabsContent>
                <TabsContent value="preview" className="p-6 mt-0 max-w-3xl">
                  <PreviewTab form={form} skills={skills} commands={commands} />
                </TabsContent>
              </>
            )}
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}

function AgentConfigForm({
  form,
  setForm,
  toggleTool,
  toggleDisallowedTool,
  skills,
  projectMcpServers,
}: {
  form: InsertAgent;
  setForm: React.Dispatch<React.SetStateAction<InsertAgent>>;
  toggleTool: (tool: string) => void;
  toggleDisallowedTool: (tool: string) => void;
  skills: Skill[];
  projectMcpServers: McpServer[];
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="name">Name</Label>
              <FieldTooltip field="agentName" />
            </div>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Code Reviewer"
              data-testid="input-agent-name"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="description">Description</Label>
              <FieldTooltip field="agentDescription" />
            </div>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="What does this agent do?"
              data-testid="input-agent-description"
            />
          </div>
        </div>
        <Card>
          <CardContent className="p-4">
            <AgentIconPicker
              selectedIcon={form.icon ?? "bot"}
              selectedColor={form.color ?? "#3b82f6"}
              onIconChange={(icon) => setForm((f) => ({ ...f, icon }))}
              onColorChange={(color) => setForm((f) => ({ ...f, color }))}
            />
          </CardContent>
        </Card>
      </div>

      <Separator />

      <HelpSection section="instructions" />
      <div className="space-y-2">
        <div className="flex items-center gap-1">
          <Label htmlFor="systemPrompt">Instructions</Label>
          <FieldTooltip field="systemPrompt" />
        </div>
        <p className="text-xs text-muted-foreground">
          The core instructions that define this agent's behavior and expertise
        </p>
        <Textarea
          id="systemPrompt"
          value={form.systemPrompt}
          onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
          placeholder="You are a code reviewer. Analyze code and provide specific, actionable feedback on..."
          className="min-h-[200px] font-mono text-sm"
          data-testid="textarea-system-prompt"
        />
        {!form.systemPrompt && (
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() =>
              setForm((f) => ({
                ...f,
                systemPrompt:
                  "You are a specialized code reviewer. When asked to review code:\n\n1. Analyze the code for bugs, security issues, and performance problems\n2. Check for adherence to best practices and coding standards\n3. Suggest specific improvements with code examples\n4. Be constructive and explain the reasoning behind each suggestion",
              }))
            }
          >
            Try an example prompt
          </button>
        )}
      </div>

      <Separator />

      <HelpSection section="model" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label>AI Model</Label>
            <FieldTooltip field="model" />
          </div>
          <Select
            value={form.model}
            onValueChange={(v) => setForm((f) => ({ ...f, model: v }))}
          >
            <SelectTrigger data-testid="select-model">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label>What It Remembers</Label>
            <FieldTooltip field="memoryScope" />
          </div>
          <Select
            value={form.memoryScope}
            onValueChange={(v) => setForm((f) => ({ ...f, memoryScope: v }))}
          >
            <SelectTrigger data-testid="select-memory-scope">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEMORY_SCOPES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <HelpSection section="capabilities" />
      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-1">
            <Label>Capabilities</Label>
            <FieldTooltip field="tools" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            What this agent can do
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TOOLS.map((tool) => (
            <Badge
              key={tool}
              variant={(form.tools ?? []).includes(tool) ? "default" : "outline"}
              className={`cursor-pointer toggle-elevate ${(form.tools ?? []).includes(tool) ? "toggle-elevated" : ""}`}
              onClick={() => toggleTool(tool)}
              data-testid={`badge-tool-${tool}`}
              title={toolDescriptions[tool] || tool}
            >
              {tool}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setForm((f) => ({ ...f, tools: [...AVAILABLE_TOOLS] }))}
            data-testid="button-select-all-tools"
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setForm((f) => ({ ...f, tools: [] }))}
            data-testid="button-clear-tools"
          >
            Clear All
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <Label>Restricted Capabilities</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Capabilities this agent is never allowed to use, even if otherwise available
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TOOLS.map((tool) => (
            <Badge
              key={tool}
              variant={(form.disallowedTools ?? []).includes(tool) ? "destructive" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleDisallowedTool(tool)}
              title={toolDescriptions[tool] || tool}
            >
              {tool}
            </Badge>
          ))}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label>How It Asks for Permission</Label>
            <FieldTooltip field="permissionMode" />
          </div>
          <p className="text-xs text-muted-foreground">
            What happens when this agent needs approval to do something
          </p>
          <Select
            value={form.permissionMode ?? "default"}
            onValueChange={(v) => setForm((f) => ({ ...f, permissionMode: v }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERMISSION_MODES.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Label>Conversation Limit</Label>
            <FieldTooltip field="maxTurns" />
          </div>
          <p className="text-xs text-muted-foreground">
            Maximum back-and-forth steps (blank = no limit)
          </p>
          <Input
            type="number"
            min={1}
            value={form.maxTurns ?? ""}
            onChange={(e) => setForm((f) => ({
              ...f,
              maxTurns: e.target.value ? parseInt(e.target.value, 10) : null,
            }))}
            placeholder="Unlimited"
          />
        </div>
      </div>

      {skills.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <div>
              <Label>Preloaded Skills</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Skills whose content is injected into this agent&apos;s context at startup
              </p>
            </div>
            <div className="space-y-2">
              {skills.map((skill) => {
                const slug = skill.name.toLowerCase().replace(/\s+/g, "-");
                const checked = (form.preloadedSkills ?? []).includes(slug);
                return (
                  <label key={skill.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(val) => {
                        setForm((f) => ({
                          ...f,
                          preloadedSkills: val
                            ? [...(f.preloadedSkills ?? []), slug]
                            : (f.preloadedSkills ?? []).filter((s: string) => s !== slug),
                        }));
                      }}
                    />
                    <span className="text-sm">{skill.name}</span>
                    <span className="text-xs text-muted-foreground">({slug})</span>
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}

      {projectMcpServers.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <div>
              <Label>MCP Servers</Label>
              <p className="text-xs text-muted-foreground mt-1">
                MCP servers this agent has access to
              </p>
            </div>
            <div className="space-y-2">
              {projectMcpServers.map((server) => {
                const checked = (form.mcpServers ?? []).includes(server.name);
                return (
                  <label key={server.id} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(val) => {
                        setForm((f) => ({
                          ...f,
                          mcpServers: val
                            ? [...(f.mcpServers ?? []), server.name]
                            : (f.mcpServers ?? []).filter((s: string) => s !== server.name),
                        }));
                      }}
                    />
                    <span className="text-sm">{server.name}</span>
                    <span className="text-xs text-muted-foreground">({server.command})</span>
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SkillFormFields({
  form,
  setForm,
}: {
  form: {
    name: string;
    description: string;
    instructions: string;
    context: string;
    allowedTools: string[];
    argumentHint: string;
    agentType: string;
    model: string;
    disableModelInvocation: string;
    userInvocable: string;
  };
  setForm: (updater: (prev: typeof form) => typeof form) => void;
}) {
  const toggleSkillTool = (tool: string) => {
    setForm((prev) => ({
      ...prev,
      allowedTools: prev.allowedTools.includes(tool)
        ? prev.allowedTools.filter((t) => t !== tool)
        : [...prev.allowedTools, tool],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            placeholder="e.g. pdf-processing"
            data-testid="input-skill-name"
          />
        </div>
        <div className="space-y-2">
          <Label>Context</Label>
          <Select
            value={form.context}
            onValueChange={(v) => setForm((s) => ({ ...s, context: v }))}
          >
            <SelectTrigger data-testid="select-skill-context">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="main">Main</SelectItem>
              <SelectItem value="fork">Fork (Separate Context)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Input
          value={form.description}
          onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
          placeholder="When to use this skill"
          data-testid="input-skill-description"
        />
      </div>

      <div className="space-y-2">
        <Label>Argument Hint</Label>
        <Input
          value={form.argumentHint}
          onChange={(e) => setForm((s) => ({ ...s, argumentHint: e.target.value }))}
          placeholder="[file-path]"
          data-testid="input-skill-argument-hint"
        />
      </div>

      <div className="space-y-2">
        <Label>Instructions (SKILL.md content)</Label>
        <Textarea
          value={form.instructions}
          onChange={(e) => setForm((s) => ({ ...s, instructions: e.target.value }))}
          placeholder="# Skill Instructions&#10;&#10;Describe what this skill does and how to use it..."
          className="min-h-[150px] font-mono text-sm"
          data-testid="textarea-skill-instructions"
        />
      </div>

      <div className="space-y-3">
        <div>
          <Label>Allowed Tools</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Select which tools this skill can use
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TOOLS.map((tool) => (
            <Badge
              key={tool}
              variant={form.allowedTools.includes(tool) ? "default" : "outline"}
              className={`cursor-pointer toggle-elevate ${form.allowedTools.includes(tool) ? "toggle-elevated" : ""}`}
              onClick={() => toggleSkillTool(tool)}
              data-testid={`badge-skill-tool-${tool}`}
            >
              {tool}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Model</Label>
          <Select
            value={form.model || "_none"}
            onValueChange={(v) => setForm((s) => ({ ...s, model: v === "_none" ? "" : v }))}
          >
            <SelectTrigger data-testid="select-skill-model">
              <SelectValue placeholder="Inherit (Default)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Inherit (Default)</SelectItem>
              <SelectItem value="sonnet">Claude Sonnet</SelectItem>
              <SelectItem value="opus">Claude Opus</SelectItem>
              <SelectItem value="haiku">Claude Haiku</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {form.context === "fork" && (
          <div className="space-y-2">
            <Label>Agent Type</Label>
            <Select
              value={form.agentType}
              onValueChange={(v) => setForm((s) => ({ ...s, agentType: v }))}
            >
              <SelectTrigger data-testid="select-skill-agent-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general-purpose">General Purpose</SelectItem>
                <SelectItem value="Explore">Explore</SelectItem>
                <SelectItem value="Plan">Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Disable auto-invocation</Label>
            <p className="text-xs text-muted-foreground">
              Prevent the model from automatically invoking this skill
            </p>
          </div>
          <Switch
            checked={form.disableModelInvocation === "true"}
            onCheckedChange={(checked) =>
              setForm((s) => ({ ...s, disableModelInvocation: checked ? "true" : "false" }))
            }
            data-testid="switch-skill-disable-invocation"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>User invocable (show in / menu)</Label>
            <p className="text-xs text-muted-foreground">
              Allow users to invoke this skill from the slash command menu
            </p>
          </div>
          <Switch
            checked={form.userInvocable === "true"}
            onCheckedChange={(checked) =>
              setForm((s) => ({ ...s, userInvocable: checked ? "true" : "false" }))
            }
            data-testid="switch-skill-user-invocable"
          />
        </div>
      </div>
    </div>
  );
}

function SkillsTab({ agentId, skills }: { agentId: string; skills: Skill[] }) {
  const { toast } = useToast();
  const [showNew, setShowNew] = useState(false);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);

  const emptySkillForm = {
    name: "",
    description: "",
    instructions: "",
    context: "main",
    allowedTools: [] as string[],
    argumentHint: "",
    agentType: "general-purpose",
    model: "",
    disableModelInvocation: "false",
    userInvocable: "true",
  };

  const [newSkill, setNewSkill] = useState(emptySkillForm);
  const [editForm, setEditForm] = useState(emptySkillForm);

  const createMutation = useMutation({
    mutationFn: async (data: typeof newSkill) => {
      const res = await apiRequest("POST", `/api/agents/${agentId}/skills`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentId, "skills"] });
      setShowNew(false);
      setNewSkill({ ...emptySkillForm, allowedTools: [] });
      toast({ title: "Skill created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof editForm & { id: string }) => {
      const { id, ...body } = data;
      const res = await apiRequest("PATCH", `/api/skills/${id}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentId, "skills"] });
      setEditingSkillId(null);
      toast({ title: "Skill updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error updating skill", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (skillId: string) => {
      await apiRequest("DELETE", `/api/skills/${skillId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentId, "skills"] });
      toast({ title: "Skill deleted" });
    },
  });

  const startEditing = (skill: Skill) => {
    setEditingSkillId(skill.id);
    setEditForm({
      name: skill.name,
      description: skill.description,
      instructions: skill.instructions,
      context: skill.context,
      allowedTools: [...skill.allowedTools],
      argumentHint: skill.argumentHint,
      agentType: skill.agentType,
      model: skill.model,
      disableModelInvocation: skill.disableModelInvocation,
      userInvocable: skill.userInvocable,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold">Skills</h2>
          <p className="text-sm text-muted-foreground">
            Auto-discovered capabilities with instructions and scripts
          </p>
        </div>
        <Button onClick={() => setShowNew(true)} data-testid="button-add-skill">
          <Plus className="h-4 w-4 mr-2" />
          Add Skill
        </Button>
      </div>

      {showNew && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <SkillFormFields form={newSkill} setForm={setNewSkill} />
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowNew(false);
                  setNewSkill({ ...emptySkillForm, allowedTools: [] });
                }}
                data-testid="button-cancel-skill"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate(newSkill)}
                disabled={!newSkill.name.trim() || createMutation.isPending}
                data-testid="button-save-skill"
              >
                Create Skill
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {skills.length === 0 && !showNew ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Puzzle className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No skills added yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {skills.map((skill) => (
            <Card key={skill.id} data-testid={`card-skill-${skill.id}`}>
              <CardContent className="p-4">
                {editingSkillId === skill.id ? (
                  <div className="space-y-4">
                    <SkillFormFields form={editForm} setForm={setEditForm} />
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        onClick={() => setEditingSkillId(null)}
                        data-testid="button-cancel-edit-skill"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => updateMutation.mutate({ ...editForm, id: skill.id })}
                        disabled={!editForm.name.trim() || updateMutation.isPending}
                        data-testid="button-save-edit-skill"
                      >
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer"
                      onClick={() => startEditing(skill)}
                    >
                      <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center shrink-0">
                        <Puzzle className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm">{skill.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{skill.description}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <Badge variant="secondary" className="text-[10px]">{skill.context}</Badge>
                          {skill.model && (
                            <Badge variant="secondary" className="text-[10px]">model: {skill.model}</Badge>
                          )}
                          {skill.context === "fork" && (
                            <Badge variant="secondary" className="text-[10px]">{skill.agentType}</Badge>
                          )}
                          {skill.disableModelInvocation === "true" && (
                            <Badge variant="outline" className="text-[10px]">Auto-invoke: off</Badge>
                          )}
                          {skill.userInvocable === "false" && (
                            <Badge variant="outline" className="text-[10px]">Hidden from menu</Badge>
                          )}
                        </div>
                        {skill.instructions && (
                          <pre className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded-md overflow-auto max-h-24 font-mono">
                            {skill.instructions.slice(0, 200)}
                            {skill.instructions.length > 200 ? "..." : ""}
                          </pre>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(skill.id);
                      }}
                      data-testid={`button-delete-skill-${skill.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CommandFormFields({
  form,
  setForm,
}: {
  form: {
    name: string;
    description: string;
    promptTemplate: string;
    argumentHint: string;
    context: string;
    agentType: string;
    allowedTools: string[];
    model: string;
    disableModelInvocation: string;
    userInvocable: string;
  };
  setForm: (updater: (prev: typeof form) => typeof form) => void;
}) {
  const toggleCommandTool = (tool: string) => {
    setForm((prev) => ({
      ...prev,
      allowedTools: prev.allowedTools.includes(tool)
        ? prev.allowedTools.filter((t) => t !== tool)
        : [...prev.allowedTools, tool],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Command Name</Label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">/</span>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm((s) => ({ ...s, name: e.target.value.replace(/\s+/g, "-").toLowerCase() }))
              }
              placeholder="review-code"
              data-testid="input-command-name"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input
            value={form.description}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            placeholder="What this command does"
            data-testid="input-command-description"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Argument Hint</Label>
        <Input
          value={form.argumentHint}
          onChange={(e) => setForm((s) => ({ ...s, argumentHint: e.target.value }))}
          placeholder="[PR-number]"
          data-testid="input-command-argument-hint"
        />
      </div>

      <div className="space-y-2">
        <Label>Prompt Template</Label>
        <Textarea
          value={form.promptTemplate}
          onChange={(e) => setForm((s) => ({ ...s, promptTemplate: e.target.value }))}
          placeholder="Review the following code for security vulnerabilities and best practices..."
          className="min-h-[120px] font-mono text-sm"
          data-testid="textarea-command-template"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Context</Label>
          <Select
            value={form.context || "_none"}
            onValueChange={(v) => setForm((s) => ({ ...s, context: v === "_none" ? "" : v }))}
          >
            <SelectTrigger data-testid="select-command-context">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">None</SelectItem>
              <SelectItem value="main">Main</SelectItem>
              <SelectItem value="fork">Fork (Separate Context)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {form.context === "fork" && (
          <div className="space-y-2">
            <Label>Agent Type</Label>
            <Select
              value={form.agentType || "_none"}
              onValueChange={(v) => setForm((s) => ({ ...s, agentType: v === "_none" ? "" : v }))}
            >
              <SelectTrigger data-testid="select-command-agent-type">
                <SelectValue placeholder="Default" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">Default</SelectItem>
                <SelectItem value="general-purpose">General Purpose</SelectItem>
                <SelectItem value="Explore">Explore</SelectItem>
                <SelectItem value="Plan">Plan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <Label>Allowed Tools</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Select which tools this command can use
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TOOLS.map((tool) => (
            <Badge
              key={tool}
              variant={form.allowedTools.includes(tool) ? "default" : "outline"}
              className={`cursor-pointer toggle-elevate ${form.allowedTools.includes(tool) ? "toggle-elevated" : ""}`}
              onClick={() => toggleCommandTool(tool)}
              data-testid={`badge-command-tool-${tool}`}
            >
              {tool}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Model</Label>
          <Select
            value={form.model || "_none"}
            onValueChange={(v) => setForm((s) => ({ ...s, model: v === "_none" ? "" : v }))}
          >
            <SelectTrigger data-testid="select-command-model">
              <SelectValue placeholder="Inherit (Default)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Inherit (Default)</SelectItem>
              <SelectItem value="sonnet">Claude Sonnet</SelectItem>
              <SelectItem value="opus">Claude Opus</SelectItem>
              <SelectItem value="haiku">Claude Haiku</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Disable auto-invocation</Label>
            <p className="text-xs text-muted-foreground">
              Prevent the model from automatically invoking this command
            </p>
          </div>
          <Switch
            checked={form.disableModelInvocation === "true"}
            onCheckedChange={(checked) =>
              setForm((s) => ({ ...s, disableModelInvocation: checked ? "true" : "false" }))
            }
            data-testid="switch-command-disable-invocation"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>User invocable (show in / menu)</Label>
            <p className="text-xs text-muted-foreground">
              Allow users to invoke this command from the slash command menu
            </p>
          </div>
          <Switch
            checked={form.userInvocable === "true"}
            onCheckedChange={(checked) =>
              setForm((s) => ({ ...s, userInvocable: checked ? "true" : "false" }))
            }
            data-testid="switch-command-user-invocable"
          />
        </div>
      </div>
    </div>
  );
}

function CommandsTab({ agentId, commands }: { agentId: string; commands: Command[] }) {
  const { toast } = useToast();
  const [showNew, setShowNew] = useState(false);
  const [editingCommandId, setEditingCommandId] = useState<string | null>(null);

  const emptyCommandForm = {
    name: "",
    description: "",
    promptTemplate: "",
    argumentHint: "",
    context: "",
    agentType: "",
    allowedTools: [] as string[],
    model: "",
    disableModelInvocation: "false",
    userInvocable: "true",
  };

  const [newCmd, setNewCmd] = useState(emptyCommandForm);
  const [editForm, setEditForm] = useState(emptyCommandForm);

  const createMutation = useMutation({
    mutationFn: async (data: typeof newCmd) => {
      const res = await apiRequest("POST", `/api/agents/${agentId}/commands`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentId, "commands"] });
      setShowNew(false);
      setNewCmd({ ...emptyCommandForm, allowedTools: [] });
      toast({ title: "Command created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof editForm & { id: string }) => {
      const { id, ...body } = data;
      const res = await apiRequest("PATCH", `/api/commands/${id}`, body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentId, "commands"] });
      setEditingCommandId(null);
      toast({ title: "Command updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error updating command", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (cmdId: string) => {
      await apiRequest("DELETE", `/api/commands/${cmdId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentId, "commands"] });
      toast({ title: "Command deleted" });
    },
  });

  const startEditing = (cmd: Command) => {
    setEditingCommandId(cmd.id);
    setEditForm({
      name: cmd.name,
      description: cmd.description,
      promptTemplate: cmd.promptTemplate,
      argumentHint: cmd.argumentHint,
      context: cmd.context,
      agentType: cmd.agentType,
      allowedTools: [...cmd.allowedTools],
      model: cmd.model,
      disableModelInvocation: cmd.disableModelInvocation,
      userInvocable: cmd.userInvocable,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold">Slash Commands</h2>
          <p className="text-sm text-muted-foreground">
            Custom commands triggered with /command-name in Claude Code
          </p>
        </div>
        <Button onClick={() => setShowNew(true)} data-testid="button-add-command">
          <Plus className="h-4 w-4 mr-2" />
          Add Command
        </Button>
      </div>

      {showNew && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <CommandFormFields form={newCmd} setForm={setNewCmd} />
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowNew(false);
                  setNewCmd({ ...emptyCommandForm, allowedTools: [] });
                }}
                data-testid="button-cancel-command"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate(newCmd)}
                disabled={!newCmd.name.trim() || createMutation.isPending}
                data-testid="button-save-command"
              >
                Create Command
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {commands.length === 0 && !showNew ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <TerminalIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No commands added yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {commands.map((cmd) => (
            <Card key={cmd.id} data-testid={`card-command-${cmd.id}`}>
              <CardContent className="p-4">
                {editingCommandId === cmd.id ? (
                  <div className="space-y-4">
                    <CommandFormFields form={editForm} setForm={setEditForm} />
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        onClick={() => setEditingCommandId(null)}
                        data-testid="button-cancel-edit-command"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => updateMutation.mutate({ ...editForm, id: cmd.id })}
                        disabled={!editForm.name.trim() || updateMutation.isPending}
                        data-testid="button-save-edit-command"
                      >
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer"
                      onClick={() => startEditing(cmd)}
                    >
                      <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center shrink-0">
                        <TerminalIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono font-medium">/{cmd.name}</code>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{cmd.description}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {cmd.context && (
                            <Badge variant="secondary" className="text-[10px]">{cmd.context}</Badge>
                          )}
                          {cmd.model && (
                            <Badge variant="secondary" className="text-[10px]">model: {cmd.model}</Badge>
                          )}
                          {cmd.context === "fork" && cmd.agentType && (
                            <Badge variant="secondary" className="text-[10px]">{cmd.agentType}</Badge>
                          )}
                          {cmd.disableModelInvocation === "true" && (
                            <Badge variant="outline" className="text-[10px]">Auto-invoke: off</Badge>
                          )}
                          {cmd.userInvocable === "false" && (
                            <Badge variant="outline" className="text-[10px]">Hidden from menu</Badge>
                          )}
                        </div>
                        {cmd.promptTemplate && (
                          <pre className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded-md overflow-auto max-h-20 font-mono">
                            {cmd.promptTemplate.slice(0, 150)}
                            {cmd.promptTemplate.length > 150 ? "..." : ""}
                          </pre>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(cmd.id);
                      }}
                      data-testid={`button-delete-command-${cmd.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function PreviewTab({ form, skills, commands }: { form: InsertAgent; skills: Skill[]; commands: Command[] }) {
  const allFiles = generateAgentMarkdown(
    {
      name: form.name || "untitled",
      description: form.description ?? "",
      tools: form.tools ?? [],
      disallowedTools: form.disallowedTools ?? [],
      model: form.model ?? "sonnet",
      memoryScope: form.memoryScope ?? "project",
      permissionMode: form.permissionMode ?? "default",
      maxTurns: form.maxTurns ?? null,
      preloadedSkills: form.preloadedSkills ?? [],
      mcpServers: form.mcpServers ?? [],
      systemPrompt: form.systemPrompt ?? "",
    },
    skills,
    commands
  );

  const filePaths = Object.keys(allFiles);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Preview</h2>
        <p className="text-sm text-muted-foreground">
          Live preview of the generated markdown files
        </p>
      </div>
      {filePaths.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Eye className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Add a name to see preview</p>
          </CardContent>
        </Card>
      ) : (
        filePaths.map((path) => (
          <MarkdownPreview key={path} filename={path} content={allFiles[path]} />
        ))
      )}
    </div>
  );
}

function FileMapTab({ agentId, entries }: { agentId: string; entries: FileMapEntry[] }) {
  const { toast } = useToast();
  const [showNew, setShowNew] = useState(false);
  const [newEntry, setNewEntry] = useState({
    path: "",
    description: "",
    entryType: "directory" as "directory" | "file",
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newEntry) => {
      const res = await apiRequest("POST", `/api/agents/${agentId}/file-map`, {
        ...data,
        sortOrder: entries.length,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentId, "file-map"] });
      setShowNew(false);
      setNewEntry({ path: "", description: "", entryType: "directory" });
      toast({ title: "Entry added" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await apiRequest("DELETE", `/api/file-map/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentId, "file-map"] });
      toast({ title: "Entry removed" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold">File Map</h2>
          <p className="text-sm text-muted-foreground">
            Define project structure so the agent knows where to look for things
          </p>
        </div>
        <Button onClick={() => setShowNew(true)} data-testid="button-add-file-entry">
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {showNew && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-4">
              <div className="space-y-2">
                <Label>Path</Label>
                <Input
                  value={newEntry.path}
                  onChange={(e) => setNewEntry((f) => ({ ...f, path: e.target.value }))}
                  placeholder="src/components/"
                  className="font-mono text-sm"
                  data-testid="input-file-path"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <div className="flex items-center gap-3 h-9">
                  <button
                    type="button"
                    onClick={() => setNewEntry((f) => ({ ...f, entryType: "directory" }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      newEntry.entryType === "directory" ? "bg-accent" : "hover-elevate"
                    }`}
                    data-testid="button-type-directory"
                  >
                    <Folder className="h-3.5 w-3.5" />
                    Directory
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewEntry((f) => ({ ...f, entryType: "file" }))}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      newEntry.entryType === "file" ? "bg-accent" : "hover-elevate"
                    }`}
                    data-testid="button-type-file"
                  >
                    <File className="h-3.5 w-3.5" />
                    File
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input
                value={newEntry.description}
                onChange={(e) => setNewEntry((f) => ({ ...f, description: e.target.value }))}
                placeholder="What's in this location"
                data-testid="input-file-description"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowNew(false)} data-testid="button-cancel-file-entry">
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate(newEntry)}
                disabled={!newEntry.path.trim() || createMutation.isPending}
                data-testid="button-save-file-entry"
              >
                Add Entry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {entries.length === 0 && !showNew ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <FolderTree className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No file map entries yet</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 px-4 py-3 group"
                  data-testid={`row-file-entry-${entry.id}`}
                >
                  {entry.entryType === "directory" ? (
                    <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <File className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <code className="text-sm font-mono flex-shrink-0">{entry.path}</code>
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground truncate flex-1">
                    {entry.description}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    style={{ visibility: "visible" }}
                    onClick={() => deleteMutation.mutate(entry.id)}
                    data-testid={`button-delete-entry-${entry.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
