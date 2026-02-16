import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { helpContent } from "@/data/help-content";

export function HelpSection({ section }: { section: string }) {
  const [open, setOpen] = useState(false);
  const content = helpContent[section];
  if (!content) return null;

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronRight
          className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`}
        />
        {content.title}
      </button>
      {open && (
        <div className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-3 prose prose-xs dark:prose-invert max-w-none">
          {content.content.split("\n\n").map((paragraph, i) => (
            <p key={i} className={i > 0 ? "mt-2" : ""}>
              {paragraph.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                part.startsWith("**") && part.endsWith("**") ? (
                  <strong key={j}>{part.slice(2, -2)}</strong>
                ) : (
                  <span key={j}>{part}</span>
                )
              )}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
