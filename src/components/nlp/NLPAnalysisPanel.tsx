import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ModelResult } from "@/types";
import { BarChart3, TrendingUp, MessageCircle, BookOpen, Heart, Compass } from "lucide-react";

interface NLPAnalysisPanelProps {
  results: ModelResult[];
}

const NLP_METRICS = [
  { key: 'sentiment', label: 'Sentiment', icon: Heart, optimal: '0.4-0.6', description: 'Analytical neutrality' },
  { key: 'readability', label: 'Readability', icon: BookOpen, optimal: '8-10', description: 'Grade level' },
  { key: 'persuasiveness', label: 'Persuasiveness', icon: TrendingUp, optimal: '0.06-0.10', description: 'Technical vocabulary' },
  { key: 'clarity', label: 'Clarity', icon: MessageCircle, optimal: 'Higher=better', description: 'Inverse word length' },
  { key: 'emotionalAppeal', label: 'Emotional Appeal', icon: Heart, optimal: '0.01-0.03', description: 'Emotional density' },
  { key: 'explanatoryDirectiveness', label: 'Directiveness', icon: Compass, optimal: '0.10-0.30', description: 'Directive phrases' },
];

export function NLPAnalysisPanel({ results }: NLPAnalysisPanelProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Analysis Available</h2>
        <p className="text-muted-foreground">Run an experiment to see NLP analysis</p>
      </div>
    );
  }

  const getScoreStatus = (key: string, value: number): 'success' | 'warning' | 'destructive' => {
    switch (key) {
      case 'sentiment':
        return value >= 0.4 && value <= 0.6 ? 'success' : value >= 0.3 && value <= 0.7 ? 'warning' : 'destructive';
      case 'readability':
        return value >= 8 && value <= 10 ? 'success' : value >= 6 && value <= 12 ? 'warning' : 'destructive';
      case 'persuasiveness':
        return value >= 0.06 && value <= 0.10 ? 'success' : value >= 0.04 && value <= 0.12 ? 'warning' : 'destructive';
      case 'emotionalAppeal':
        return value >= 0.01 && value <= 0.03 ? 'success' : value >= 0.005 && value <= 0.05 ? 'warning' : 'destructive';
      case 'explanatoryDirectiveness':
        return value >= 0.10 && value <= 0.30 ? 'success' : value >= 0.05 && value <= 0.40 ? 'warning' : 'destructive';
      default:
        return 'warning';
    }
  };

  const statusColors = {
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    destructive: 'bg-red-500',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2 text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Analyse NLP
        </h1>
        <p className="text-muted-foreground">Content quality metrics based on Ghosh (2024) framework</p>
      </div>

      <div className="grid gap-6">
        {results.map((result) => (
          <Card key={result.modelId}>
            <CardHeader>
              <CardTitle>{result.modelName}</CardTitle>
              <CardDescription>{result.responseCount} responses analysed</CardDescription>
            </CardHeader>
            <CardContent>
              {result.avgContentQuality ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {NLP_METRICS.map((metric) => {
                    const value = result.avgContentQuality![metric.key as keyof typeof result.avgContentQuality] as number;
                    const status = getScoreStatus(metric.key, value);
                    const Icon = metric.icon;

                    return (
                      <div key={metric.key} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{metric.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold">{value.toFixed(2)}</span>
                          <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Optimal: {metric.optimal}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No content quality data available</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
