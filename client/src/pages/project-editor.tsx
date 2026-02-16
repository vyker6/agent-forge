import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import {
  ArrowLeft, Save, FileText, ScrollText, Settings, Webhook,
  Plus, Trash2, FolderOpen, Bot, X
} from "lucide-react";
import type {
  Project, Agent, ProjectAgent, Rule, ProjectSettings, Hook,
  InsertProject, InsertRule, InsertProjectSettings, InsertHook
} from "@shared/schema";
import {
  HOOK_EVENTS, HOOK_HANDLER_TYPES, AVAILABLE_MODELS
} from "@shared/schema";
import { AgentIcon } from "@/components/agent-icon";
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
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ProjectEditorPage() {
  const [, params] = useRoute("/projects/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const projectId = params?.id;

  const [form, setForm] = useState<Partial<InsertProject>>({
    name: "",
    description: "",
    claudeMdContent: "",
  });

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: projectAgents = [] } = useQuery<ProjectAgent[]>({
    queryKey: ["/api/projects", projectId, "agents"],
    enabled: !!projectId,
  });

  const { data: projectRules = [] } = useQuery<Rule[]>({
    queryKey: ["/api/projects", projectId, "rules"],
    enabled: !!projectId,
  });

  const { data: projectSettingsData } = useQuery<ProjectSettings | null>({
    queryKey: ["/api/projects", projectId, "settings"],
    enabled: !!projectId,
  });

  const { data: projectHooks = [] } = useQuery<Hook[]>({
    queryKey: ["/api/projects", projectId, "hooks"],
    enabled: !!projectId,
  });

  useEffect(() => {
    if (project) {
      setForm({
        name: project.name,
        description: project.description,
        claudeMdContent: project.claudeMdContent,
      });
    }
  }, [project]);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<InsertProject>) => {
      const res = await apiRequest("PATCH", `/api/projects/${projectId}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project saved" });
    },
    onError: (err: Error) => {
      toast({ title: "Error saving project", description: err.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!form.name?.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    saveMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  const assignedAgentIds = projectAgents.map((pa) => pa.agentId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-3 p-4 border-b flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate("/projects")} data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center shrink-0">
            <FolderOpen className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold truncate" data-testid="text-project-editor-title">
              {form.name || "Untitled"}
            </h1>
            <p className="text-xs text-muted-foreground">Edit project configuration</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-project">
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <div className="border-b px-4">
            <TabsList className="bg-transparent gap-2 h-auto p-0">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-3 py-2"
                data-testid="tab-overview"
              >
                <FileText className="h-4 w-4 mr-1.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="rules"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-3 py-2"
                data-testid="tab-rules"
              >
                <ScrollText className="h-4 w-4 mr-1.5" />
                Rules
                {projectRules.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{projectRules.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-3 py-2"
                data-testid="tab-settings"
              >
                <Settings className="h-4 w-4 mr-1.5" />
                Settings
              </TabsTrigger>
              <TabsTrigger
                value="hooks"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-3 py-2"
                data-testid="tab-hooks"
              >
                <Webhook className="h-4 w-4 mr-1.5" />
                Hooks
                {projectHooks.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{projectHooks.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="overview" className="p-6 mt-0 max-w-3xl space-y-6">
              <OverviewTab
                form={form}
                setForm={setForm}
                agents={agents}
                assignedAgentIds={assignedAgentIds}
                projectId={projectId!}
              />
            </TabsContent>
            <TabsContent value="rules" className="p-6 mt-0 max-w-3xl">
              <RulesTab projectId={projectId!} rules={projectRules} />
            </TabsContent>
            <TabsContent value="settings" className="p-6 mt-0 max-w-3xl">
              <SettingsTab projectId={projectId!} settings={projectSettingsData ?? undefined} />
            </TabsContent>
            <TabsContent value="hooks" className="p-6 mt-0 max-w-3xl">
              <HooksTab projectId={projectId!} hooks={projectHooks} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
    </div>
  );
}

function OverviewTab({
  form,
  setForm,
  agents,
  assignedAgentIds,
  projectId,
}: {
  form: Partial<InsertProject>;
  setForm: React.Dispatch<React.SetStateAction<Partial<InsertProject>>>;
  agents: Agent[];
  assignedAgentIds: string[];
  projectId: string;
}) {
  const toggleAgentMutation = useMutation({
    mutationFn: async ({ agentId, assigned }: { agentId: string; assigned: boolean }) => {
      if (assigned) {
        await apiRequest("DELETE", `/api/projects/${projectId}/agents/${agentId}`);
      } else {
        await apiRequest("POST", `/api/projects/${projectId}/agents`, { agentId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "agents"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="project-name">Project Name</Label>
          <Input
            id="project-name"
            value={form.name ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="My Web App"
            data-testid="input-project-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="project-description">Description</Label>
          <Input
            id="project-description"
            value={form.description ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="A brief project description"
            data-testid="input-project-description"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="claude-md">CLAUDE.md Content</Label>
        <p className="text-xs text-muted-foreground">
          The main project instructions file that guides Claude's behavior
        </p>
        <Textarea
          id="claude-md"
          value={form.claudeMdContent ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, claudeMdContent: e.target.value }))}
          placeholder="# Project Overview&#10;&#10;Describe your project architecture, conventions, and workflows..."
          className="min-h-[200px] font-mono text-sm"
          data-testid="textarea-claude-md"
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <div>
          <Label>Assigned Agents</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Select which agents are included in this project
          </p>
        </div>
        <div className="space-y-2">
          {agents.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No agents available. Create one first.
            </p>
          ) : (
            agents.map((agent) => {
              const isAssigned = assignedAgentIds.includes(agent.id);
              return (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 p-3 rounded-md hover-elevate cursor-pointer"
                  onClick={() =>
                    toggleAgentMutation.mutate({ agentId: agent.id, assigned: isAssigned })
                  }
                  data-testid={`toggle-agent-${agent.id}`}
                >
                  <Checkbox checked={isAssigned} />
                  <AgentIcon icon={agent.icon} color={agent.color} size="sm" className="p-1" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{agent.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function RulesTab({ projectId, rules }: { projectId: string; rules: Rule[] }) {
  const { toast } = useToast();
  const [showNew, setShowNew] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);

  const emptyRuleForm = {
    name: "",
    paths: "" as string,
    content: "",
  };

  const [newRule, setNewRule] = useState(emptyRuleForm);
  const [editForm, setEditForm] = useState(emptyRuleForm);

  const createMutation = useMutation({
    mutationFn: async (data: typeof newRule) => {
      const paths = data.paths.split(",").map((p) => p.trim()).filter(Boolean);
      const res = await apiRequest("POST", `/api/projects/${projectId}/rules`, {
        name: data.name,
        paths,
        content: data.content,
        sortOrder: rules.length,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "rules"] });
      setShowNew(false);
      setNewRule(emptyRuleForm);
      toast({ title: "Rule created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof editForm & { id: string }) => {
      const { id, ...rest } = data;
      const paths = rest.paths.split(",").map((p) => p.trim()).filter(Boolean);
      const res = await apiRequest("PATCH", `/api/rules/${id}`, {
        name: rest.name,
        paths,
        content: rest.content,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "rules"] });
      setEditingRuleId(null);
      toast({ title: "Rule updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "rules"] });
      toast({ title: "Rule deleted" });
    },
  });

  const startEditing = (rule: Rule) => {
    setEditingRuleId(rule.id);
    setEditForm({
      name: rule.name,
      paths: rule.paths.join(", "),
      content: rule.content,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold">Rules</h2>
          <p className="text-sm text-muted-foreground">
            Path-scoped rules exported to .claude/rules/*.md
          </p>
        </div>
        <Button onClick={() => setShowNew(true)} data-testid="button-add-rule">
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {showNew && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <RuleFormFields form={newRule} setForm={setNewRule} />
            <div className="flex items-center gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setShowNew(false); setNewRule(emptyRuleForm); }}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate(newRule)}
                disabled={!newRule.name.trim() || createMutation.isPending}
                data-testid="button-save-rule"
              >
                Create Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {rules.length === 0 && !showNew ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <ScrollText className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No rules added yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <Card key={rule.id} data-testid={`card-rule-${rule.id}`}>
              <CardContent className="p-4">
                {editingRuleId === rule.id ? (
                  <div className="space-y-4">
                    <RuleFormFields form={editForm} setForm={setEditForm} />
                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="ghost" onClick={() => setEditingRuleId(null)}>Cancel</Button>
                      <Button
                        onClick={() => updateMutation.mutate({ ...editForm, id: rule.id })}
                        disabled={!editForm.name.trim() || updateMutation.isPending}
                      >
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer"
                      onClick={() => startEditing(rule)}
                    >
                      <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center shrink-0">
                        <ScrollText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-sm">{rule.name}</h3>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {rule.paths.map((p) => (
                            <Badge key={p} variant="secondary" className="text-[10px] font-mono">{p}</Badge>
                          ))}
                        </div>
                        {rule.content && (
                          <pre className="mt-2 text-xs text-muted-foreground bg-muted p-2 rounded-md overflow-auto max-h-24 font-mono">
                            {rule.content.slice(0, 200)}
                            {rule.content.length > 200 ? "..." : ""}
                          </pre>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(rule.id); }}
                      data-testid={`button-delete-rule-${rule.id}`}
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

function RuleFormFields({
  form,
  setForm,
}: {
  form: { name: string; paths: string; content: string };
  setForm: React.Dispatch<React.SetStateAction<{ name: string; paths: string; content: string }>>;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Rule Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. TypeScript Conventions"
            data-testid="input-rule-name"
          />
        </div>
        <div className="space-y-2">
          <Label>Path Globs (comma-separated)</Label>
          <Input
            value={form.paths}
            onChange={(e) => setForm((f) => ({ ...f, paths: e.target.value }))}
            placeholder="src/**/*.ts, tests/**"
            className="font-mono text-sm"
            data-testid="input-rule-paths"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Rule Content</Label>
        <Textarea
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
          placeholder="Describe the rules and conventions..."
          className="min-h-[150px] font-mono text-sm"
          data-testid="textarea-rule-content"
        />
      </div>
    </div>
  );
}

function SettingsTab({ projectId, settings }: { projectId: string; settings?: ProjectSettings }) {
  const { toast } = useToast();

  const [form, setForm] = useState({
    permissionAllow: "",
    permissionDeny: "",
    permissionAsk: "",
    defaultPermissionMode: "",
    sandboxEnabled: "",
    sandboxAutoAllow: "",
    sandboxAllowedDomains: "",
    sandboxAllowLocalBinding: "",
    sandboxExcludedCommands: "",
    defaultModel: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        permissionAllow: settings.permissionAllow.join(", "),
        permissionDeny: settings.permissionDeny.join(", "),
        permissionAsk: settings.permissionAsk.join(", "),
        defaultPermissionMode: settings.defaultPermissionMode,
        sandboxEnabled: settings.sandboxEnabled,
        sandboxAutoAllow: settings.sandboxAutoAllow,
        sandboxAllowedDomains: settings.sandboxAllowedDomains.join(", "),
        sandboxAllowLocalBinding: settings.sandboxAllowLocalBinding,
        sandboxExcludedCommands: settings.sandboxExcludedCommands.join(", "),
        defaultModel: settings.defaultModel,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const toArray = (s: string) => s.split(",").map((v) => v.trim()).filter(Boolean);
      const res = await apiRequest("PUT", `/api/projects/${projectId}/settings`, {
        permissionAllow: toArray(form.permissionAllow),
        permissionDeny: toArray(form.permissionDeny),
        permissionAsk: toArray(form.permissionAsk),
        defaultPermissionMode: form.defaultPermissionMode,
        sandboxEnabled: form.sandboxEnabled,
        sandboxAutoAllow: form.sandboxAutoAllow,
        sandboxAllowedDomains: toArray(form.sandboxAllowedDomains),
        sandboxAllowLocalBinding: form.sandboxAllowLocalBinding,
        sandboxExcludedCommands: toArray(form.sandboxExcludedCommands),
        defaultModel: form.defaultModel,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "settings"] });
      toast({ title: "Settings saved" });
    },
    onError: (err: Error) => {
      toast({ title: "Error saving settings", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Project Settings</h2>
        <p className="text-sm text-muted-foreground">
          Configure .claude/settings.json fields
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Permissions</h3>
        <div className="space-y-2">
          <Label>Allow (comma-separated tool patterns)</Label>
          <Input
            value={form.permissionAllow}
            onChange={(e) => setForm((f) => ({ ...f, permissionAllow: e.target.value }))}
            placeholder="Read, Glob, Grep"
            className="font-mono text-sm"
            data-testid="input-permission-allow"
          />
        </div>
        <div className="space-y-2">
          <Label>Deny</Label>
          <Input
            value={form.permissionDeny}
            onChange={(e) => setForm((f) => ({ ...f, permissionDeny: e.target.value }))}
            placeholder="Bash(rm *), Write(.env)"
            className="font-mono text-sm"
            data-testid="input-permission-deny"
          />
        </div>
        <div className="space-y-2">
          <Label>Ask</Label>
          <Input
            value={form.permissionAsk}
            onChange={(e) => setForm((f) => ({ ...f, permissionAsk: e.target.value }))}
            placeholder="Bash, Write"
            className="font-mono text-sm"
            data-testid="input-permission-ask"
          />
        </div>
        <div className="space-y-2">
          <Label>Default Permission Mode</Label>
          <Select
            value={form.defaultPermissionMode || "none"}
            onValueChange={(v) => setForm((f) => ({ ...f, defaultPermissionMode: v === "none" ? "" : v }))}
          >
            <SelectTrigger data-testid="select-default-permission-mode">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="acceptEdits">Accept Edits</SelectItem>
              <SelectItem value="bypassPermissions">Bypass Permissions</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Sandbox</h3>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Sandbox Enabled</Label>
            <p className="text-xs text-muted-foreground">Enable network sandbox for commands</p>
          </div>
          <Switch
            checked={form.sandboxEnabled === "true"}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, sandboxEnabled: checked ? "true" : "" }))}
            data-testid="switch-sandbox-enabled"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Auto Allow</Label>
            <p className="text-xs text-muted-foreground">Automatically allow sandboxed commands</p>
          </div>
          <Switch
            checked={form.sandboxAutoAllow === "true"}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, sandboxAutoAllow: checked ? "true" : "" }))}
            data-testid="switch-sandbox-auto-allow"
          />
        </div>
        <div className="space-y-2">
          <Label>Allowed Domains (comma-separated)</Label>
          <Input
            value={form.sandboxAllowedDomains}
            onChange={(e) => setForm((f) => ({ ...f, sandboxAllowedDomains: e.target.value }))}
            placeholder="api.example.com, cdn.example.com"
            className="font-mono text-sm"
            data-testid="input-sandbox-allowed-domains"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Allow Local Binding</Label>
            <p className="text-xs text-muted-foreground">Allow binding to local ports</p>
          </div>
          <Switch
            checked={form.sandboxAllowLocalBinding === "true"}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, sandboxAllowLocalBinding: checked ? "true" : "" }))}
            data-testid="switch-sandbox-local-binding"
          />
        </div>
        <div className="space-y-2">
          <Label>Excluded Commands (comma-separated)</Label>
          <Input
            value={form.sandboxExcludedCommands}
            onChange={(e) => setForm((f) => ({ ...f, sandboxExcludedCommands: e.target.value }))}
            placeholder="curl, wget"
            className="font-mono text-sm"
            data-testid="input-sandbox-excluded-commands"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Model</h3>
        <div className="space-y-2">
          <Label>Default Model</Label>
          <Select
            value={form.defaultModel || "none"}
            onValueChange={(v) => setForm((f) => ({ ...f, defaultModel: v === "none" ? "" : v }))}
          >
            <SelectTrigger data-testid="select-default-model">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {AVAILABLE_MODELS.filter((m) => m.value !== "inherit").map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="pt-4">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-settings">
          <Save className="h-4 w-4 mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}

function HooksTab({ projectId, hooks }: { projectId: string; hooks: Hook[] }) {
  const { toast } = useToast();
  const [showNew, setShowNew] = useState(false);
  const [editingHookId, setEditingHookId] = useState<string | null>(null);

  const emptyHookForm = {
    event: "PreToolUse",
    matcher: "",
    handlerType: "command",
    command: "",
    prompt: "",
    timeout: "" as string,
    statusMessage: "",
    isAsync: "false",
    once: "false",
  };

  const [newHook, setNewHook] = useState(emptyHookForm);
  const [editForm, setEditForm] = useState(emptyHookForm);

  const createMutation = useMutation({
    mutationFn: async (data: typeof newHook) => {
      const res = await apiRequest("POST", `/api/projects/${projectId}/hooks`, {
        event: data.event,
        matcher: data.matcher,
        handlerType: data.handlerType,
        command: data.command,
        prompt: data.prompt,
        timeout: data.timeout ? parseInt(data.timeout, 10) : null,
        statusMessage: data.statusMessage,
        isAsync: data.isAsync,
        once: data.once,
        sortOrder: hooks.length,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "hooks"] });
      setShowNew(false);
      setNewHook(emptyHookForm);
      toast({ title: "Hook created" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof editForm & { id: string }) => {
      const { id, ...rest } = data;
      const res = await apiRequest("PATCH", `/api/hooks/${id}`, {
        event: rest.event,
        matcher: rest.matcher,
        handlerType: rest.handlerType,
        command: rest.command,
        prompt: rest.prompt,
        timeout: rest.timeout ? parseInt(rest.timeout, 10) : null,
        statusMessage: rest.statusMessage,
        isAsync: rest.isAsync,
        once: rest.once,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "hooks"] });
      setEditingHookId(null);
      toast({ title: "Hook updated" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/hooks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId, "hooks"] });
      toast({ title: "Hook deleted" });
    },
  });

  const startEditing = (hook: Hook) => {
    setEditingHookId(hook.id);
    setEditForm({
      event: hook.event,
      matcher: hook.matcher,
      handlerType: hook.handlerType,
      command: hook.command,
      prompt: hook.prompt,
      timeout: hook.timeout?.toString() ?? "",
      statusMessage: hook.statusMessage,
      isAsync: hook.isAsync,
      once: hook.once,
    });
  };

  const applyTemplate = (template: { event: string; matcher: string; handlerType: string; command: string; statusMessage: string }) => {
    setNewHook((f) => ({ ...f, ...template }));
    setShowNew(true);
  };

  const templates = [
    { label: "Lint before commit", event: "PreToolUse", matcher: "Bash(git commit*)", handlerType: "command", command: "npm run lint", statusMessage: "Running linter..." },
    { label: "Type-check before push", event: "PreToolUse", matcher: "Bash(git push*)", handlerType: "command", command: "npx tsc --noEmit", statusMessage: "Type-checking..." },
    { label: "Validate prompt", event: "UserPromptSubmit", matcher: "", handlerType: "command", command: "echo 'Prompt submitted'", statusMessage: "Validating..." },
    { label: "Log tool uses", event: "PostToolUse", matcher: "", handlerType: "command", command: "echo \"Tool used: $TOOL_NAME\"", statusMessage: "Logging..." },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold">Hooks</h2>
          <p className="text-sm text-muted-foreground">
            Event-driven automation exported to .claude/settings.json
          </p>
        </div>
        <Button onClick={() => setShowNew(true)} data-testid="button-add-hook">
          <Plus className="h-4 w-4 mr-2" />
          Add Hook
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {templates.map((t) => (
          <Button
            key={t.label}
            variant="outline"
            size="sm"
            onClick={() => applyTemplate(t)}
            data-testid={`button-template-${t.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {showNew && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <HookFormFields form={newHook} setForm={setNewHook} />
            <div className="flex items-center gap-2 justify-end">
              <Button variant="ghost" onClick={() => { setShowNew(false); setNewHook(emptyHookForm); }}>
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate(newHook)}
                disabled={!newHook.event || createMutation.isPending}
                data-testid="button-save-hook"
              >
                Create Hook
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hooks.length === 0 && !showNew ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Webhook className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hooks added yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {hooks.map((hook) => (
            <Card key={hook.id} data-testid={`card-hook-${hook.id}`}>
              <CardContent className="p-4">
                {editingHookId === hook.id ? (
                  <div className="space-y-4">
                    <HookFormFields form={editForm} setForm={setEditForm} />
                    <div className="flex items-center gap-2 justify-end">
                      <Button variant="ghost" onClick={() => setEditingHookId(null)}>Cancel</Button>
                      <Button
                        onClick={() => updateMutation.mutate({ ...editForm, id: hook.id })}
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer"
                      onClick={() => startEditing(hook)}
                    >
                      <div className="w-8 h-8 rounded-md bg-accent flex items-center justify-center shrink-0">
                        <Webhook className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="default" className="text-[10px]">
                            {HOOK_EVENTS.find((e) => e.value === hook.event)?.label ?? hook.event}
                          </Badge>
                          {hook.matcher && (
                            <Badge variant="secondary" className="text-[10px] font-mono">{hook.matcher}</Badge>
                          )}
                          <Badge variant="outline" className="text-[10px]">
                            {HOOK_HANDLER_TYPES.find((t) => t.value === hook.handlerType)?.label ?? hook.handlerType}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 font-mono truncate">
                          {hook.handlerType === "command" ? hook.command : hook.prompt}
                        </p>
                        {hook.statusMessage && (
                          <p className="text-xs text-muted-foreground mt-0.5">Status: {hook.statusMessage}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(hook.id); }}
                      data-testid={`button-delete-hook-${hook.id}`}
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

function HookFormFields({
  form,
  setForm,
}: {
  form: {
    event: string;
    matcher: string;
    handlerType: string;
    command: string;
    prompt: string;
    timeout: string;
    statusMessage: string;
    isAsync: string;
    once: string;
  };
  setForm: React.Dispatch<React.SetStateAction<typeof form>>;
}) {
  const eventGroups = HOOK_EVENTS.reduce<Record<string, typeof HOOK_EVENTS[number][]>>((acc, e) => {
    (acc[e.group] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Event</Label>
          <Select value={form.event} onValueChange={(v) => setForm((f) => ({ ...f, event: v }))}>
            <SelectTrigger data-testid="select-hook-event">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(eventGroups).map(([group, events]) => (
                <div key={group}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{group}</div>
                  {events.map((e) => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Matcher (optional)</Label>
          <Input
            value={form.matcher}
            onChange={(e) => setForm((f) => ({ ...f, matcher: e.target.value }))}
            placeholder="e.g. Bash(git commit*)"
            className="font-mono text-sm"
            data-testid="input-hook-matcher"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Handler Type</Label>
        <Select value={form.handlerType} onValueChange={(v) => setForm((f) => ({ ...f, handlerType: v }))}>
          <SelectTrigger data-testid="select-hook-handler-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOOK_HANDLER_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {form.handlerType === "command" ? (
        <div className="space-y-2">
          <Label>Shell Command</Label>
          <Textarea
            value={form.command}
            onChange={(e) => setForm((f) => ({ ...f, command: e.target.value }))}
            placeholder="npm run lint"
            className="min-h-[80px] font-mono text-sm"
            data-testid="textarea-hook-command"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Prompt</Label>
          <Textarea
            value={form.prompt}
            onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
            placeholder="Check if the code follows our style guide..."
            className="min-h-[80px] font-mono text-sm"
            data-testid="textarea-hook-prompt"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Timeout (ms)</Label>
          <Input
            type="number"
            min={0}
            value={form.timeout}
            onChange={(e) => setForm((f) => ({ ...f, timeout: e.target.value }))}
            placeholder="None"
            data-testid="input-hook-timeout"
          />
        </div>
        <div className="space-y-2">
          <Label>Status Message</Label>
          <Input
            value={form.statusMessage}
            onChange={(e) => setForm((f) => ({ ...f, statusMessage: e.target.value }))}
            placeholder="Running linter..."
            data-testid="input-hook-status-message"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Async</Label>
            <p className="text-xs text-muted-foreground">Run hook asynchronously</p>
          </div>
          <Switch
            checked={form.isAsync === "true"}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, isAsync: checked ? "true" : "false" }))}
            data-testid="switch-hook-async"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Once</Label>
            <p className="text-xs text-muted-foreground">Only fire this hook once per session</p>
          </div>
          <Switch
            checked={form.once === "true"}
            onCheckedChange={(checked) => setForm((f) => ({ ...f, once: checked ? "true" : "false" }))}
            data-testid="switch-hook-once"
          />
        </div>
      </div>
    </div>
  );
}
