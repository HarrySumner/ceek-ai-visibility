import { cn } from "@/lib/utils";
import { IndustryVertical, INDUSTRY_VERTICALS } from "@/types";

interface IndustrySelectorProps {
  selected: IndustryVertical | null;
  onSelect: (industry: IndustryVertical) => void;
}

export function IndustrySelector({ selected, onSelect }: IndustrySelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {INDUSTRY_VERTICALS.map((industry) => (
        <button
          key={industry.id}
          onClick={() => onSelect(industry.id)}
          className={cn(
            "flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 text-left",
            selected === industry.id
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <span className="text-2xl">{industry.icon}</span>
          <span className="font-medium text-sm">{industry.label}</span>
        </button>
      ))}
    </div>
  );
}
