import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, MoreVertical, Trash2, Copy, MessageSquarePlus, Heart, Download } from "lucide-react";
import type { Agent } from "@shared/schema";
import { AVAILABLE_MODELS, MEMORY_SCOPES } from "@shared/schema";
import { AgentIcon } from "@/components/agent-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getClientId } from "@/lib/client-id";

export default function AgentsPage() {
  const { toast } = useToast();

  const { data: agents, isLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: aiStatus } = useQuery<{ available: boolean }>({
    queryKey: ["/api/ai/status"],
  });

  const { data: likeCounts = {} } = useQuery<Record<string, number>>({
    queryKey: ["/api/likes"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/agents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({ title: "Agent deleted" });
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/agents/${id}/duplicate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({ title: "Agent duplicated" });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const res = await fetch(`/api/agents/${agentId}/like`, {
        method: "POST",
        headers: { "X-Client-Id": getClientId() },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Like failed");
      return res.json() as Promise<{ liked: boolean; count: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/likes"] });
    },
  });

  const handleDownloadZip = async (agent: Agent) => {
    const slug = agent.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    try {
      const response = await fetch(`/api/agents/${agent.id}/download`, { credentials: "include" });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}-agent.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Agent ZIP downloaded" });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">
            Agents
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your AI assistants — each one specialized for a different task
          </p>
        </div>
        <Button asChild data-testid="button-create-agent">
          <Link href="/build">
            <Plus className="h-4 w-4 mr-2" />
            New Agent
          </Link>
        </Button>
      </div>

      {agents && agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              {aiStatus?.available ? (
                <MessageSquarePlus className="h-7 w-7 text-muted-foreground" />
              ) : (
                <Plus className="h-7 w-7 text-muted-foreground" />
              )}
            </div>
            <div className="text-center">
              <h3 className="font-medium">No agents yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {aiStatus?.available
                  ? "Describe what you need and we'll build your first agent with AI"
                  : "Create your first agent to get started"}
              </p>
            </div>
            {aiStatus?.available ? (
              <>
                <Button asChild data-testid="button-create-first-agent">
                  <Link href="/build">
                    <MessageSquarePlus className="h-4 w-4 mr-2" />
                    Build with AI
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/agents/new">
                    or build from scratch
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild variant="outline" data-testid="button-create-first-agent">
                <Link href="/agents/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Agent
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents?.map((agent) => {
            const modelLabel = AVAILABLE_MODELS.find((m) => m.value === agent.model)?.label || agent.model;
            const likeCount = likeCounts[agent.id] ?? 0;
            return (
              <Card key={agent.id} className="group hover-elevate" data-testid={`card-agent-${agent.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/agents/${agent.id}`} className="flex items-start gap-3 flex-1 min-w-0">
                      <AgentIcon
                        icon={agent.icon}
                        color={agent.color}
                        size="lg"
                        className="p-2 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium truncate" data-testid={`text-agent-name-${agent.id}`}>
                          {agent.name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {agent.description || "No description"}
                        </p>
                      </div>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ visibility: "visible" }}
                          data-testid={`button-agent-menu-${agent.id}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => duplicateMutation.mutate(agent.id)}
                          data-testid={`button-duplicate-agent-${agent.id}`}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(agent.id)}
                          data-testid={`button-delete-agent-${agent.id}`}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    <Badge variant="secondary" className="text-[10px]">
                      {modelLabel}
                    </Badge>
                    {agent.tools.length > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        {agent.tools.length} tool{agent.tools.length !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      {MEMORY_SCOPES.find((s) => s.value === agent.memoryScope)?.label ?? agent.memoryScope}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => likeMutation.mutate(agent.id)}
                      data-testid={`button-like-${agent.id}`}
                    >
                      <Heart className="h-3.5 w-3.5" />
                      <span>{likeCount > 0 ? likeCount : ""}</span>
                    </button>
                    <button
                      type="button"
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded"
                      onClick={() => handleDownloadZip(agent)}
                      title="Download agent"
                      data-testid={`button-download-${agent.id}`}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
