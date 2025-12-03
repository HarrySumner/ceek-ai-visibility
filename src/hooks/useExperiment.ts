import { useState, useEffect } from "react";
import { Brand, Keyword, ModelConfig, ModelResult, PromptVariant, ContentQuality, BrandScore } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RawResponse } from "@/components/responses/RawResponseViewer";

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
    confidence: number;
    disambiguationNotes: string[];
  }>;
  contentQuality: ContentQuality & {
    structureMarkers?: {
      hasTable: boolean;
      hasNumberedList: boolean;
      hasBulletList: boolean;
      hasComparison: boolean;
    };
  };
  modelId: string;
  promptVariant: PromptVariant;
  keyword: string;
  timestamp: string;
}

export interface SavedExperiment {
  id: string;
  name: string | null;
  created_at: string;
  config: {
    brands: Brand[];
    keywords: Keyword[];
    models: string[];
    variants: PromptVariant[];
  };
  total_responses: number;
  results?: ModelResult[];
}

// Sample data for luxury fashion brands
const SAMPLE_BRANDS: Brand[] = [
  { id: 'hermes', name: 'Hermès', aliases: ['Hermes', 'Hermès Paris'], type: 'client' },
  { id: 'louis-vuitton', name: 'Louis Vuitton', aliases: ['LV', 'Vuitton', 'LVMH'], type: 'competitor' },
  { id: 'gucci', name: 'Gucci', aliases: ['Gucci by Kering', 'House of Gucci'], type: 'competitor' },
  { id: 'chanel', name: 'Chanel', aliases: ['CHANEL', 'House of Chanel'], type: 'competitor' },
];

const SAMPLE_KEYWORDS: Keyword[] = [
  { id: 'kw1', query: 'What are the best luxury handbag brands to invest in?', category: 'luxury-fashion', intent: 'commercial' },
  { id: 'kw2', query: 'Compare heritage luxury fashion houses for quality craftsmanship', category: 'luxury-fashion', intent: 'commercial' },
  { id: 'kw3', query: 'Which luxury brand has the best resale value?', category: 'luxury-fashion', intent: 'informational' },
];

