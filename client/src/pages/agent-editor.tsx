import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft, Save, FileText, Puzzle, Terminal as TerminalIcon,
  FolderTree, Plus, Trash2, GripVertical, ChevronRight, Folder, File
} from "lucide-react";
import type { Agent, Skill, Command, FileMapEntry, InsertAgent } from "@shared/schema";
import { AVAILABLE_TOOLS, AVAILABLE_MODELS, MEMORY_SCOPES } from "@shared/schema";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
    memoryScope: "project",
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

  useEffect(() => {
    if (agent) {
      setForm({
        name: agent.name,
        description: agent.description,
        systemPrompt: agent.systemPrompt,
        model: agent.model,
        tools: agent.tools,
        memoryScope: agent.memoryScope,
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
      tools: prev.tools.includes(tool)
        ? prev.tools.filter((t) => t !== tool)
        : [...prev.tools, tool],
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
          <AgentIcon icon={form.icon} color={form.color} size="md" className="p-1.5 shrink-0" />
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
}: {
  form: InsertAgent;
  setForm: React.Dispatch<React.SetStateAction<InsertAgent>>;
  toggleTool: (tool: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Code Reviewer"
              data-testid="input-agent-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
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
              selectedIcon={form.icon}
              selectedColor={form.color}
              onIconChange={(icon) => setForm((f) => ({ ...f, icon }))}
              onColorChange={(color) => setForm((f) => ({ ...f, color }))}
            />
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="systemPrompt">System Prompt / Instructions</Label>
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
      </div>

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Model</Label>
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
          <Label>Memory Scope</Label>
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

      <div className="space-y-3">
        <div>
          <Label>Allowed Tools</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Select which tools this agent can use
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TOOLS.map((tool) => (
            <Badge
              key={tool}
              variant={form.tools.includes(tool) ? "default" : "outline"}
              className={`cursor-pointer toggle-elevate ${form.tools.includes(tool) ? "toggle-elevated" : ""}`}
              onClick={() => toggleTool(tool)}
              data-testid={`badge-tool-${tool}`}
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
    </div>
  );
}

function SkillsTab({ agentId, skills }: { agentId: string; skills: Skill[] }) {
  const { toast } = useToast();
  const [showNew, setShowNew] = useState(false);
  const [newSkill, setNewSkill] = useState({
    name: "",
    description: "",
    instructions: "",
    context: "main",
    allowedTools: [] as string[],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newSkill) => {
      const res = await apiRequest("POST", `/api/agents/${agentId}/skills`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentId, "skills"] });
      setShowNew(false);
      setNewSkill({ name: "", description: "", instructions: "", context: "main", allowedTools: [] });
      toast({ title: "Skill created" });
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newSkill.name}
                  onChange={(e) => setNewSkill((s) => ({ ...s, name: e.target.value }))}
                  placeholder="e.g. pdf-processing"
                  data-testid="input-skill-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Context</Label>
                <Select
                  value={newSkill.context}
                  onValueChange={(v) => setNewSkill((s) => ({ ...s, context: v }))}
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
                value={newSkill.description}
                onChange={(e) => setNewSkill((s) => ({ ...s, description: e.target.value }))}
                placeholder="When to use this skill"
                data-testid="input-skill-description"
              />
            </div>
            <div className="space-y-2">
              <Label>Instructions (SKILL.md content)</Label>
              <Textarea
                value={newSkill.instructions}
                onChange={(e) => setNewSkill((s) => ({ ...s, instructions: e.target.value }))}
                placeholder="# Skill Instructions&#10;&#10;Describe what this skill does and how to use it..."
                className="min-h-[150px] font-mono text-sm"
                data-testid="textarea-skill-instructions"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowNew(false)} data-testid="button-cancel-skill">
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
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center shrink-0">
                      <Puzzle className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm">{skill.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{skill.description}</p>
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
                    onClick={() => deleteMutation.mutate(skill.id)}
                    data-testid={`button-delete-skill-${skill.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CommandsTab({ agentId, commands }: { agentId: string; commands: Command[] }) {
  const { toast } = useToast();
  const [showNew, setShowNew] = useState(false);
  const [newCmd, setNewCmd] = useState({ name: "", description: "", promptTemplate: "" });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newCmd) => {
      const res = await apiRequest("POST", `/api/agents/${agentId}/commands`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents", agentId, "commands"] });
      setShowNew(false);
      setNewCmd({ name: "", description: "", promptTemplate: "" });
      toast({ title: "Command created" });
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Command Name</Label>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">/</span>
                  <Input
                    value={newCmd.name}
                    onChange={(e) => setNewCmd((c) => ({ ...c, name: e.target.value.replace(/\s/g, "-").toLowerCase() }))}
                    placeholder="review-code"
                    data-testid="input-command-name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newCmd.description}
                  onChange={(e) => setNewCmd((c) => ({ ...c, description: e.target.value }))}
                  placeholder="What this command does"
                  data-testid="input-command-description"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Prompt Template</Label>
              <Textarea
                value={newCmd.promptTemplate}
                onChange={(e) => setNewCmd((c) => ({ ...c, promptTemplate: e.target.value }))}
                placeholder="Review the following code for security vulnerabilities and best practices..."
                className="min-h-[120px] font-mono text-sm"
                data-testid="textarea-command-template"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowNew(false)} data-testid="button-cancel-command">
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
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center shrink-0">
                      <TerminalIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono font-medium">/{cmd.name}</code>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{cmd.description}</p>
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
                    onClick={() => deleteMutation.mutate(cmd.id)}
                    data-testid={`button-delete-command-${cmd.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
