import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, Eye, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MarkdownPreviewProps {
  content: string;
  filename?: string;
  className?: string;
}

export function MarkdownPreview({ content, filename, className }: MarkdownPreviewProps) {
  const [mode, setMode] = useState<"rendered" | "raw">("rendered");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          {filename && (
            <span className="text-xs font-mono text-muted-foreground">{filename}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={mode === "rendered" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setMode("rendered")}
          >
            <Eye className="h-3 w-3 mr-1" />
            Rendered
          </Button>
          <Button
            variant={mode === "raw" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setMode("raw")}
          >
            <Code className="h-3 w-3 mr-1" />
            Raw
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>
      <div className="p-4 overflow-auto max-h-[600px]">
        {mode === "rendered" ? (
          <div className="prose dark:prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        ) : (
          <pre className="text-xs font-mono whitespace-pre-wrap break-words text-muted-foreground">
            {content}
          </pre>
        )}
      </div>
    </div>
  );
}
