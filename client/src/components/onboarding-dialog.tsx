import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Bot, Sparkles, ArrowRight, Code, Server, Terminal as TerminalIcon, FileText, Settings, Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { templates } from "@/data/templates";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "agentMaker.onboardingComplete";

const PROJECT_TYPES = [
  { id: "webapp", label: "Web App", icon: Code, categories: ["Development"] },
  { id: "api", label: "API / Backend", icon: Server, categories: ["Development", "Security"] },
  { id: "cli", label: "CLI Tool", icon: TerminalIcon, categories: ["Development"] },
  { id: "devops", label: "DevOps", icon: Layers, categories: ["DevOps"] },
  { id: "docs", label: "Documentation", icon: FileText, categories: ["Documentation"] },
  { id: "other", label: "Other", icon: Settings, categories: ["Development", "Migration"] },
] as const;

export function OnboardingDialog() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedType, setSelectedType] = useState<string>("");
  const [importing, setImporting] = useState<string | null>(null);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
  };

  const selectedProjectType = PROJECT_TYPES.find((t) => t.id === selectedType);
  const suggestedTemplates = selectedProjectType
    ? templates.filter((t) =>
        (selectedProjectType.categories as readonly string[]).includes(t.category)
      ).slice(0, 3)
    : templates.slice(0, 3);

  const handleUseTemplate = async (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    setImporting(templateId);
    try {
      const projectRes = await apiRequest("POST", "/api/projects", {
        name: template.name,
        description: template.description,
      });
      const project = await projectRes.json();

      for (const agentDef of template.agents) {
        const { skills, commands, ...agentData } = agentDef;
        const agentRes = await apiRequest("POST", "/api/agents", agentData);
        const agent = await agentRes.json();

        await apiRequest("POST", `/api/projects/${project.id}/agents`, {
          agentId: agent.id,
        });

        for (const skill of skills) {
          await apiRequest("POST", `/api/agents/${agent.id}/skills`, skill);
        }
        for (const cmd of commands) {
          await apiRequest("POST", `/api/agents/${agent.id}/commands`, cmd);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });

      toast({
        title: "Template imported",
        description: `"${template.name}" project created`,
      });

      dismiss();
      navigate(`/projects/${project.id}`);
    } catch (err) {
      toast({
        title: "Import failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setImporting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent className="sm:max-w-md">
        {step === 0 && (
          <>
            <DialogHeader>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
              </div>
              <DialogTitle className="text-center text-xl">Welcome to Agent Maker</DialogTitle>
              <DialogDescription className="text-center">
                Build custom agents, skills, and commands for Claude Code.
                Export them as ready-to-use configuration files.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2 mt-4">
              <Button onClick={() => setStep(1)}>
                Get Started
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="ghost" onClick={dismiss}>
                Skip — explore on my own
              </Button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>What are you building?</DialogTitle>
              <DialogDescription>
                We'll suggest templates that match your project type.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {PROJECT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => { setSelectedType(type.id); setStep(2); }}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border text-left text-sm transition-colors hover:bg-accent ${
                      selectedType === type.id ? "border-primary bg-accent" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    {type.label}
                  </button>
                );
              })}
            </div>
            <Button variant="ghost" className="mt-2" onClick={dismiss}>
              Skip
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle>Suggested Templates</DialogTitle>
              <DialogDescription>
                Start with a pre-built template or create from scratch.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-4">
              {suggestedTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  disabled={importing === template.id}
                  onClick={() => handleUseTemplate(template.id)}
                  className="flex items-center gap-3 w-full p-3 rounded-lg border text-left text-sm transition-colors hover:bg-accent disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{template.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {template.agents.length} agent{template.agents.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {importing === template.id ? (
                    <span className="text-xs text-muted-foreground">Importing...</span>
                  ) : (
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <Button variant="outline" onClick={() => { dismiss(); navigate("/agents/new"); }}>
                Create blank project
              </Button>
              <Button variant="ghost" onClick={dismiss}>
                Explore on my own
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
