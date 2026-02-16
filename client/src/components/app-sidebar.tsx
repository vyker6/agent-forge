import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Bot, FolderOpen, Rocket, Plus, Upload, Sparkles, RotateCcw, Star, Wand2, Settings2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Agent } from "@shared/schema";
import { AgentIcon } from "@/components/agent-icon";
import { resetOnboarding } from "@/components/onboarding-dialog";
import { popularAgents } from "@/data/popular-agents";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const [location] = useLocation();
  const [agentTab, setAgentTab] = useState<"my" | "popular">("my");

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-md bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">Agent Maker</span>
            <span className="text-[10px] text-muted-foreground font-mono">for Claude Code</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Agents</SidebarGroupLabel>
          <SidebarGroupAction asChild>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" data-testid="button-new-agent-sidebar">
                  <Plus className="h-4 w-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="w-52 p-1">
                <Link
                  href="/build"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                  data-testid="link-guided-creation"
                >
                  <Wand2 className="h-4 w-4 text-primary" />
                  <div>
                    <div className="font-medium">Guided Creation</div>
                    <div className="text-[11px] text-muted-foreground">Step-by-step wizard</div>
                  </div>
                </Link>
                <Link
                  href="/agents/new"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
                  data-testid="link-advanced-editor"
                >
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Advanced Editor</div>
                    <div className="text-[11px] text-muted-foreground">Full manual control</div>
                  </div>
                </Link>
              </PopoverContent>
            </Popover>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <div className="flex gap-1 px-2 mb-1">
              <button
                type="button"
                onClick={() => setAgentTab("my")}
                className={`flex-1 text-[11px] py-1 rounded-md transition-colors ${
                  agentTab === "my"
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-my-agents"
              >
                My Agents
              </button>
              <button
                type="button"
                onClick={() => setAgentTab("popular")}
                className={`flex-1 text-[11px] py-1 rounded-md transition-colors ${
                  agentTab === "popular"
                    ? "bg-accent text-accent-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-testid="tab-popular-agents"
              >
                Popular
              </button>
            </div>
            <SidebarMenu>
              {agentTab === "my" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={location === "/" || location === "/agents"}
                      tooltip="All Agents"
                    >
                      <Link href="/" data-testid="link-agents-list">
                        <Bot className="h-4 w-4" />
                        <span>All Agents</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {agents.map((agent) => (
                    <SidebarMenuItem key={agent.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === `/agents/${agent.id}`}
                        tooltip={agent.name}
                      >
                        <Link href={`/agents/${agent.id}`} data-testid={`link-agent-${agent.id}`}>
                          <AgentIcon icon={agent.icon} color={agent.color} size="sm" className="p-0.5" />
                          <span>{agent.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </>
              )}
              {agentTab === "popular" && (
                <>
                  {popularAgents.slice(0, 10).map((agent) => (
                    <SidebarMenuItem key={agent.name}>
                      <SidebarMenuButton
                        asChild
                        tooltip={agent.description}
                      >
                        <Link href={`/templates?agent=${encodeURIComponent(agent.name)}`} data-testid={`link-popular-${agent.name.toLowerCase().replace(/\s+/g, "-")}`}>
                          <AgentIcon icon={agent.icon} color={agent.color} size="sm" className="p-0.5" />
                          <span className="truncate">{agent.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="View all popular agents">
                      <Link href="/templates" data-testid="link-view-all-popular">
                        <Star className="h-4 w-4" />
                        <span className="text-muted-foreground">View all...</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/projects"}
                  tooltip="Projects"
                >
                  <Link href="/projects" data-testid="link-projects">
                    <FolderOpen className="h-4 w-4" />
                    <span>Projects</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/import"}
                  tooltip="Import"
                >
                  <Link href="/import" data-testid="link-import">
                    <Upload className="h-4 w-4" />
                    <span>Import</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/templates"}
                  tooltip="Templates"
                >
                  <Link href="/templates" data-testid="link-templates">
                    <Sparkles className="h-4 w-4" />
                    <span>Templates</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location.startsWith("/deploy")}
                  tooltip="Deploy"
                >
                  <Link href="/deploy" data-testid="link-deploy">
                    <Rocket className="h-4 w-4" />
                    <span>Deploy</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-1 flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground font-mono">
            v1.0 &middot; Claude Code Agent Builder
          </p>
          <button
            type="button"
            onClick={() => {
              resetOnboarding();
              window.location.reload();
            }}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-reset-tour"
          >
            <RotateCcw className="h-3 w-3" />
            Reset tour
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
