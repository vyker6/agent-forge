import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Rocket, Download, FolderOpen, Bot, CheckCircle2,
  FileText, Puzzle, Terminal as TerminalIcon, FolderTree,
  ChevronDown, ChevronRight, AlertCircle, Package, Copy, Server
} from "lucide-react";
import type { Agent, Project, ProjectAgent, McpServer } from "@shared/schema";
import { AgentIcon } from "@/components/agent-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";

export default function DeployPage() {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);

  const { data: projects = [], isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: projectAgents = [] } = useQuery<ProjectAgent[]>({
    queryKey: ["/api/projects", selectedProjectId, "agents"],
    enabled: !!selectedProjectId,
  });

  const { data: mcpServers = [] } = useQuery<McpServer[]>({
    queryKey: ["/api/projects", selectedProjectId, "mcp-servers"],
    enabled: !!selectedProjectId,
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const assignedAgentIds = projectAgents.map((pa) => pa.agentId);
  const assignedAgents = agents.filter((a) => assignedAgentIds.includes(a.id));

  const [isExportingPlugin, setIsExportingPlugin] = useState(false);

  const handleDeploy = async () => {
    if (!selectedProjectId) return;
    setIsDeploying(true);
    try {
      const response = await fetch(`/api/projects/${selectedProjectId}/export`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedProject?.name || "project"}-claude-config.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Export complete",
        description: "Unzip into your project root to install the agents",
      });
    } catch (err) {
      toast({
        title: "Export failed",
        description: "Could not generate the configuration files",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handlePluginExport = async () => {
    if (!selectedProjectId) return;
    setIsExportingPlugin(true);
    try {
      const response = await fetch(`/api/projects/${selectedProjectId}/export?format=json`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Export failed");
      const json = await response.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedProject?.name || "project"}-plugin.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Plugin exported",
        description: "JSON plugin file downloaded",
      });
    } catch (err) {
      toast({
        title: "Export failed",
        description: "Could not generate the plugin file",
        variant: "destructive",
      });
    } finally {
      setIsExportingPlugin(false);
    }
  };

  if (projectsLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-deploy-title">
          Deploy Agents
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Export your agent configuration as a .claude/ directory ready to install
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold">Select a Project</h2>
              <p className="text-sm text-muted-foreground">
                Choose which project configuration to export
              </p>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="flex items-center gap-3 p-4 rounded-md bg-muted">
              <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">
                No projects available. Create a project first and assign agents to it.
              </p>
            </div>
          ) : (
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger data-testid="select-deploy-project">
                <SelectValue placeholder="Choose a project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {selectedProject && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {assignedAgents.length} Agent{assignedAgents.length !== 1 ? "s" : ""} Assigned
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {assignedAgents.map((agent) => (
                    <Badge key={agent.id} variant="secondary" className="gap-1.5">
                      <AgentIcon icon={agent.icon} color={agent.color} size="sm" className="p-0" />
                      {agent.name}
                    </Badge>
                  ))}
                  {assignedAgents.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No agents assigned to this project
                    </p>
                  )}
                </div>
              </div>

              {assignedAgents.length > 0 && (
                <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium w-full hover-elevate p-2 rounded-md" data-testid="button-toggle-preview">
                    {previewOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Generated File Preview
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <FilePreview
                      project={selectedProject}
                      agents={assignedAgents}
                      mcpServerCount={mcpServers.length}
                    />
                  </CollapsibleContent>
                </Collapsible>
              )}

              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  disabled={assignedAgents.length === 0 || isDeploying}
                  onClick={handleDeploy}
                  data-testid="button-deploy"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isDeploying ? "Generating..." : "Download ZIP"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={assignedAgents.length === 0 || isExportingPlugin}
                  onClick={handlePluginExport}
                  data-testid="button-export-plugin"
                >
                  <Package className="h-4 w-4 mr-2" />
                  {isExportingPlugin ? "Exporting..." : "Export as Plugin"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {selectedProject && selectedProjectId && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center shrink-0">
                <TerminalIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">CLI Install Command</h3>
                <p className="text-sm text-muted-foreground">
                  Install this plugin directly via the command line
                </p>
              </div>
            </div>
            <CliCommand projectId={selectedProjectId} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold">Installation Instructions</h3>
          <div className="space-y-3">
            <Step number={1} title="Download the ZIP">
              Select your project above and click download
            </Step>
            <Step number={2} title="Extract to project root">
              Unzip the file into your Claude Code project's root directory
            </Step>
            <Step number={3} title="Start Claude Code">
              The agents, skills, and commands will be automatically discovered
            </Step>
            <Step number={4} title="Use your agents">
              Invoke agents with @agent-name, run commands with /command-name
            </Step>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
        {number}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{children}</p>
      </div>
    </div>
  );
}

function FilePreview({ project, agents, mcpServerCount = 0 }: { project: Project; agents: Agent[]; mcpServerCount?: number }) {
  return (
    <Card className="mt-2">
      <CardContent className="p-0">
        <ScrollArea className="max-h-64">
          <div className="p-3 space-y-1 font-mono text-xs">
            {mcpServerCount > 0 && (
              <TreeLine depth={0} icon={<Server className="h-3 w-3" />} label=".mcp.json" />
            )}
            <TreeLine depth={0} icon={<FolderOpen className="h-3 w-3" />} label=".claude/" />
            {project.claudeMdContent && (
              <TreeLine depth={1} icon={<FileText className="h-3 w-3" />} label="CLAUDE.md" />
            )}
            <TreeLine depth={1} icon={<FolderOpen className="h-3 w-3" />} label="agents/" />
            {agents.map((agent) => (
              <TreeLine
                key={agent.id}
                depth={2}
                icon={<FileText className="h-3 w-3" />}
                label={`${agent.name.toLowerCase().replace(/\s+/g, "-")}.md`}
              />
            ))}
            <TreeLine depth={1} icon={<FolderOpen className="h-3 w-3" />} label="commands/" />
            <TreeLine depth={1} icon={<FolderOpen className="h-3 w-3" />} label="skills/" />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function CliCommand({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const command = `npx agent-maker install ${window.location.origin}/api/projects/${projectId}/export?format=json`;

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 bg-muted p-3 rounded-md text-xs font-mono overflow-auto">
        {command}
      </code>
      <Button variant="outline" size="icon" onClick={handleCopy} data-testid="button-copy-cli">
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}

function TreeLine({
  depth,
  icon,
  label,
}: {
  depth: number;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5 text-muted-foreground py-0.5"
      style={{ paddingLeft: `${depth * 16}px` }}
    >
      {icon}
      <span>{label}</span>
    </div>
  );
}
