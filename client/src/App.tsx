import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { OnboardingDialog, ONBOARDING_STORAGE_KEY } from "@/components/onboarding-dialog";
import NotFound from "@/pages/not-found";
import AgentsPage from "@/pages/agents";
import AgentEditorPage from "@/pages/agent-editor";
import ProjectsPage from "@/pages/projects";
import ProjectEditorPage from "@/pages/project-editor";
import DeployPage from "@/pages/deploy";
import ImportPage from "@/pages/import";
import TemplatesPage from "@/pages/templates";
import AgentBuilderPage from "@/pages/agent-builder";

function WelcomeRedirect() {
  const { data: aiStatus, isLoading } = useQuery<{ available: boolean }>({
    queryKey: ["/api/ai/status"],
  });

  if (isLoading) return null;

  const onboardingDone = localStorage.getItem(ONBOARDING_STORAGE_KEY);
  if (!onboardingDone && aiStatus?.available) {
    return <Redirect to="/build" />;
  }

  return <AgentsPage />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={WelcomeRedirect} />
      <Route path="/agents" component={AgentsPage} />
      <Route path="/agents/:id" component={AgentEditorPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/projects/:id" component={ProjectEditorPage} />
      <Route path="/import" component={ImportPage} />
      <Route path="/templates" component={TemplatesPage} />
      <Route path="/deploy" component={DeployPage} />
      <Route path="/build" component={AgentBuilderPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 min-w-0">
                <header className="flex items-center justify-between gap-2 p-2 border-b sticky top-0 z-50 bg-background">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <OnboardingDialog />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
