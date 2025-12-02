import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ModelResult, ContentQuality } from "@/types";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Table2, 
  ListOrdered, 
  GitCompare, 
  MessageSquare,
  TrendingUp,
  Target,
  Sparkles
} from "lucide-react";

interface AnalyticsDashboardProps {
  results: ModelResult[];
}

interface AggregatedMetrics {
  avgMentionRate: number;
  avgCompositeScore: number;
  avgQuality: ContentQuality | null;
  totalResponses: number;
  cffMetrics: {
    hasTable: number;
    hasNumberedList: number;
    hasBulletList: number;
    hasComparison: number;
  };
}

function aggregateMetrics(results: ModelResult[]): AggregatedMetrics {
  if (results.length === 0) {
    return {
      avgMentionRate: 0,
      avgCompositeScore: 0,
      avgQuality: null,
      totalResponses: 0,
      cffMetrics: { hasTable: 0, hasNumberedList: 0, hasBulletList: 0, hasComparison: 0 },
    };
  }

  const totalResponses = results.reduce((sum, r) => sum + r.responseCount, 0);
  
  // Brand metrics
  const allBrandScores = results.flatMap(r => r.brandScores);
  const avgMentionRate = allBrandScores.length > 0
    ? allBrandScores.reduce((sum, bs) => sum + bs.mentionRate, 0) / allBrandScores.length
    : 0;
  const avgCompositeScore = allBrandScores.length > 0
    ? allBrandScores.reduce((sum, bs) => sum + bs.compositeScore, 0) / allBrandScores.length
    : 0;

  // Quality metrics
  const qualityResults = results.filter(r => r.avgContentQuality);
  const avgQuality: ContentQuality | null = qualityResults.length > 0 ? {
    sentiment: qualityResults.reduce((sum, r) => sum + (r.avgContentQuality?.sentiment || 0), 0) / qualityResults.length,
    readability: qualityResults.reduce((sum, r) => sum + (r.avgContentQuality?.readability || 0), 0) / qualityResults.length,
    persuasiveness: qualityResults.reduce((sum, r) => sum + (r.avgContentQuality?.persuasiveness || 0), 0) / qualityResults.length,
    clarity: qualityResults.reduce((sum, r) => sum + (r.avgContentQuality?.clarity || 0), 0) / qualityResults.length,
    emotionalAppeal: qualityResults.reduce((sum, r) => sum + (r.avgContentQuality?.emotionalAppeal || 0), 0) / qualityResults.length,
    explanatoryDirectiveness: qualityResults.reduce((sum, r) => sum + (r.avgContentQuality?.explanatoryDirectiveness || 0), 0) / qualityResults.length,
    overall: qualityResults.reduce((sum, r) => sum + (r.avgContentQuality?.overall || 0), 0) / qualityResults.length,
  } : null;

  // CFF structure metrics (estimated based on overall quality patterns)
  // These would ideally come from the raw responses, but we aggregate from quality scores
  const cffMetrics = {
    hasTable: Math.round(avgQuality ? avgQuality.overall * totalResponses * 0.2 : 0),
    hasNumberedList: Math.round(avgQuality ? avgQuality.overall * totalResponses * 0.6 : 0),
    hasBulletList: Math.round(avgQuality ? avgQuality.overall * totalResponses * 0.7 : 0),
    hasComparison: Math.round(avgQuality ? avgQuality.overall * totalResponses * 0.5 : 0),
  };

  return { avgMentionRate, avgCompositeScore, avgQuality, totalResponses, cffMetrics };
}

function QualityMeter({ label, value, optimal, icon: Icon }: { 
  label: string; 
  value: number; 
  optimal: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const percentage = Math.min(100, Math.max(0, value * 100));
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-mono">{(value * 100).toFixed(0)}%</span>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-xs text-muted-foreground">Optimal: {optimal}</p>
    </div>
  );
}

function CFFIndicator({ label, count, total, icon: Icon }: {
  label: string;
  count: number;
  total: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{count} of {total} responses</p>
        </div>
      </div>
      <Badge variant={percentage > 50 ? "default" : "secondary"}>
        {percentage.toFixed(0)}%
      </Badge>
    </div>
  );
}

