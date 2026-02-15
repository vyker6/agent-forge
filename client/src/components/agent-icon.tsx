import {
  Bot, Brain, Code, Shield, Search, Zap,
  Terminal, FileText, GitBranch, Database,
  Globe, Lock, Layers, Cpu, Settings, Wand2
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  bot: Bot,
  brain: Brain,
  code: Code,
  shield: Shield,
  search: Search,
  zap: Zap,
  terminal: Terminal,
  "file-text": FileText,
  "git-branch": GitBranch,
  database: Database,
  globe: Globe,
  lock: Lock,
  layers: Layers,
  cpu: Cpu,
  settings: Settings,
  wand: Wand2,
};

interface AgentIconProps {
  icon: string;
  color?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function AgentIcon({ icon, color = "#3b82f6", className = "", size = "md" }: AgentIconProps) {
  const IconComponent = iconMap[icon] || Bot;
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div
      className={`flex items-center justify-center rounded-md ${className}`}
      style={{
        backgroundColor: `${color}18`,
        color: color,
      }}
    >
      <IconComponent className={sizeClasses[size]} />
    </div>
  );
}

export function AgentIconPicker({
  selectedIcon,
  selectedColor,
  onIconChange,
  onColorChange,
}: {
  selectedIcon: string;
  selectedColor: string;
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
}) {
  const icons = Object.keys(iconMap);
  const colors = [
    "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444",
    "#f97316", "#eab308", "#22c55e", "#06b6d4",
    "#6366f1", "#a855f7", "#14b8a6", "#64748b",
  ];

  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Icon</p>
        <div className="grid grid-cols-8 gap-1">
          {icons.map((iconKey) => {
            const Icon = iconMap[iconKey];
            return (
              <button
                key={iconKey}
                type="button"
                onClick={() => onIconChange(iconKey)}
                className={`p-2 rounded-md transition-colors ${
                  selectedIcon === iconKey
                    ? "bg-accent"
                    : "hover-elevate"
                }`}
                data-testid={`button-icon-${iconKey}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">Color</p>
        <div className="flex flex-wrap gap-1">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onColorChange(c)}
              className={`w-6 h-6 rounded-full transition-transform ${
                selectedColor === c ? "ring-2 ring-offset-2 ring-offset-background" : ""
              }`}
              style={{ backgroundColor: c, "--tw-ring-color": c } as React.CSSProperties}
              data-testid={`button-color-${c}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
