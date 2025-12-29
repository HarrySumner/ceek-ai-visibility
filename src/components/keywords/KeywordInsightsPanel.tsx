import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Target, Lightbulb, BarChart3, Eye, Hash } from "lucide-react";
import { Brand, ModelResult, KeywordData, SEOInsight } from "@/types";
import { getProjects, getKeywords } from "@/lib/keywordApi";
import { toast } from "sonner";

interface KeywordInsightsPanelProps {
  brands: Brand[];
  results: ModelResult[];
}

export function KeywordInsightsPanel({ brands, results }: KeywordInsightsPanelProps) {
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [loading, setLoading] = useState(true);

  // Load keywords from CEEK project on mount
  useEffect(() => {
    async function load() {
      try {
        const projects = await getProjects();
        const ceek = projects.find(p => p.name.toLowerCase().includes('ceek'));
        if (ceek) {
          const kws = await getKeywords(ceek.id);
          setKeywords(kws);
        }
      } catch (error) {
        console.error('Failed to load keywords for insights:', error);
        toast.error("Failed to load keyword data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Calculate insights for each brand
  const insights: SEOInsight[] = useMemo(() => {
    if (!brands.length || !results.length) return [];

    return brands.map(brand => {
      // Get AI visibility score from results
      const allScores = results.flatMap(r => r.brandScores);
      const brandScores = allScores.filter(bs => bs.brandId === brand.id);
      const avgAiVisibility = brandScores.length > 0
        ? brandScores.reduce((sum, bs) => sum + bs.mentionRate, 0) / brandScores.length
        : 0;

      // Find keywords related to this brand (simple matching)
      const brandNameLower = brand.name.toLowerCase();
      const relatedKeywords = keywords.filter(k => 
        k.keyword.toLowerCase().includes(brandNameLower) ||
        brand.aliases.some(alias => k.keyword.toLowerCase().includes(alias.toLowerCase()))
      ).slice(0, 5);

      // Calculate SEO metrics
      const totalVolume = relatedKeywords.reduce((sum, k) => sum + k.monthlyVolume, 0);
      const rankedKeywords = relatedKeywords.filter(k => k.rank !== null);
      const avgRank = rankedKeywords.length > 0
        ? rankedKeywords.reduce((sum, k) => sum + (k.rank || 0), 0) / rankedKeywords.length
        : null;

      // Calculate opportunity score
      let opportunityScore: 'high' | 'medium' | 'low' = 'low';
      let recommendation = '';

      if (totalVolume > 1000 && avgAiVisibility < 0.3) {
        opportunityScore = 'high';
        recommendation = 'High SEO volume with low AI visibility. Consider creating AI-optimized content to improve brand presence in LLM responses.';
      } else if (totalVolume > 500 || (avgRank !== null && avgRank < 20)) {
        opportunityScore = 'medium';
        recommendation = 'Moderate opportunity. Focus on maintaining SEO rankings while building AI content presence.';
      } else {
        opportunityScore = 'low';
        recommendation = 'Limited keyword volume. Consider expanding keyword targeting and brand visibility efforts.';
      }

      return {
        brandId: brand.id,
        brandName: brand.name,
        keywords: relatedKeywords,
        totalVolume,
        avgRank,
        aiVisibility: avgAiVisibility,
        opportunityScore,
        recommendation,
      };
    });
  }, [brands, results, keywords]);

  const hasData = brands.length > 0 && results.length > 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div className="glass-card p-6 animate-fade-in">
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">Analysis</p>
          <h3 className="text-2xl mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>
            SEO Insights
          </h3>
        </div>

        <div className="glass-card p-12 text-center animate-fade-in">
          <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            Add brands and run an experiment to see SEO insights
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6 animate-fade-in">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">Analysis</p>
        <h3 className="text-2xl mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>
          SEO Insights
        </h3>
        <p className="text-sm text-muted-foreground">
          Correlating keyword SEO data with AI visibility test results
        </p>
      </div>

      {/* Brand Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, idx) => (
          <Card 
            key={insight.brandId} 
            className="p-6 bg-secondary/30 border-border animate-fade-in"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold">{insight.brandName}</h4>
                <Badge 
                  variant={
                    insight.opportunityScore === 'high' ? 'default' : 
                    insight.opportunityScore === 'medium' ? 'secondary' : 'outline'
                  }
                  className={
                    insight.opportunityScore === 'high' ? 'bg-green-600 text-white' :
                    insight.opportunityScore === 'medium' ? 'bg-yellow-500 text-black' : ''
                  }
                >
                  {insight.opportunityScore.toUpperCase()} Opportunity
                </Badge>
              </div>
              <Target className="w-6 h-6 text-primary" />
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Keywords</p>
                  <p className="font-semibold">{insight.keywords.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Total Volume</p>
                  <p className="font-semibold">{insight.totalVolume.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Avg Rank</p>
                  <p className="font-semibold">
                    {insight.avgRank !== null ? insight.avgRank.toFixed(1) : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">AI Visibility</p>
                  <p className="font-semibold">{(insight.aiVisibility * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>

            {/* Top Keywords */}
            {insight.keywords.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Top Keywords</p>
                <div className="flex flex-wrap gap-1">
                  {insight.keywords.slice(0, 5).map(kw => (
                    <Badge key={kw.id} variant="outline" className="text-xs">
                      {kw.keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation */}
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">{insight.recommendation}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {insights.length === 0 && (
        <div className="glass-card p-12 text-center animate-fade-in">
          <p className="text-muted-foreground">
            No brand insights available. Make sure brands are configured and experiment has been run.
          </p>
        </div>
      )}
    </div>
  );
}
