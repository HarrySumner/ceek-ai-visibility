import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  Radar, 
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts";
import { ModelResult, Brand } from "@/types";
import { cn } from "@/lib/utils";

interface ModelComparisonRadarProps {
  results: ModelResult[];
  brands: Brand[];
}

const MODEL_COLORS: Record<string, { primary: string; bg: string }> = {
  'GPT-4o': { primary: 'hsl(142, 76%, 36%)', bg: 'hsl(142, 76%, 36%, 0.1)' },
  'GPT-4o Mini': { primary: 'hsl(142, 50%, 50%)', bg: 'hsl(142, 50%, 50%, 0.1)' },
  'Claude Sonnet 4': { primary: 'hsl(25, 95%, 53%)', bg: 'hsl(25, 95%, 53%, 0.1)' },
  'Claude 3.5 Haiku': { primary: 'hsl(25, 70%, 60%)', bg: 'hsl(25, 70%, 60%, 0.1)' },
  'Gemini 2.5 Flash': { primary: 'hsl(217, 91%, 60%)', bg: 'hsl(217, 91%, 60%, 0.1)' },
  'Gemini 2.5 Pro': { primary: 'hsl(217, 70%, 50%)', bg: 'hsl(217, 70%, 50%, 0.1)' },
};

export function ModelComparisonRadar({ results, brands }: ModelComparisonRadarProps) {
  if (results.length === 0) {
    return null;
  }

  const primaryBrand = brands[0];

  // Prepare radar data - normalize all metrics to 0-100 scale
  const radarData = [
    { metric: 'Mention Rate', fullMark: 100 },
    { metric: 'Sentiment', fullMark: 100 },
    { metric: 'Readability', fullMark: 100 },
    { metric: 'Clarity', fullMark: 100 },
    { metric: 'Persuasiveness', fullMark: 100 },
    { metric: 'Directiveness', fullMark: 100 },
  ].map(base => {
    const dataPoint: Record<string, any> = { ...base };
    
    results.forEach(result => {
      const brandScore = result.brandScores.find(bs => bs.brandId === primaryBrand?.id);
      const quality = result.avgContentQuality;
      
      switch (base.metric) {
        case 'Mention Rate':
          dataPoint[result.modelName] = (brandScore?.mentionRate || 0) * 100;
          break;
        case 'Sentiment':
          dataPoint[result.modelName] = (quality?.sentiment || 0.5) * 100;
          break;
        case 'Readability':
          // Normalize: grade 8-10 is optimal (100), higher/lower grades decrease score
          const readability = quality?.readability || 9;
          const readabilityScore = Math.max(0, 100 - Math.abs(readability - 9) * 15);
          dataPoint[result.modelName] = readabilityScore;
          break;
        case 'Clarity':
          dataPoint[result.modelName] = (quality?.clarity || 0.5) * 100;
          break;
        case 'Persuasiveness':
          // Normalize: 0.06-0.10 is optimal
          const persuasiveness = quality?.persuasiveness || 0.08;
          const persuasivenessScore = Math.max(0, 100 - Math.abs(persuasiveness - 0.08) * 500);
          dataPoint[result.modelName] = persuasivenessScore;
          break;
        case 'Directiveness':
          // Normalize: 0.10-0.30 is optimal
          const directiveness = quality?.explanatoryDirectiveness || 0.2;
          const directivenessScore = Math.max(0, 100 - Math.abs(directiveness - 0.2) * 200);
          dataPoint[result.modelName] = directivenessScore;
          break;
      }
    });
    
    return dataPoint;
  });

  // Model leaderboard
  const modelScores = results.map(result => {
    const brandScore = result.brandScores.find(bs => bs.brandId === primaryBrand?.id);
    const quality = result.avgContentQuality;
    
    // Composite score weighted by importance
    const mentionScore = (brandScore?.mentionRate || 0) * 40;
    const qualityScore = (quality?.overall || 0) * 30;
    const sentimentScore = (quality?.sentiment || 0.5) * 30;
    
    return {
      modelName: result.modelName,
      score: mentionScore + qualityScore + sentimentScore,
      mentionRate: brandScore?.mentionRate || 0,
      quality: quality?.overall || 0,
      responses: result.responseCount,
    };
  }).sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Model Comparison
        </h2>
        <Badge variant="outline">
          {results.length} models tested
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Ranking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {modelScores.map((model, index) => {
              const colors = MODEL_COLORS[model.modelName] || { primary: 'hsl(var(--primary))', bg: 'hsl(var(--primary), 0.1)' };
              
              return (
                <div 
                  key={model.modelName}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-lg border-2 transition-all",
                    index === 0 ? "border-primary bg-primary/5" : "border-border"
                  )}
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                    style={{ 
                      backgroundColor: colors.bg,
                      color: colors.primary,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{model.modelName}</span>
                      <span className="font-mono text-lg">{Math.round(model.score)}%</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{Math.round(model.mentionRate * 100)}% mentions</span>
                      <span>•</span>
                      <span>{Math.round(model.quality * 100)}% quality</span>
                      <span>•</span>
                      <span>{model.responses} responses</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quality Metrics Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="metric" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  {results.map((result) => {
                    const colors = MODEL_COLORS[result.modelName] || { primary: 'hsl(var(--primary))' };
                    return (
                      <Radar
                        key={result.modelId}
                        name={result.modelName}
                        dataKey={result.modelName}
                        stroke={colors.primary}
                        fill={colors.primary}
                        fillOpacity={0.15}
                        strokeWidth={2}
                      />
                    );
                  })}
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consensus vs Divergence */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Model Agreement Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Consensus metrics */}
            {['Sentiment', 'Readability', 'Mention Rate'].map(metric => {
              const values = results.map(r => {
                const quality = r.avgContentQuality;
                const brandScore = r.brandScores.find(bs => bs.brandId === primaryBrand?.id);
                
                switch (metric) {
                  case 'Sentiment': return (quality?.sentiment || 0.5) * 100;
                  case 'Readability': return quality?.readability || 9;
                  case 'Mention Rate': return (brandScore?.mentionRate || 0) * 100;
                  default: return 0;
                }
              });
              
              const avg = values.reduce((a, b) => a + b, 0) / values.length;
              const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
              const isConsensus = variance < (metric === 'Readability' ? 4 : 100);
              
              return (
                <div 
                  key={metric}
                  className={cn(
                    "p-4 rounded-lg border-2",
                    isConsensus ? "border-success bg-success/5" : "border-warning bg-warning/5"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{metric}</span>
                    <Badge variant={isConsensus ? "default" : "secondary"} className="text-xs">
                      {isConsensus ? 'Consensus' : 'Divergent'}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {results.map(r => {
                      const quality = r.avgContentQuality;
                      const brandScore = r.brandScores.find(bs => bs.brandId === primaryBrand?.id);
                      let value: number;
                      let display: string;
                      
                      switch (metric) {
                        case 'Sentiment':
                          value = (quality?.sentiment || 0.5) * 100;
                          display = `${Math.round(value)}%`;
                          break;
                        case 'Readability':
                          value = quality?.readability || 9;
                          display = `Grade ${value.toFixed(1)}`;
                          break;
                        case 'Mention Rate':
                          value = (brandScore?.mentionRate || 0) * 100;
                          display = `${Math.round(value)}%`;
                          break;
                        default:
                          value = 0;
                          display = '0';
                      }
                      
                      const colors = MODEL_COLORS[r.modelName];
                      
                      return (
                        <div key={r.modelId} className="flex items-center justify-between text-xs">
                          <span 
                            className="font-medium"
                            style={{ color: colors?.primary }}
                          >
                            {r.modelName}
                          </span>
                          <span className="font-mono">{display}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
