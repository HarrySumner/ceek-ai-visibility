import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ContentQuality } from "@/types";
import { Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NLPScoreBreakdownProps {
  quality: ContentQuality;
  variant?: 'minimal' | 'frontloaded' | 'stepwise';
}

const METRIC_INFO = {
  sentiment: {
    label: "Sentiment",
    description: "Measures emotional tone. 0.4-0.6 is optimal for analytical neutrality.",
    optimal: { min: 0.4, max: 0.6 },
    unit: "",
  },
  readability: {
    label: "Readability",
    description: "Flesch-Kincaid Grade Level. 8-10 is optimal for general audience comprehension.",
    optimal: { min: 8, max: 10 },
    unit: " grade",
  },
  persuasiveness: {
    label: "Persuasiveness",
    description: "Technical vocabulary density. 0.06-0.10 indicates authoritative content.",
    optimal: { min: 0.06, max: 0.10 },
    unit: "",
  },
  clarity: {
    label: "Clarity",
    description: "Inverse word length - higher values indicate clearer, more accessible language.",
    optimal: { min: 0.15, max: 0.25 },
    unit: "",
  },
  emotionalAppeal: {
    label: "Emotional Appeal",
    description: "Emotional word density. 0.01-0.03 is optimal for balanced engagement.",
    optimal: { min: 0.01, max: 0.03 },
    unit: "",
  },
  explanatoryDirectiveness: {
    label: "Directiveness",
    description: "Directive phrase density. 0.10-0.30 indicates helpful, actionable guidance.",
    optimal: { min: 0.10, max: 0.30 },
    unit: "",
  },
};

function getScoreStatus(value: number, optimal: { min: number; max: number }): 'optimal' | 'high' | 'low' {
  if (value >= optimal.min && value <= optimal.max) return 'optimal';
  if (value > optimal.max) return 'high';
  return 'low';
}

function getStatusColor(status: 'optimal' | 'high' | 'low'): string {
  switch (status) {
    case 'optimal': return 'text-green-600 dark:text-green-400';
    case 'high': return 'text-amber-600 dark:text-amber-400';
    case 'low': return 'text-red-600 dark:text-red-400';
  }
}

function getStatusBg(status: 'optimal' | 'high' | 'low'): string {
  switch (status) {
    case 'optimal': return 'bg-green-500/20';
    case 'high': return 'bg-amber-500/20';
    case 'low': return 'bg-red-500/20';
  }
}

function getStatusIcon(status: 'optimal' | 'high' | 'low') {
  switch (status) {
    case 'optimal': return <Minus className="w-3 h-3" />;
    case 'high': return <TrendingUp className="w-3 h-3" />;
    case 'low': return <TrendingDown className="w-3 h-3" />;
  }
}

export function NLPScoreBreakdown({ quality, variant }: NLPScoreBreakdownProps) {
  const metrics = [
    { key: 'sentiment', value: quality.sentiment },
    { key: 'readability', value: quality.readability },
    { key: 'persuasiveness', value: quality.persuasiveness },
    { key: 'clarity', value: quality.clarity },
    { key: 'emotionalAppeal', value: quality.emotionalAppeal },
    { key: 'explanatoryDirectiveness', value: quality.explanatoryDirectiveness },
  ] as const;

  const getCFFBadgeColor = (v: string) => {
    switch (v) {
      case 'minimal': return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
      case 'frontloaded': return 'bg-purple-500/20 text-purple-700 dark:text-purple-300';
      case 'stepwise': return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300';
      default: return 'bg-muted';
    }
  };

  return (
    <Card className="border-border/50">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">NLP Analysis</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">Scores based on Ghosh (2024) NLP framework. Green = optimal range, amber = high, red = low.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {variant && (
            <Badge variant="outline" className={getCFFBadgeColor(variant)}>
              {variant}
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10">
          <span className="text-sm font-medium">Overall Score</span>
          <span className="text-lg font-bold text-primary">{(quality.overall * 100).toFixed(0)}%</span>
        </div>

        <div className="space-y-2">
          {metrics.map(({ key, value }) => {
            const info = METRIC_INFO[key];
            const status = getScoreStatus(value, info.optimal);
            const normalizedValue = key === 'readability' 
              ? Math.min(100, (value / 15) * 100) 
              : Math.min(100, value * 100);

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="flex items-center gap-1.5">
                        <span className={getStatusColor(status)}>{getStatusIcon(status)}</span>
                        <span className="text-muted-foreground">{info.label}</span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">{info.description}</p>
                        <p className="text-xs mt-1 text-muted-foreground">
                          Optimal: {info.optimal.min}{info.unit} - {info.optimal.max}{info.unit}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <span className={`font-mono ${getStatusColor(status)}`}>
                    {value.toFixed(2)}{info.unit}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${getStatusBg(status)}`}
                    style={{ width: `${normalizedValue}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
