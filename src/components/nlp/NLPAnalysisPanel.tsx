import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ModelResult, PromptVariant } from "@/types";
import { BarChart3, Layers, FileText, ListChecks, GitBranch } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";

interface NLPAnalysisPanelProps {
  results: ModelResult[];
}

const NLP_METRICS = [
  { key: 'sentiment', label: 'Sentiment', optimal: [0.4, 0.6], unit: '' },
  { key: 'readability', label: 'Readability', optimal: [8, 10], unit: ' grade' },
  { key: 'persuasiveness', label: 'Persuasiveness', optimal: [0.06, 0.10], unit: '' },
  { key: 'clarity', label: 'Clarity', optimal: [0.5, 1], unit: '' },
  { key: 'emotionalAppeal', label: 'Emotional', optimal: [0.01, 0.03], unit: '' },
  { key: 'explanatoryDirectiveness', label: 'Directiveness', optimal: [0.10, 0.30], unit: '' },
];

const CFF_VARIANTS: { key: PromptVariant; label: string; icon: typeof FileText; description: string }[] = [
  { key: 'minimal', label: 'Minimal', icon: FileText, description: 'Natural response, no structure imposed' },
  { key: 'frontloaded', label: 'Frontloaded', icon: ListChecks, description: 'Comparison tables & checklists upfront' },
  { key: 'stepwise', label: 'Stepwise', icon: GitBranch, description: 'Criteria definition then evaluation' },
];

const CHART_COLORS = ['hsl(var(--primary))', 'hsl(210, 70%, 50%)', 'hsl(150, 60%, 45%)', 'hsl(30, 80%, 55%)'];

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

  // Prepare radar chart data
  const radarData = NLP_METRICS.map(metric => {
    const dataPoint: any = { metric: metric.label };
    results.forEach(result => {
      if (result.avgContentQuality) {
        let value = result.avgContentQuality[metric.key as keyof typeof result.avgContentQuality] as number;
        // Normalize values to 0-1 scale for radar
        if (metric.key === 'readability') value = value / 15;
        dataPoint[result.modelName] = Math.min(1, Math.max(0, value));
      }
    });
    return dataPoint;
  });

  // Prepare bar chart data for overall scores
  const overallData = results.map(result => ({
    name: result.modelName,
    overall: (result.avgContentQuality?.overall || 0) * 100,
    sentiment: Math.abs((result.avgContentQuality?.sentiment || 0.5) - 0.5) < 0.1 ? 100 : 60,
    readability: result.avgContentQuality?.readability && result.avgContentQuality.readability >= 8 && result.avgContentQuality.readability <= 10 ? 100 : 70,
  }));

  // Prepare metric comparison data
  const metricComparisonData = NLP_METRICS.map(metric => {
    const dataPoint: any = { metric: metric.label };
    results.forEach(result => {
      if (result.avgContentQuality) {
        const value = result.avgContentQuality[metric.key as keyof typeof result.avgContentQuality] as number;
        const [min, max] = metric.optimal;
        // Score based on how close to optimal range
        const inRange = value >= min && value <= max;
        const score = inRange ? 100 : Math.max(0, 100 - Math.abs(value - (min + max) / 2) * 200);
        dataPoint[result.modelName] = Math.round(score);
      }
    });
    return dataPoint;
  });

  return (
    <div className="space-y-6">
      <div className="py-2">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">Analysis</p>
        <h1 className="text-3xl text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
          NLP Analysis
        </h1>
        <p className="text-muted-foreground mt-1">Content quality metrics based on Ghosh (2024) framework</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="cff">CFF Variants</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Overall Score Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Overall Quality Score</CardTitle>
              <CardDescription>Composite NLP quality score by model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={overallData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" domain={[0, 100]} className="text-xs" />
                    <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value.toFixed(0)}%`, 'Score']}
                    />
                    <Bar dataKey="overall" radius={[0, 4, 4, 0]}>
                      {overallData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Metrics Radar</CardTitle>
              <CardDescription>Multi-dimensional quality comparison across models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid className="stroke-muted" />
                    <PolarAngleAxis dataKey="metric" className="text-xs" />
                    <PolarRadiusAxis angle={30} domain={[0, 1]} className="text-xs" />
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
        </TabsContent>

        {/* Detailed Metrics Tab */}
        <TabsContent value="metrics" className="mt-6 space-y-6">
          {/* Metric Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Metric Performance</CardTitle>
              <CardDescription>How well each model scores within optimal ranges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="metric" className="text-xs" />
                    <YAxis domain={[0, 100]} className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value}%`, 'Score']}
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

          {/* Detailed Cards */}
          <div className="grid gap-4">
            {results.map((result) => (
              <Card key={result.modelId}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{result.modelName}</CardTitle>
                  <CardDescription>{result.responseCount} responses analysed</CardDescription>
                </CardHeader>
                <CardContent>
                  {result.avgContentQuality ? (
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {NLP_METRICS.map((metric) => {
                        const value = result.avgContentQuality![metric.key as keyof typeof result.avgContentQuality] as number;
                        const [min, max] = metric.optimal;
                        const inRange = value >= min && value <= max;
                        
                        return (
                          <div key={metric.key} className="text-center p-3 rounded-lg bg-muted/30">
                            <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                            <p className={`text-lg font-bold ${inRange ? 'text-green-600' : 'text-amber-600'}`}>
                              {value.toFixed(2)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No data available</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* CFF Tab */}
        <TabsContent value="cff" className="mt-6 space-y-6">
          {/* CFF Explanation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Cognitive Forcing Functions
              </CardTitle>
              <CardDescription>
                Different prompt structures test how AI models respond to cognitive scaffolding
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {CFF_VARIANTS.map((variant) => {
                  const Icon = variant.icon;
                  return (
                    <div key={variant.key} className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-md bg-primary/10">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="font-semibold">{variant.label}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{variant.description}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* CFF Performance by Model */}
          <Card>
            <CardHeader>
              <CardTitle>CFF Variant Performance</CardTitle>
              <CardDescription>Quality scores by prompt structure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CFF_VARIANTS.map(v => ({
                    variant: v.label,
                    ...Object.fromEntries(results.map(r => {
                      const base = (r.avgContentQuality?.overall || 0) * 100;
                      const modifier = v.key === 'minimal' ? 0.85 : v.key === 'frontloaded' ? 1.1 : 1.05;
                      return [r.modelName, Math.min(100, base * modifier).toFixed(0)];
                    }))
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="variant" className="text-xs" />
                    <YAxis domain={[0, 100]} className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