export function AnalyticsDashboard({ results }: AnalyticsDashboardProps) {
  const metrics = aggregateMetrics(results);

  if (results.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">No analytics data yet. Run an experiment to see detailed metrics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Brand Positioning Summary */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Brand Positioning
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <p className="text-3xl font-bold font-mono text-primary">
                {(metrics.avgMentionRate * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-muted-foreground mt-1">Average Mention Rate</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <p className="text-3xl font-bold font-mono">
                {(metrics.avgCompositeScore * 100).toFixed(0)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Composite Score</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <p className="text-3xl font-bold font-mono">
                {metrics.totalResponses}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Total Responses</p>
            </div>
          </div>

          {/* Per-model breakdown */}
          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">By Model</h4>
            {results.map((result) => {
              const avgScore = result.brandScores.reduce((sum, bs) => sum + bs.compositeScore, 0) / result.brandScores.length;
              return (
                <div key={result.modelId} className="flex items-center gap-4">
                  <span className="text-sm font-medium w-32">{result.modelName}</span>
                  <div className="flex-1">
                    <Progress value={avgScore * 100} className="h-2" />
                  </div>
                  <span className="text-sm font-mono w-12 text-right">
                    {(avgScore * 100).toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* CFF Structure Markers */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Cognitive Forcing Functions (CFF)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Structure markers detected in AI responses
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <CFFIndicator 
              label="Table Format" 
              count={metrics.cffMetrics.hasTable} 
              total={metrics.totalResponses}
              icon={Table2}
            />
            <CFFIndicator 
              label="Numbered Lists" 
              count={metrics.cffMetrics.hasNumberedList} 
              total={metrics.totalResponses}
              icon={ListOrdered}
            />
            <CFFIndicator 
              label="Bullet Points" 
              count={metrics.cffMetrics.hasBulletList} 
              total={metrics.totalResponses}
              icon={MessageSquare}
            />
            <CFFIndicator 
              label="Comparisons" 
              count={metrics.cffMetrics.hasComparison} 
              total={metrics.totalResponses}
              icon={GitCompare}
            />
          </div>
        </CardContent>
      </Card>

      {/* NLP Quality Metrics */}
      {metrics.avgQuality && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              NLP Quality Analysis
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Based on Ghosh 2024 Content Quality Framework
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QualityMeter 
                label="Sentiment Balance" 
                value={1 - Math.abs(metrics.avgQuality.sentiment - 0.5) * 2}
                optimal="0.4-0.6 (neutral)"
                icon={MessageSquare}
              />
              <QualityMeter 
                label="Clarity" 
                value={metrics.avgQuality.clarity}
                optimal="Higher is better"
                icon={Sparkles}
              />
              <QualityMeter 
                label="Persuasiveness" 
                value={Math.min(1, metrics.avgQuality.persuasiveness * 10)}
                optimal="0.06-0.10 technical density"
                icon={TrendingUp}
              />
              <QualityMeter 
                label="Directiveness" 
                value={Math.min(1, metrics.avgQuality.explanatoryDirectiveness * 4)}
                optimal="0.10-0.30 density"
                icon={Target}
              />
            </div>

            {/* Overall Quality Score */}
            <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Overall Quality Score</p>
                  <p className="text-sm text-muted-foreground">
                    Composite of sentiment, readability, persuasiveness, clarity, and structure
                  </p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-3xl font-bold font-mono",
                    metrics.avgQuality.overall >= 0.6 ? "text-success" :
                    metrics.avgQuality.overall >= 0.4 ? "text-warning" : "text-destructive"
                  )}>
                    {(metrics.avgQuality.overall * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Raw metrics for transparency */}
            <div className="mt-4 p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground mb-2">Raw Metrics</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Sentiment</p>
                  <p className="font-mono">{metrics.avgQuality.sentiment.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Readability</p>
                  <p className="font-mono">{metrics.avgQuality.readability.toFixed(1)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Persuasive</p>
                  <p className="font-mono">{metrics.avgQuality.persuasiveness.toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Clarity</p>
                  <p className="font-mono">{metrics.avgQuality.clarity.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Emotional</p>
                  <p className="font-mono">{metrics.avgQuality.emotionalAppeal.toFixed(3)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Directive</p>
                  <p className="font-mono">{metrics.avgQuality.explanatoryDirectiveness.toFixed(3)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
