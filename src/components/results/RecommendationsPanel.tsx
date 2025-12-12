import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  Lightbulb,
  Target
} from "lucide-react";
import { Recommendation, ModelResult, Brand, ContentQuality, ExperimentContext } from "@/types";
import { cn } from "@/lib/utils";

interface RecommendationsPanelProps {
  results: ModelResult[];
  brands: Brand[];
  context: ExperimentContext;
}

function generateRecommendations(
  results: ModelResult[], 
  brands: Brand[],
  context: ExperimentContext
): Recommendation[] {
  if (results.length === 0 || brands.length === 0) return [];

  const recommendations: Recommendation[] = [];
  const primaryBrand = brands[0];
  
  // Aggregate across all models for primary brand
  const primaryBrandStats = results.map(r => {
    const score = r.brandScores.find(bs => bs.brandId === primaryBrand.id);
    return {
      model: r.modelName,
      mentionRate: score?.mentionRate || 0,
      quality: r.avgContentQuality,
    };
  });

  const avgMentionRate = primaryBrandStats.reduce((sum, s) => sum + s.mentionRate, 0) / primaryBrandStats.length;
  const avgSentiment = primaryBrandStats.reduce((sum, s) => sum + (s.quality?.sentiment || 0.5), 0) / primaryBrandStats.length;
  const avgPersuasiveness = primaryBrandStats.reduce((sum, s) => sum + (s.quality?.persuasiveness || 0.05), 0) / primaryBrandStats.length;
  const avgReadability = primaryBrandStats.reduce((sum, s) => sum + (s.quality?.readability || 9), 0) / primaryBrandStats.length;

  // Low mention rate
  if (avgMentionRate < 0.5) {
    const modelsWithLow = primaryBrandStats.filter(s => s.mentionRate < 0.5).map(s => s.model);
    recommendations.push({
      id: 'low-mention',
      type: 'opportunity',
      title: 'Increase brand visibility in AI responses',
      description: `Your brand appears in only ${Math.round(avgMentionRate * 100)}% of responses. Focus on being cited in authoritative industry sources that LLMs use for training data.`,
      metric: `${Math.round(avgMentionRate * 100)}% mention rate`,
      impact: 'high',
      models: modelsWithLow,
    });
  }

  // Sentiment analysis
  if (avgSentiment < 0.4) {
    recommendations.push({
      id: 'low-sentiment',
      type: 'warning',
      title: 'Address negative sentiment signals',
      description: 'AI responses about your brand lean negative. Review recent press coverage and customer feedback to identify reputation issues.',
      metric: `${Math.round(avgSentiment * 100)}% sentiment`,
      impact: 'high',
      models: results.map(r => r.modelName),
    });
  } else if (avgSentiment > 0.7) {
    recommendations.push({
      id: 'high-sentiment',
      type: 'strength',
      title: 'Strong positive perception',
      description: 'AI models consistently portray your brand positively. Maintain your current PR and content strategy.',
      metric: `${Math.round(avgSentiment * 100)}% sentiment`,
      impact: 'low',
      models: results.map(r => r.modelName),
    });
  }

  // Technical vocabulary (persuasiveness)
  if (avgPersuasiveness < 0.04) {
    recommendations.push({
      id: 'low-technical',
      type: 'opportunity',
      title: 'Strengthen technical credibility',
      description: 'Increase technical vocabulary in your content. Add industry-specific terminology and data-backed claims to build authority.',
      metric: `${Math.round(avgPersuasiveness * 100)}% technical density`,
      impact: 'medium',
      models: results.map(r => r.modelName),
    });
  } else if (avgPersuasiveness > 0.12) {
    recommendations.push({
      id: 'high-technical',
      type: 'warning',
      title: 'Simplify technical language',
      description: 'Your content may be too technical for general audiences. Balance expertise with accessibility.',
      metric: `${Math.round(avgPersuasiveness * 100)}% technical density`,
      impact: 'medium',
      models: results.map(r => r.modelName),
    });
  }

  // Readability
  if (avgReadability > 12) {
    recommendations.push({
      id: 'low-readability',
      type: 'opportunity',
      title: 'Improve content accessibility',
      description: 'AI responses about your brand score high on reading difficulty. Simplify key messaging for broader reach.',
      metric: `Grade ${Math.round(avgReadability)} reading level`,
      impact: 'medium',
      models: results.map(r => r.modelName),
    });
  }

  // Competitor comparison
  if (brands.length > 1) {
    const competitorScores = brands.slice(1).map(competitor => {
      const avgScore = results.reduce((sum, r) => {
        const score = r.brandScores.find(bs => bs.brandId === competitor.id);
        return sum + (score?.mentionRate || 0);
      }, 0) / results.length;
      return { name: competitor.name, rate: avgScore };
    });

    const topCompetitor = competitorScores.reduce((top, c) => c.rate > top.rate ? c : top, competitorScores[0]);
    
    if (topCompetitor && topCompetitor.rate > avgMentionRate * 1.5) {
      recommendations.push({
        id: 'competitor-gap',
        type: 'opportunity',
        title: `Close visibility gap with ${topCompetitor.name}`,
        description: `${topCompetitor.name} appears ${Math.round(topCompetitor.rate / avgMentionRate)}x more often than your brand. Analyze their content strategy and publication presence.`,
        metric: `${Math.round((topCompetitor.rate - avgMentionRate) * 100)}% gap`,
        impact: 'high',
        models: results.map(r => r.modelName),
      });
    }
  }

  // Model consensus check
  const mentionRates = primaryBrandStats.map(s => s.mentionRate);
  const variance = mentionRates.reduce((sum, r) => sum + Math.pow(r - avgMentionRate, 2), 0) / mentionRates.length;
  
  if (variance > 0.1) {
    const highModels = primaryBrandStats.filter(s => s.mentionRate > avgMentionRate).map(s => s.model);
    const lowModels = primaryBrandStats.filter(s => s.mentionRate < avgMentionRate).map(s => s.model);
    
    recommendations.push({
      id: 'model-variance',
      type: 'opportunity',
      title: 'Inconsistent visibility across AI platforms',
      description: `Your brand performs differently across models. ${highModels.join(', ')} show better coverage than ${lowModels.join(', ')}.`,
      metric: 'High variance',
      impact: 'medium',
      models: lowModels,
    });
  }

  return recommendations;
}

