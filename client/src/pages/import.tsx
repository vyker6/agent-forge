import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Upload, FileArchive, FileText, ArrowLeft, CheckCircle2,
  AlertTriangle, Bot, Zap, Terminal, ScrollText, Settings, Webhook, Server,
} from "lucide-react";
import type { Agent, Project } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ImportResult {
  project: { id: string; name: string };
  agents: { name: string; id: string }[];
  skills: { name: string; agentName: string }[];
  commands: { name: string; agentName: string }[];
  rules: { name: string }[];
  settings: boolean;
  hooks: number;
  mcpServers: number;
  warnings: string[];
}

interface MarkdownImportResult {
  success: boolean;
  name: string;
  warnings: string[];
}

export default function ImportPage() {
  const [, navigate] = useLocation();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/projects")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Import Configuration</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Import agents, skills, and settings from a .claude/ directory export
          </p>
        </div>
      </div>

      <Tabs defaultValue="zip">
        <TabsList>
          <TabsTrigger value="zip">
            <FileArchive className="h-4 w-4 mr-2" />
            ZIP Upload
          </TabsTrigger>
          <TabsTrigger value="markdown">
            <FileText className="h-4 w-4 mr-2" />
            Markdown Paste
          </TabsTrigger>
        </TabsList>

        <TabsContent value="zip" className="mt-4">
          <ZipImportTab />
        </TabsContent>
        <TabsContent value="markdown" className="mt-4">
          <MarkdownImportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ZipImportTab() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [projectName, setProjectName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const importMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("No file selected");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("projectName", projectName || "Imported Project");

      const res = await fetch("/api/projects/import", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Import failed");
      }
      return res.json() as Promise<ImportResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      toast({ title: "Import successful", description: `Project "${data.project.name}" created` });
    },
    onError: (err) => {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    },
  });

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".zip")) {
      setFile(droppedFile);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  if (result) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Import Complete</h3>
                <p className="text-sm text-muted-foreground">
                  Project "{result.project.name}" has been created
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <ResultStat icon={Bot} label="Agents" count={result.agents.length} />
              <ResultStat icon={Zap} label="Skills" count={result.skills.length} />
              <ResultStat icon={Terminal} label="Commands" count={result.commands.length} />
              <ResultStat icon={ScrollText} label="Rules" count={result.rules.length} />
              <ResultStat icon={Settings} label="Settings" count={result.settings ? 1 : 0} />
              <ResultStat icon={Webhook} label="Hooks" count={result.hooks} />
              <ResultStat icon={Server} label="MCP Servers" count={result.mcpServers} />
            </div>

            {result.warnings.length > 0 && (
              <div className="mt-6 p-4 rounded-md bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Warnings</span>
                </div>
                <ul className="space-y-1">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-muted-foreground">{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={() => navigate(`/projects/${result.project.id}`)}>
            Open Project
          </Button>
          <Button variant="outline" onClick={() => { setResult(null); setFile(null); }}>
            Import Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>Project Name</Label>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="My Imported Project"
              data-testid="input-import-project-name"
            />
          </div>

          <div className="space-y-2">
            <Label>ZIP File</Label>
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : file
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                accept=".zip"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setFile(f);
                }}
                data-testid="input-import-file"
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileArchive className="h-8 w-8 text-green-500" />
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">Drop a ZIP file here or click to browse</p>
                  <p className="text-xs text-muted-foreground">
                    Accepts exported .claude/ directory ZIP files
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => importMutation.mutate()}
              disabled={!file || importMutation.isPending}
              data-testid="button-import-zip"
            >
              {importMutation.isPending ? "Importing..." : "Import"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-medium mb-2">Expected ZIP Structure</h4>
          <pre className="text-xs text-muted-foreground font-mono bg-muted p-3 rounded-md">
{`.claude/
  CLAUDE.md
  settings.json
  agents/
    my-agent.md
  skills/
    my-skill/
      SKILL.md
  commands/
    my-command.md
  rules/
    my-rule.md`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

function MarkdownImportTab() {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [fileType, setFileType] = useState<string>("agent");
  const [projectId, setProjectId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [result, setResult] = useState<MarkdownImportResult | null>(null);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/projects/import/markdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, fileType, projectId, agentId: agentId || undefined }),
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Import failed");
      }
      return res.json() as Promise<MarkdownImportResult>;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({ title: data.success ? "Imported successfully" : "Import had issues", description: data.name });
    },
    onError: (err) => {
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    },
  });

  const needsAgent = fileType === "skill" || fileType === "command";

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={fileType} onValueChange={setFileType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agent">Agent</SelectItem>
                  <SelectItem value="skill">Skill</SelectItem>
                  <SelectItem value="command">Command</SelectItem>
                  <SelectItem value="rule">Rule</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {needsAgent && (
              <div className="space-y-2">
                <Label>Agent</Label>
                <Select value={agentId} onValueChange={setAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select agent" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Markdown Content</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`---\nname: my-${fileType}\ndescription: A description\n---\n\nContent goes here...`}
              className="min-h-[300px] font-mono text-sm"
              data-testid="textarea-import-markdown"
            />
          </div>

          {result && (
            <div className={`p-4 rounded-md border ${
              result.success ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"
            }`}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {result.success ? `Imported "${result.name}"` : "Import failed"}
                </span>
              </div>
              {result.warnings.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {result.warnings.map((w, i) => (
                    <li key={i} className="text-xs text-muted-foreground">{w}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => importMutation.mutate()}
              disabled={!content.trim() || !projectId || (needsAgent && !agentId) || importMutation.isPending}
              data-testid="button-import-markdown"
            >
              {importMutation.isPending ? "Importing..." : "Import"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-medium mb-2">Frontmatter Reference</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Badge variant="secondary" className="mb-1">Agent</Badge>
              <pre className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded-md">
{`---
name: my-agent
description: Agent description
model: sonnet
tools: Read, Write, Bash
permissionMode: acceptEdits
maxTurns: 20
---`}
              </pre>
            </div>
            <div>
              <Badge variant="secondary" className="mb-1">Skill</Badge>
              <pre className="text-xs text-muted-foreground font-mono bg-muted p-2 rounded-md">
{`---
name: my-skill
description: Skill description
context: fork
allowed-tools: Read, Grep
argument-hint: "[file-path]"
---`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ResultStat({
  icon: Icon,
  label,
  count,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-md bg-muted/50">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-lg font-semibold">{count}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
