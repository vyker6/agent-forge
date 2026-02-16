import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { fieldHelp } from "@/data/field-help";

interface FieldTooltipProps {
  field: string;
}

export function FieldTooltip({ field }: FieldTooltipProps) {
  const text = fieldHelp[field];
  if (!text) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-[260px] text-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