export function RecommendationsPanel({ results, brands, context }: RecommendationsPanelProps) {
  const recommendations = generateRecommendations(results, brands, context);
  
  if (results.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Lightbulb className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Run an analysis to see recommendations</p>
        </CardContent>
      </Card>
    );
  }

  const opportunities = recommendations.filter(r => r.type === 'opportunity');
  const warnings = recommendations.filter(r => r.type === 'warning');
  const strengths = recommendations.filter(r => r.type === 'strength');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Recommendations
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Based on {results.reduce((sum, r) => sum + r.responseCount, 0)} AI responses
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-1">
          {recommendations.length} actions
        </Badge>
      </div>

      {/* Priority Actions */}
      {opportunities.filter(r => r.impact === 'high').length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Target className="w-4 h-4" />
            Priority Actions
          </h3>
          {opportunities.filter(r => r.impact === 'high').map(rec => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Watch Areas
          </h3>
          {warnings.map(rec => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      )}

      {/* Other Opportunities */}
      {opportunities.filter(r => r.impact !== 'high').length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Opportunities
          </h3>
          {opportunities.filter(r => r.impact !== 'high').map(rec => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      )}

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Strengths
          </h3>
          {strengths.map(rec => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const typeStyles = {
    opportunity: 'border-l-primary bg-primary/5',
    warning: 'border-l-warning bg-warning/5',
    strength: 'border-l-success bg-success/5',
  };

  const typeIcons = {
    opportunity: <TrendingUp className="w-5 h-5 text-primary" />,
    warning: <AlertTriangle className="w-5 h-5 text-warning" />,
    strength: <CheckCircle2 className="w-5 h-5 text-success" />,
  };

  return (
    <Card className={cn("border-l-4", typeStyles[recommendation.type])}>
      <CardContent className="py-4">
        <div className="flex items-start gap-4">
          <div className="mt-0.5">{typeIcons[recommendation.type]}</div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{recommendation.title}</h4>
              <Badge 
                variant="outline" 
                className={cn(
                  "text-xs",
                  recommendation.impact === 'high' && "border-destructive text-destructive",
                  recommendation.impact === 'medium' && "border-warning text-warning",
                  recommendation.impact === 'low' && "border-muted-foreground"
                )}
              >
                {recommendation.impact} impact
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{recommendation.description}</p>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                {recommendation.metric}
              </span>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {recommendation.models.slice(0, 3).map(m => (
                  <Badge key={m} variant="secondary" className="text-xs">
                    {m}
                  </Badge>
                ))}
                {recommendation.models.length > 3 && (
                  <span>+{recommendation.models.length - 3}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