export function useExperiment() {
  const [brands, setBrands] = useState<Brand[]>(SAMPLE_BRANDS);
  const [keywords, setKeywords] = useState<Keyword[]>(SAMPLE_KEYWORDS);
  const [models, setModels] = useState<ModelConfig[]>(DEFAULT_MODELS);
  const [results, setResults] = useState<ModelResult[]>([]);
  const [rawResponses, setRawResponses] = useState<RawResponse[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [savedExperiments, setSavedExperiments] = useState<SavedExperiment[]>([]);
  const [currentExperimentId, setCurrentExperimentId] = useState<string | null>(null);

  // Load saved experiments on mount
  useEffect(() => {
    loadSavedExperiments();
  }, []);

  const loadSavedExperiments = async () => {
    try {
      const { data: experiments, error } = await supabase
        .from('experiments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading experiments:', error);
        return;
      }

      const experimentsWithResults: SavedExperiment[] = [];
      
      for (const exp of experiments || []) {
        const { data: resultsData } = await supabase
          .from('experiment_results')
          .select('*')
          .eq('experiment_id', exp.id);

        experimentsWithResults.push({
          id: exp.id,
          name: exp.name,
          created_at: exp.created_at,
          config: exp.config as unknown as SavedExperiment['config'],
          total_responses: exp.total_responses || 0,
          results: resultsData?.map(r => ({
            modelId: r.model_id,
            modelName: r.model_name,
            brandScores: r.brand_scores as unknown as BrandScore[],
            responseCount: r.response_count,
            avgContentQuality: r.avg_content_quality as unknown as ContentQuality,
          })),
        });
      }

      setSavedExperiments(experimentsWithResults);
    } catch (err) {
      console.error('Failed to load experiments:', err);
    }
  };

  const saveExperiment = async (aggregatedResults: ModelResult[], totalResponses: number, selectedVariants: PromptVariant[]) => {
    try {
      const enabledModels = models.filter(m => m.enabled);
      
      // Create experiment record - use JSON.parse/stringify for proper JSON serialization
      const configData = JSON.parse(JSON.stringify({
        brands,
        keywords,
        models: enabledModels.map(m => m.id),
        variants: selectedVariants,
      }));
      
      const { data: experiment, error: expError } = await supabase
        .from('experiments')
        .insert([{
          name: `Experiment ${new Date().toLocaleDateString()}`,
          config: configData,
          total_responses: totalResponses,
          status: 'completed',
        }])
        .select()
        .single();

      if (expError) {
        console.error('Error saving experiment:', expError);
        toast.error('Failed to save experiment');
        return;
      }

      // Save results for each model
      const resultsToInsert = aggregatedResults.map(result => ({
        experiment_id: experiment.id,
        model_id: result.modelId,
        model_name: result.modelName,
        brand_scores: JSON.parse(JSON.stringify(result.brandScores)),
        response_count: result.responseCount,
        avg_content_quality: result.avgContentQuality ? JSON.parse(JSON.stringify(result.avgContentQuality)) : null,
      }));

      const { error: resultsError } = await supabase
        .from('experiment_results')
        .insert(resultsToInsert);

      if (resultsError) {
        console.error('Error saving results:', resultsError);
      } else {
        setCurrentExperimentId(experiment.id);
        toast.success('Experiment saved to history');
        loadSavedExperiments();
      }
    } catch (err) {
      console.error('Failed to save experiment:', err);
    }
  };

  const loadExperiment = (experiment: SavedExperiment) => {
    if (experiment.results) {
      setResults(experiment.results);
      setHasRun(true);
      setCurrentExperimentId(experiment.id);
      
      // Also restore the config
      if (experiment.config.brands) {
        setBrands(experiment.config.brands);
      }
      if (experiment.config.keywords) {
        setKeywords(experiment.config.keywords);
      }
      
      toast.success('Loaded experiment from history');
    }
  };

  const deleteExperiment = async (experimentId: string) => {
    try {
      const { error } = await supabase
        .from('experiments')
        .delete()
        .eq('id', experimentId);

      if (error) {
        console.error('Error deleting experiment:', error);
        toast.error('Failed to delete experiment');
        return;
      }

      toast.success('Experiment deleted');
      loadSavedExperiments();
      
      if (currentExperimentId === experimentId) {
        setResults([]);
        setHasRun(false);
        setCurrentExperimentId(null);
      }
    } catch (err) {
      console.error('Failed to delete experiment:', err);
    }
  };

  const runExperiment = async (selectedVariants: PromptVariant[], runsPerCombination: number) => {
    const enabledModels = models.filter(m => m.enabled);
    
    if (brands.length === 0 || keywords.length === 0 || enabledModels.length === 0) {
      toast.error("Please add at least one brand, keyword, and enable at least one model");
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setRawResponses([]); // Clear previous raw responses
    
    // In conversation mode, we make one call per keyword/model (tests all 3 CFF variants in sequence)
    const totalCalls = keywords.length * enabledModels.length * runsPerCombination;
    let completedCalls = 0;
    
    const responsesByModel: Record<string, ExperimentResponse[]> = {};
    const collectedRawResponses: RawResponse[] = [];
    
    for (const model of enabledModels) {
      responsesByModel[model.id] = [];
    }

    try {
      for (const keyword of keywords) {
        for (const model of enabledModels) {
          for (let run = 0; run < runsPerCombination; run++) {
            setCurrentStep(`${model.displayName}: "${keyword.query.substring(0, 30)}..." (conversation mode)`);
            
            try {
              // Use conversation mode - tests all 3 CFF variants in a single multi-turn conversation
              const { data, error } = await supabase.functions.invoke('run-experiment', {
                body: {
                  keyword: keyword.query,
                  brands,
                  modelId: model.id,
                  promptVariant: 'minimal', // Starting point
                  conversationMode: true,   // Enable multi-turn CFF detection
                }
              });

              if (error) {
                console.error('Experiment error:', error);
                toast.error(`Error with ${model.displayName}: ${error.message}`);
              } else if (data?.conversationMode && data?.variants) {
                // Conversation mode returns all 3 variants
                const variants = data.variants as Record<string, {
                  response: string;
                  brandMentions: Record<string, any>;
                  contentQuality: ContentQuality;
                }>;
                
                // Add each variant as a separate response for aggregation
                for (const [variantKey, variantData] of Object.entries(variants)) {
                  responsesByModel[model.id].push({
                    rawResponse: variantData.response,
                    brandMentions: variantData.brandMentions,
                    contentQuality: variantData.contentQuality,
                    promptVariant: variantKey as PromptVariant,
                  } as ExperimentResponse);
                  
                  // Collect for raw response viewer
                  collectedRawResponses.push({
                    id: `${model.id}-${keyword.id}-${variantKey}-${run}`,
                    modelId: model.id,
                    modelName: model.displayName,
                    keyword: keyword.query,
                    rawText: variantData.response,
                    brandMentions: variantData.brandMentions,
                  });
                }
              } else if (data) {
                // Fallback for non-conversation mode
                responsesByModel[model.id].push(data as ExperimentResponse);
                
                collectedRawResponses.push({
                  id: `${model.id}-${keyword.id}-${run}`,
                  modelId: model.id,
                  modelName: model.displayName,
                  keyword: keyword.query,
                  rawText: data.rawResponse || "",
                  brandMentions: data.brandMentions || {},
                });
              }
            } catch (err) {
              console.error('API call failed:', err);
            }
            
            completedCalls++;
            setProgress(Math.round((completedCalls / totalCalls) * 100));
            
            // Longer delay between conversation calls to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // Aggregate results by model
      const aggregatedResults: ModelResult[] = enabledModels.map(model => {
        const modelResponses = responsesByModel[model.id];
        
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
      setRawResponses(collectedRawResponses);
      setHasRun(true);
      
      // Save to database
      const totalResponses = aggregatedResults.reduce((sum, r) => sum + r.responseCount, 0);
      await saveExperiment(aggregatedResults, totalResponses, selectedVariants);
      
      toast.success("Experiment completed and saved!");
      
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
    rawResponses,
    hasRun,
    isRunning,
    progress,
    currentStep,
    runExperiment,
    insights,
    savedExperiments,
    loadExperiment,
    deleteExperiment,
    currentExperimentId,
  };
}

function generateInsights(results: ModelResult[], brands: Brand[]) {
  const insights: { type: 'positive' | 'negative' | 'neutral'; message: string }[] = [];
  
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