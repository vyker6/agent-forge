import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Bot, Sparkles, ArrowRight, MessageSquarePlus, Layout, PenTool } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "agentMaker.onboardingComplete";

export function OnboardingDialog() {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

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
                Build specialized AI assistants for Claude Code — no coding required.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <ConceptCard
                icon={Bot}
                title="Agents"
                description="Specialized AI assistants, each focused on a specific task like reviewing code or writing tests."
              />
              <ConceptCard
                icon={Sparkles}
                title="Skills"
                description="Reusable abilities you teach an agent — like 'security-scan' or 'generate-docs'."
              />
              <ConceptCard
                icon={PenTool}
                title="Commands"
                description="Shortcuts you can type, like /review or /test, to trigger specific actions."
              />
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <Button onClick={() => setStep(1)}>
                How do I start?
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button variant="ghost" onClick={dismiss}>
                Skip — I'll explore on my own
              </Button>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle>How would you like to start?</DialogTitle>
              <DialogDescription>
                Choose the approach that fits your comfort level.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 mt-4">
              <StartOption
                icon={MessageSquarePlus}
                title="Describe what you need"
                description="Tell us in plain language and we'll generate an agent for you."
                badge="Best for beginners"
                onClick={() => { dismiss(); navigate("/build"); }}
              />
              <StartOption
                icon={Layout}
                title="Start from a template"
                description="Pick a pre-built agent set and customize it."
                onClick={() => { dismiss(); navigate("/templates"); }}
              />
              <StartOption
                icon={PenTool}
                title="Build from scratch"
                description="Full control — configure every detail yourself."
                onClick={() => { dismiss(); navigate("/agents/new"); }}
              />
            </div>
            <Button variant="ghost" className="mt-2 w-full" onClick={dismiss}>
              Explore on my own
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ConceptCard({ icon: Icon, title, description }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function StartOption({ icon: Icon, title, description, badge, onClick }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-3 w-full p-3 rounded-lg border text-left text-sm transition-colors hover:bg-accent"
    >
      <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">{title}</p>
          {badge && (
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 mt-2" />
    </button>
  );
}
