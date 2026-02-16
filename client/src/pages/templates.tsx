import { useState } from "react";
import { useLocation } from "wouter";
import { Sparkles, Bot, Puzzle, Terminal as TerminalIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { templates, TEMPLATE_CATEGORIES, type Template } from "@/data/templates";

export default function TemplatesPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [category, setCategory] = useState<string>("All");
  const [importingId, setImportingId] = useState<string | null>(null);

  const filtered = category === "All"
    ? templates
    : templates.filter((t) => t.category === category);

  const handleUseTemplate = async (template: Template) => {
    setImportingId(template.id);
    try {
      // Create project
      const projectRes = await apiRequest("POST", "/api/projects", {
        name: template.name,
        description: template.description,
      });
      const project = await projectRes.json();

      // Create agents and add to project
      for (const agentDef of template.agents) {
        const { skills, commands, ...agentData } = agentDef;
        const agentRes = await apiRequest("POST", "/api/agents", agentData);
        const agent = await agentRes.json();

        // Add to project
        await apiRequest("POST", `/api/projects/${project.id}/agents`, {
          agentId: agent.id,
        });

        // Create skills
        for (const skill of skills) {
          await apiRequest("POST", `/api/agents/${agent.id}/skills`, skill);
        }

        // Create commands
        for (const cmd of commands) {
          await apiRequest("POST", `/api/agents/${agent.id}/commands`, cmd);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });

      toast({
        title: "Template imported",
        description: `"${template.name}" project created with ${template.agents.length} agent${template.agents.length !== 1 ? "s" : ""}`,
      });

      navigate(`/projects/${project.id}`);
    } catch (err) {
      toast({
        title: "Import failed",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setImportingId(null);
    }
  };

  const totalSkills = (t: Template) => t.agents.reduce((n, a) => n + a.skills.length, 0);
  const totalCommands = (t: Template) => t.agents.reduce((n, a) => n + a.commands.length, 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-templates-title">
          Templates
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Start with a curated set of agents, skills, and commands
        </p>
      </div>

      <Tabs value={category} onValueChange={setCategory}>
        <TabsList>
          {TEMPLATE_CATEGORIES.map((cat) => (
            <TabsTrigger key={cat} value={cat} data-testid={`tab-category-${cat.toLowerCase()}`}>
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
            <div className="text-center">
              <h3 className="font-medium">No templates in this category</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Try a different category or describe what you need to build one from scratch
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((template) => (
          <Card key={template.id} data-testid={`card-template-${template.id}`}>
            <CardContent className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{template.name}</h3>
                    <Badge variant="secondary" className="mt-1 text-[10px]">
                      {template.category}
                    </Badge>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {template.description}
              </p>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Bot className="h-3.5 w-3.5" />
                  {template.agents.length} agent{template.agents.length !== 1 ? "s" : ""}
                </span>
                {totalSkills(template) > 0 && (
                  <span className="flex items-center gap-1">
                    <Puzzle className="h-3.5 w-3.5" />
                    {totalSkills(template)} skill{totalSkills(template) !== 1 ? "s" : ""}
                  </span>
                )}
                {totalCommands(template) > 0 && (
                  <span className="flex items-center gap-1">
                    <TerminalIcon className="h-3.5 w-3.5" />
                    {totalCommands(template)} command{totalCommands(template) !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5">
                {template.agents.map((agent) => (
                  <Badge key={agent.name} variant="outline" className="text-[10px]">
                    {agent.name}
                  </Badge>
                ))}
              </div>

              <Button
                className="w-full"
                onClick={() => handleUseTemplate(template)}
                disabled={importingId === template.id}
                data-testid={`button-use-template-${template.id}`}
              >
                {importingId === template.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Use Template
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
