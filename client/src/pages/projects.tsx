import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Plus, FolderOpen, Trash2, MoreVertical, Bot, ChevronRight, Upload } from "lucide-react";
import type { Agent, Project, ProjectAgent } from "@shared/schema";
import { AgentIcon } from "@/components/agent-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ProjectsPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [showNew, setShowNew] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "", claudeMdContent: "" });

  const { data: projects, isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newProject) => {
      const res = await apiRequest("POST", "/api/projects", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowNew(false);
      setNewProject({ name: "", description: "", claudeMdContent: "" });
      toast({ title: "Project created" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: "Project deleted" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-projects-title">
            Projects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bundle agents into deployable project configurations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/import")} data-testid="button-import-project">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setShowNew(true)} data-testid="button-create-project">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </div>
      </div>

      {showNew && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Project Name</Label>
                <Input
                  value={newProject.name}
                  onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))}
                  placeholder="My Web App"
                  data-testid="input-project-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newProject.description}
                  onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))}
                  placeholder="A brief project description"
                  data-testid="input-project-description"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>CLAUDE.md Content (optional)</Label>
              <Textarea
                value={newProject.claudeMdContent}
                onChange={(e) => setNewProject((p) => ({ ...p, claudeMdContent: e.target.value }))}
                placeholder="# Project Overview&#10;&#10;Describe your project architecture, conventions, and workflows..."
                className="min-h-[100px] font-mono text-sm"
                data-testid="textarea-claude-md"
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowNew(false)} data-testid="button-cancel-project">
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate(newProject)}
                disabled={!newProject.name.trim() || createMutation.isPending}
                data-testid="button-save-project"
              >
                Create Project
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {projects && projects.length === 0 && !showNew ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <FolderOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="text-center">
              <h3 className="font-medium">No projects yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create a project to bundle your agents together
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects?.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              agents={agents}
              onDelete={() => deleteMutation.mutate(project.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({
  project,
  agents,
  onDelete,
}: {
  project: Project;
  agents: Agent[];
  onDelete: () => void;
}) {
  const { toast } = useToast();

  const { data: projectAgents = [] } = useQuery<ProjectAgent[]>({
    queryKey: ["/api/projects", project.id, "agents"],
  });

  const assignedAgentIds = projectAgents.map((pa) => pa.agentId);
  const assignedAgents = agents.filter((a) => assignedAgentIds.includes(a.id));

  const toggleAgentMutation = useMutation({
    mutationFn: async ({ agentId, assigned }: { agentId: string; assigned: boolean }) => {
      if (assigned) {
        await apiRequest("DELETE", `/api/projects/${project.id}/agents/${agentId}`);
      } else {
        await apiRequest("POST", `/api/projects/${project.id}/agents`, { agentId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", project.id, "agents"] });
    },
  });

  const [, navigate] = useLocation();

  return (
    <Card className="hover-elevate cursor-pointer" data-testid={`card-project-${project.id}`} onClick={() => navigate(`/projects/${project.id}`)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center shrink-0">
              <FolderOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium" data-testid={`text-project-name-${project.id}`}>
                {project.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {project.description || "No description"}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()} data-testid={`button-project-menu-${project.id}`}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                data-testid={`button-delete-project-${project.id}`}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Assigned Agents</p>
          <div className="flex flex-wrap gap-1.5">
            {assignedAgents.length === 0 ? (
              <p className="text-xs text-muted-foreground">None assigned</p>
            ) : (
              assignedAgents.map((agent) => (
                <Badge key={agent.id} variant="secondary" className="text-[10px] gap-1">
                  <AgentIcon icon={agent.icon} color={agent.color} size="sm" className="p-0" />
                  {agent.name}
                </Badge>
              ))
            )}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full" data-testid={`button-manage-agents-${project.id}`}>
                <Bot className="h-3.5 w-3.5 mr-1.5" />
                Manage Agents
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Assign Agents to {project.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 mt-2">
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
                          toggleAgentMutation.mutate({
                            agentId: agent.id,
                            assigned: isAssigned,
                          })
                        }
                        data-testid={`toggle-agent-${agent.id}-project-${project.id}`}
                      >
                        <Checkbox checked={isAssigned} />
                        <AgentIcon icon={agent.icon} color={agent.color} size="sm" className="p-1" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{agent.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {agent.description}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
