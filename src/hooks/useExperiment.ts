import { useState } from "react";
import { Brand, Keyword, ModelConfig, ModelResult, PromptVariant, ContentQuality, BrandScore } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const DEFAULT_MODELS: ModelConfig[] = [
  { id: 'gemini-2.5-flash', provider: 'lovable', name: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', enabled: true },
  { id: 'gemini-2.5-pro', provider: 'lovable', name: 'gemini-2.5-pro', displayName: 'Gemini 2.5 Pro', enabled: false },
  { id: 'gpt-5', provider: 'lovable', name: 'gpt-5', displayName: 'GPT-5', enabled: true },
  { id: 'gpt-5-mini', provider: 'lovable', name: 'gpt-5-mini', displayName: 'GPT-5 Mini', enabled: false },
];

interface ExperimentResponse {
  rawResponse: string;
  brandMentions: Record<string, {
    detected: boolean;
    position: number | null;
    numMentions: number;
    contextSnippets: string[];
  }>;
  contentQuality: ContentQuality;
  modelId: string;
  promptVariant: PromptVariant;
  keyword: string;
  timestamp: string;
}

export function useExperiment() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [models, setModels] = useState<ModelConfig[]>(DEFAULT_MODELS);
  const [results, setResults] = useState<ModelResult[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  const runExperiment = async (selectedVariants: PromptVariant[], runsPerCombination: number) => {
    const enabledModels = models.filter(m => m.enabled);
    
    if (brands.length === 0 || keywords.length === 0 || enabledModels.length === 0) {
      toast.error("Please add at least one brand, keyword, and enable at least one model");
      return;
    }

    setIsRunning(true);
    setProgress(0);
    
    const totalCalls = keywords.length * enabledModels.length * selectedVariants.length * runsPerCombination;
    let completedCalls = 0;
    
    // Store all responses grouped by model
    const responsesByModel: Record<string, ExperimentResponse[]> = {};
    
    for (const model of enabledModels) {
      responsesByModel[model.id] = [];
    }

    try {
      for (const keyword of keywords) {
        for (const model of enabledModels) {
          for (const variant of selectedVariants) {
            for (let run = 0; run < runsPerCombination; run++) {
              setCurrentStep(`${model.displayName}: "${keyword.query.substring(0, 30)}..." (${variant})`);
              
              try {
                const { data, error } = await supabase.functions.invoke('run-experiment', {
                  body: {
                    keyword: keyword.query,
                    brands,
                    modelId: model.id,
                    promptVariant: variant,
                  }
                });

                if (error) {
                  console.error('Experiment error:', error);
                  toast.error(`Error with ${model.displayName}: ${error.message}`);
                } else if (data) {
                  responsesByModel[model.id].push(data as ExperimentResponse);
                }
              } catch (err) {
                console.error('API call failed:', err);
              }
              
              completedCalls++;
              setProgress(Math.round((completedCalls / totalCalls) * 100));
              
              // Small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }
      }

      // Aggregate results by model
      const aggregatedResults: ModelResult[] = enabledModels.map(model => {
        const modelResponses = responsesByModel[model.id];
        
        // Calculate brand scores
        const brandScores: BrandScore[] = brands.map(brand => {
          const mentionedResponses = modelResponses.filter(r => r.brandMentions[brand.id]?.detected);
          const mentionRate = modelResponses.length > 0 ? mentionedResponses.length / modelResponses.length : 0;
          
          const positions = mentionedResponses
            .map(r => r.brandMentions[brand.id]?.position)
            .filter((p): p is number => p !== null);
          const avgRank = positions.length > 0 ? positions.reduce((a, b) => a + b, 0) / positions.length : null;
          
          const avgQuality = modelResponses.length > 0
            ? modelResponses.reduce((sum, r) => sum + r.contentQuality.overall, 0) / modelResponses.length
            : 0;
          
          // Composite score: mention (40%) + rank (30%) + quality (30%)
          const mentionComponent = mentionRate;
          const rankComponent = avgRank ? Math.max(0, (5 - avgRank) / 4) : 0;
          const qualityComponent = avgQuality;
          const compositeScore = mentionComponent * 0.4 + rankComponent * 0.3 + qualityComponent * 0.3;
          
          return {
            brandId: brand.id,
            brandName: brand.name,
            mentionRate,
            avgRank,
            qualityScore: avgQuality,
            compositeScore,
            status: compositeScore >= 0.6 ? 'success' : compositeScore >= 0.3 ? 'warning' : 'destructive',
          } as BrandScore;
        });

        // Calculate average content quality
        const avgContentQuality: ContentQuality | undefined = modelResponses.length > 0 ? {
          sentiment: modelResponses.reduce((sum, r) => sum + r.contentQuality.sentiment, 0) / modelResponses.length,
          readability: modelResponses.reduce((sum, r) => sum + r.contentQuality.readability, 0) / modelResponses.length,
          persuasiveness: modelResponses.reduce((sum, r) => sum + r.contentQuality.persuasiveness, 0) / modelResponses.length,
          clarity: modelResponses.reduce((sum, r) => sum + r.contentQuality.clarity, 0) / modelResponses.length,
          emotionalAppeal: modelResponses.reduce((sum, r) => sum + r.contentQuality.emotionalAppeal, 0) / modelResponses.length,
          explanatoryDirectiveness: modelResponses.reduce((sum, r) => sum + r.contentQuality.explanatoryDirectiveness, 0) / modelResponses.length,
          overall: modelResponses.reduce((sum, r) => sum + r.contentQuality.overall, 0) / modelResponses.length,
        } : undefined;

        return {
          modelId: model.id,
          modelName: model.displayName,
          brandScores,
          responseCount: modelResponses.length,
          avgContentQuality,
        };
      });

      setResults(aggregatedResults);
      setHasRun(true);
      toast.success("Experiment completed successfully!");
      
    } catch (error) {
      console.error('Experiment failed:', error);
      toast.error("Experiment failed. Please try again.");
    } finally {
      setIsRunning(false);
      setCurrentStep("");
    }
  };

  const insights = hasRun && results.length > 0 ? generateInsights(results, brands) : [];

  return {
    brands,
    setBrands,
    keywords,
    setKeywords,
    models,
    setModels,
    results,
    hasRun,
    isRunning,
    progress,
    currentStep,
    runExperiment,
    insights,
  };
}

function generateInsights(results: ModelResult[], brands: Brand[]) {
  const insights: { type: 'positive' | 'negative' | 'neutral'; message: string }[] = [];
  
  // Find best performing model
  const bestModel = results.reduce((best, current) => {
    const currentAvg = current.brandScores.reduce((sum, bs) => sum + bs.compositeScore, 0) / current.brandScores.length;
    const bestAvg = best.brandScores.reduce((sum, bs) => sum + bs.compositeScore, 0) / best.brandScores.length;
    return currentAvg > bestAvg ? current : best;
  }, results[0]);
  
  if (bestModel) {
    const avgScore = bestModel.brandScores.reduce((sum, bs) => sum + bs.mentionRate, 0) / bestModel.brandScores.length;
    insights.push({
      type: 'positive',
      message: `${bestModel.modelName} shows strongest brand coverage with ${(avgScore * 100).toFixed(0)}% average mention rate`,
    });
  }

  // Find underperforming brands
  const allBrandScores = results.flatMap(r => r.brandScores);
  const brandAvgScores = brands.map(brand => {
    const scores = allBrandScores.filter(bs => bs.brandId === brand.id);
    return {
      name: brand.name,
      avgMention: scores.reduce((sum, s) => sum + s.mentionRate, 0) / scores.length,
    };
  });
  
  const weakBrand = brandAvgScores.find(b => b.avgMention < 0.3);
  if (weakBrand) {
    insights.push({
      type: 'negative',
      message: `${weakBrand.name} has low visibility (${(weakBrand.avgMention * 100).toFixed(0)}% mention rate). Consider SEO and content optimization.`,
    });
  }

  // Content quality insight
  const avgQuality = results
    .filter(r => r.avgContentQuality)
    .reduce((sum, r) => sum + (r.avgContentQuality?.overall || 0), 0) / results.length;
  
  if (avgQuality > 0) {
    insights.push({
      type: 'neutral',
      message: `Average content quality score: ${(avgQuality * 100).toFixed(0)}%. Higher scores indicate balanced, professional responses.`,
    });
  }

  return insights;
}
