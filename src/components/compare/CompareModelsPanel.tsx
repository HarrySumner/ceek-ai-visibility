import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModelResult, Brand } from "@/types";
import { GitCompare, Target, TrendingUp, Award } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from "recharts";

interface CompareModelsPanelProps {
  results: ModelResult[];
  brands: Brand[];
}

export function CompareModelsPanel({ results, brands }: CompareModelsPanelProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <GitCompare className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Data to Compare</h2>
        <p className="text-muted-foreground">Run an experiment to compare models</p>
      </div>
    );
  }

  // Prepare data for charts
  const mentionRateData = brands.map(brand => {
    const dataPoint: any = { brand: brand.name };
    results.forEach(result => {
      const score = result.brandScores.find(s => s.brandId === brand.id);
      dataPoint[result.modelName] = score ? (score.mentionRate * 100).toFixed(1) : 0;
    });
    return dataPoint;
  });

  const compositeScoreData = results.map(result => ({
    model: result.modelName,
    avgComposite: (result.brandScores.reduce((sum, s) => sum + s.compositeScore, 0) / result.brandScores.length * 100).toFixed(1),
    avgQuality: result.avgContentQuality?.overall ? (result.avgContentQuality.overall * 100).toFixed(1) : 0,
  }));

  // Radar chart data for quality metrics
  const radarData = results[0]?.avgContentQuality ? [
    { metric: 'Sentiment', ...Object.fromEntries(results.map(r => [r.modelName, r.avgContentQuality?.sentiment || 0])) },
    { metric: 'Readability', ...Object.fromEntries(results.map(r => [r.modelName, (r.avgContentQuality?.readability || 0) / 20])) },
    { metric: 'Persuasiveness', ...Object.fromEntries(results.map(r => [r.modelName, (r.avgContentQuality?.persuasiveness || 0) * 10])) },
    { metric: 'Clarity', ...Object.fromEntries(results.map(r => [r.modelName, r.avgContentQuality?.clarity || 0])) },
    { metric: 'Overall', ...Object.fromEntries(results.map(r => [r.modelName, r.avgContentQuality?.overall || 0])) },
  ] : [];

  const colors = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  // Find best performing model
  const bestModel = results.reduce((best, curr) => {
    const currAvg = curr.brandScores.reduce((s, b) => s + b.compositeScore, 0) / curr.brandScores.length;
    const bestAvg = best.brandScores.reduce((s, b) => s + b.compositeScore, 0) / best.brandScores.length;
    return currAvg > bestAvg ? curr : best;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2 text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Compare Models
        </h1>
        <p className="text-muted-foreground">Side-by-side model performance analysis</p>
      </div>

      {/* Best Performer */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Best Performer</p>
              <p className="text-xl font-bold">{bestModel.modelName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mention Rate by Brand */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Mention Rate by Brand
          </CardTitle>
          <CardDescription>How often each model mentions each brand</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mentionRateData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="brand" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                {results.map((result, i) => (
                  <Bar key={result.modelId} dataKey={result.modelName} fill={colors[i % colors.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quality Radar */}
      {radarData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Content Quality Comparison
            </CardTitle>
            <CardDescription>NLP metrics across models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid className="stroke-muted" />
                  <PolarAngleAxis dataKey="metric" className="text-xs" />
                  <PolarRadiusAxis className="text-xs" />
                  {results.map((result, i) => (
                    <Radar
                      key={result.modelId}
                      name={result.modelName}
                      dataKey={result.modelName}
                      stroke={colors[i % colors.length]}
                      fill={colors[i % colors.length]}
                      fillOpacity={0.2}
                    />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((result) => {
          const avgMention = result.brandScores.reduce((s, b) => s + b.mentionRate, 0) / result.brandScores.length;
          const avgComposite = result.brandScores.reduce((s, b) => s + b.compositeScore, 0) / result.brandScores.length;
          
          return (
            <Card key={result.modelId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{result.modelName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Mention Rate</span>
                  <Badge variant={avgMention > 0.5 ? 'default' : 'secondary'}>
                    {(avgMention * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Composite</span>
                  <Badge variant={avgComposite > 0.5 ? 'default' : 'secondary'}>
                    {avgComposite.toFixed(2)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Responses</span>
                  <span className="font-medium">{result.responseCount}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
