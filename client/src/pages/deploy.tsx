import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Rocket, Download, Bot, CheckCircle2,
  Terminal as TerminalIcon,
  AlertCircle, Package, Copy
} from "lucide-react";
import type { Agent, Skill, Command, FileMapEntry, Project, ProjectAgent, McpServer, Rule, ProjectSettings, Hook } from "@shared/schema";
import { AgentIcon } from "@/components/agent-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { InteractiveFileTree } from "@/components/interactive-file-tree";
import { MarkdownPreview } from "@/components/markdown-preview";
import { buildExportFiles } from "@/lib/generate-markdown";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export default function DeployPage() {
  const { toast } = useToast();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [selectedFilePath, setSelectedFilePath] = useState<string>("");
  const [selectedFileContent, setSelectedFileContent] = useState<string>("");

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

  const { data: rules = [] } = useQuery<Rule[]>({
    queryKey: ["/api/projects", selectedProjectId, "rules"],
    enabled: !!selectedProjectId,
  });

  const { data: projectSettings } = useQuery<ProjectSettings | null>({
    queryKey: ["/api/projects", selectedProjectId, "settings"],
    enabled: !!selectedProjectId,
  });

  const { data: projectHooks = [] } = useQuery<Hook[]>({
    queryKey: ["/api/projects", selectedProjectId, "hooks"],
    enabled: !!selectedProjectId,
  });

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const assignedAgentIds = projectAgents.map((pa) => pa.agentId);
  const assignedAgents = agents.filter((a) => assignedAgentIds.includes(a.id));

  // Fetch all agent details (skills, commands, file maps) in one query
  const agentIdsKey = assignedAgentIds.sort().join(",");
  const { data: agentDetails = [] } = useQuery<
    Array<{ agent: Agent; skills: Skill[]; commands: Command[]; fileMap: FileMapEntry[] }>
  >({
    queryKey: ["/api/agent-details-batch", agentIdsKey],
    queryFn: async () => {
      const results = [];
      for (const agent of assignedAgents) {
        const [skillsRes, commandsRes, fileMapRes] = await Promise.all([
          fetch(`/api/agents/${agent.id}/skills`, { credentials: "include" }),
          fetch(`/api/agents/${agent.id}/commands`, { credentials: "include" }),
          fetch(`/api/agents/${agent.id}/file-map`, { credentials: "include" }),
        ]);
        results.push({
          agent,
          skills: skillsRes.ok ? await skillsRes.json() as Skill[] : [],
          commands: commandsRes.ok ? await commandsRes.json() as Command[] : [],
          fileMap: fileMapRes.ok ? await fileMapRes.json() as FileMapEntry[] : [],
        });
      }
      return results;
    },
    enabled: assignedAgents.length > 0,
  });

  const exportFiles = useMemo(() => {
    if (!selectedProject || agentDetails.length === 0) return {};

    return buildExportFiles(
      selectedProject,
      agentDetails,
      rules,
      projectSettings ?? null,
      projectHooks,
      mcpServers
    );
  }, [selectedProject, agentDetails, rules, projectSettings, projectHooks, mcpServers]);

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

  const handleFileSelect = (path: string, content: string) => {
    setSelectedFilePath(path);
    setSelectedFileContent(content);
  };

  if (projectsLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const fileCount = Object.keys(exportFiles).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-deploy-title">
          Download & Install
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Download your agents as ready-to-install configuration files
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
            <Select value={selectedProjectId} onValueChange={(v) => { setSelectedProjectId(v); setSelectedFilePath(""); setSelectedFileContent(""); }}>
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

              {fileCount > 0 && (
                <div className="border rounded-lg overflow-hidden" style={{ height: "420px" }}>
                  <ResizablePanelGroup direction="horizontal">
                    <ResizablePanel defaultSize={35} minSize={20}>
                      <InteractiveFileTree
                        files={exportFiles}
                        selectedPath={selectedFilePath}
                        onSelect={handleFileSelect}
                        className="h-full"
                      />
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={65} minSize={30}>
                      <div className="h-full overflow-auto">
                        {selectedFilePath ? (
                          selectedFilePath.endsWith(".json") ? (
                            <div className="p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-mono text-muted-foreground">{selectedFilePath}</span>
                              </div>
                              <pre className="text-xs font-mono whitespace-pre-wrap break-words bg-muted p-3 rounded-md">
                                {selectedFileContent}
                              </pre>
                            </div>
                          ) : (
                            <div className="p-4">
                              <MarkdownPreview
                                content={selectedFileContent}
                                filename={selectedFilePath}
                              />
                            </div>
                          )
                        ) : (
                          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                            Select a file to preview its contents
                          </div>
                        )}
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </div>
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
                <h3 className="font-semibold">Quick Install</h3>
                <p className="text-sm text-muted-foreground">
                  Run this command from your project root to download and install
                </p>
              </div>
            </div>
            <QuickInstallCommand projectId={selectedProjectId} />
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
              Unzip the file into your project's main folder
            </Step>
            <Step number={3} title="Start Claude Code">
              The agents, skills, and commands will be automatically discovered
            </Step>
            <Step number={4} title="Use your agents">
              Use agents by typing @agent-name, run shortcuts with /command-name
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

function QuickInstallCommand({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const command = `curl -L ${window.location.origin}/api/projects/${projectId}/export -o project-config.zip && unzip project-config.zip -d .`;

  const handleCopy = () => {
    navigator.clipboard.writeText(command);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="flex items-center gap-2">
      <code className="flex-1 bg-muted p-3 rounded-md text-xs font-mono overflow-auto whitespace-pre-wrap break-all">
        {command}
      </code>
      <Button variant="outline" size="icon" onClick={handleCopy} data-testid="button-copy-cli">
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}
