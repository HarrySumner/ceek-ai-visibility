import { Lightbulb, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Insight {
  type: 'positive' | 'negative' | 'neutral';
  message: string;
}

interface InsightsSummaryProps {
  insights: Insight[];
}

export function InsightsSummary({ insights }: InsightsSummaryProps) {
  if (insights.length === 0) {
    return null;
  }

  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'positive': return TrendingUp;
      case 'negative': return TrendingDown;
      default: return AlertCircle;
    }
  };

  return (
    <div className="glass-card p-6 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-warning" />
        <h3 className="font-semibold">Key Insights</h3>
      </div>
      <div className="space-y-3">
        {insights.map((insight, idx) => {
          const Icon = getIcon(insight.type);
          return (
            <div 
              key={idx}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg",
                insight.type === 'positive' && "bg-success/10 border border-success/20",
                insight.type === 'negative' && "bg-destructive/10 border border-destructive/20",
                insight.type === 'neutral' && "bg-muted border border-border"
              )}
            >
              <Icon className={cn(
                "w-4 h-4 mt-0.5 shrink-0",
                insight.type === 'positive' && "text-success",
                insight.type === 'negative' && "text-destructive",
                insight.type === 'neutral' && "text-muted-foreground"
              )} />
              <p className="text-sm">{insight.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
