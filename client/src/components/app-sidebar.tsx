import { useLocation, Link } from "wouter";
import { Bot, FolderOpen, Rocket, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { Agent } from "@shared/schema";
import { AgentIcon } from "@/components/agent-icon";
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
            <Link href="/agents/new" data-testid="button-new-agent-sidebar">
              <Plus className="h-4 w-4" />
            </Link>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
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
        <div className="px-2 py-1">
          <p className="text-[10px] text-muted-foreground font-mono">
            v1.0 &middot; Claude Code Agent Builder
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
