import { useState, useMemo } from "react";
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TreeNode {
  name: string;
  path: string;
  isDir: boolean;
  children: TreeNode[];
}

function buildTree(files: Record<string, string>): TreeNode[] {
  const root: TreeNode[] = [];

  for (const filePath of Object.keys(files).sort()) {
    const parts = filePath.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");

      let existing = current.find((n) => n.name === part);
      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          isDir: !isLast,
          children: [],
        };
        current.push(existing);
      }
      current = existing.children;
    }
  }

  return root;
}

interface InteractiveFileTreeProps {
  files: Record<string, string>;
  selectedPath?: string;
  onSelect: (path: string, content: string) => void;
  className?: string;
}

export function InteractiveFileTree({ files, selectedPath, onSelect, className }: InteractiveFileTreeProps) {
  const tree = useMemo(() => buildTree(files), [files]);
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const dirs = new Set<string>();
    for (const path of Object.keys(files)) {
      const parts = path.split("/");
      for (let i = 1; i < parts.length; i++) {
        dirs.add(parts.slice(0, i).join("/"));
      }
    }
    return dirs;
  });

  const toggleDir = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const expandAll = () => {
    const dirs = new Set<string>();
    for (const path of Object.keys(files)) {
      const parts = path.split("/");
      for (let i = 1; i < parts.length; i++) {
        dirs.add(parts.slice(0, i).join("/"));
      }
    }
    setExpanded(dirs);
  };

  const collapseAll = () => {
    setExpanded(new Set());
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex items-center justify-end gap-1 px-2 py-1 border-b">
        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={expandAll}>
          Expand All
        </Button>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={collapseAll}>
          Collapse All
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-2 space-y-0.5">
        {tree.map((node) => (
          <TreeNodeItem
            key={node.path}
            node={node}
            depth={0}
            expanded={expanded}
            toggleDir={toggleDir}
            selectedPath={selectedPath}
            onSelect={onSelect}
            files={files}
          />
        ))}
      </div>
    </div>
  );
}

function TreeNodeItem({
  node,
  depth,
  expanded,
  toggleDir,
  selectedPath,
  onSelect,
  files,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  toggleDir: (path: string) => void;
  selectedPath?: string;
  onSelect: (path: string, content: string) => void;
  files: Record<string, string>;
}) {
  const isExpanded = expanded.has(node.path);
  const isSelected = selectedPath === node.path;

  if (node.isDir) {
    return (
      <div>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1.5 w-full text-left py-1 px-1.5 rounded-md text-xs hover:bg-accent transition-colors",
          )}
          style={{ paddingLeft: `${depth * 12 + 6}px` }}
          onClick={() => toggleDir(node.path)}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          ) : (
            <Folder className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          <span className="font-mono truncate">{node.name}</span>
        </button>
        {isExpanded && (
          <div>
            {node.children.map((child) => (
              <TreeNodeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                toggleDir={toggleDir}
                selectedPath={selectedPath}
                onSelect={onSelect}
                files={files}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "flex items-center gap-1.5 w-full text-left py-1 px-1.5 rounded-md text-xs transition-colors",
        isSelected ? "bg-accent" : "hover:bg-accent/50"
      )}
      style={{ paddingLeft: `${depth * 12 + 18}px` }}
      onClick={() => onSelect(node.path, files[node.path] ?? "")}
    >
      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="font-mono truncate">{node.name}</span>
    </button>
  );
}
