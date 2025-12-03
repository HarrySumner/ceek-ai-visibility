import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModelResult, Brand } from "@/types";
import { GitCompare, Target, TrendingUp, Award, Trophy, Medal } from "lucide-react";
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
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
} from "recharts";

interface CompareModelsPanelProps {
  results: ModelResult[];
  brands: Brand[];
}

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(210, 70%, 50%)', 'hsl(150, 60%, 45%)', 'hsl(30, 80%, 55%)'];
const BRAND_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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

  // Calculate rankings
  const modelRankings = results.map(result => {
    const avgMention = result.brandScores.reduce((s, b) => s + b.mentionRate, 0) / result.brandScores.length;
    const avgComposite = result.brandScores.reduce((s, b) => s + b.compositeScore, 0) / result.brandScores.length;
    const avgQuality = result.avgContentQuality?.overall || 0;
    return {
      ...result,
      avgMention,
      avgComposite,
      avgQuality,
      totalScore: (avgMention * 0.3 + avgComposite * 0.4 + avgQuality * 0.3),
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

  // Mention rate by brand
  const mentionRateData = brands.map((brand, i) => {
    const dataPoint: any = { brand: brand.name, color: BRAND_COLORS[i % BRAND_COLORS.length] };
    results.forEach(result => {
      const score = result.brandScores.find(s => s.brandId === brand.id);
      dataPoint[result.modelName] = score ? (score.mentionRate * 100) : 0;
    });
    return dataPoint;
  });

  // Composite score comparison
  const compositeData = results.map((result, i) => ({
    model: result.modelName,
    avgComposite: (result.brandScores.reduce((s, b) => s + b.compositeScore, 0) / result.brandScores.length * 100),
    avgQuality: (result.avgContentQuality?.overall || 0) * 100,
    avgMention: (result.brandScores.reduce((s, b) => s + b.mentionRate, 0) / result.brandScores.length * 100),
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Radar data for content quality
  const radarData = results[0]?.avgContentQuality ? [
    { metric: 'Sentiment', ...Object.fromEntries(results.map(r => [r.modelName, r.avgContentQuality?.sentiment || 0])) },
    { metric: 'Readability', ...Object.fromEntries(results.map(r => [r.modelName, (r.avgContentQuality?.readability || 0) / 15])) },
    { metric: 'Persuasion', ...Object.fromEntries(results.map(r => [r.modelName, Math.min(1, (r.avgContentQuality?.persuasiveness || 0) * 10)])) },
    { metric: 'Clarity', ...Object.fromEntries(results.map(r => [r.modelName, r.avgContentQuality?.clarity || 0])) },
    { metric: 'Overall', ...Object.fromEntries(results.map(r => [r.modelName, r.avgContentQuality?.overall || 0])) },
  ] : [];

  // Pie chart data for response distribution
  const pieData = results.map((result, i) => ({
    name: result.modelName,
    value: result.responseCount,
    fill: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div className="space-y-6">
      <div className="py-2">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">Comparison</p>
        <h1 className="text-3xl text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Compare Models
        </h1>
      </div>

      {/* Leaderboard */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Model Leaderboard
          </CardTitle>
          <CardDescription>Ranked by overall performance (mention rate, composite score, quality)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {modelRankings.map((result, index) => (
              <div 
                key={result.modelId} 
                className={`flex items-center justify-between p-4 rounded-lg border ${index === 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-card'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-amber-500 text-white' : 
                    index === 1 ? 'bg-gray-400 text-white' : 
                    index === 2 ? 'bg-amber-700 text-white' : 
                    'bg-muted text-muted-foreground'
                  }`}>
                    {index === 0 ? <Trophy className="w-5 h-5" /> : 
                     index === 1 ? <Medal className="w-5 h-5" /> : 
                     index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{result.modelName}</p>
                    <p className="text-xs text-muted-foreground">{result.responseCount} responses</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Mention</p>
                    <p className="font-bold">{(result.avgMention * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Quality</p>
                    <p className="font-bold">{(result.avgQuality * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-bold text-primary">{(result.totalScore * 100).toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Mention Rate by Brand */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Brand Mention Rate
            </CardTitle>
            <CardDescription>How often each model mentions each brand</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mentionRateData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="brand" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(0)}%`, '']}
                  />
                  <Legend />
                  {results.map((result, i) => (
                    <Bar key={result.modelId} dataKey={result.modelName} fill={CHART_COLORS[i % CHART_COLORS.length]} />
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
                Quality Metrics
              </CardTitle>
              <CardDescription>NLP metrics across models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid className="stroke-muted" />
                    <PolarAngleAxis dataKey="metric" className="text-xs" />
                    <PolarRadiusAxis domain={[0, 1]} className="text-xs" tick={false} />
                    {results.map((result, i) => (
                      <Radar
                        key={result.modelId}
                        name={result.modelName}
                        dataKey={result.modelName}
                        stroke={CHART_COLORS[i % CHART_COLORS.length]}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
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

        {/* Score Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Score Breakdown</CardTitle>
            <CardDescription>Component scores by model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compositeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} className="text-xs" />
                  <YAxis dataKey="model" type="category" width={80} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value.toFixed(0)}%`, '']}
                  />
                  <Legend />
                  <Bar dataKey="avgMention" name="Mention %" fill="hsl(210, 70%, 50%)" stackId="a" />
                  <Bar dataKey="avgQuality" name="Quality %" fill="hsl(150, 60%, 45%)" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Response Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Response Distribution</CardTitle>
            <CardDescription>Number of responses per model</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                    labelLine={false}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
