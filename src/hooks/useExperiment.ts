import { useState } from "react";
import { Brand, Keyword, ModelConfig, ModelResult } from "@/types";

const DEFAULT_MODELS: ModelConfig[] = [
  { id: 'gpt-4', provider: 'openai', name: 'gpt-4', displayName: 'GPT-4', enabled: true },
  { id: 'gpt-4o', provider: 'openai', name: 'gpt-4o', displayName: 'GPT-4o', enabled: true },
  { id: 'gemini-1.5-pro', provider: 'google', name: 'gemini-1.5-pro', displayName: 'Gemini 1.5 Pro', enabled: false },
  { id: 'gemini-2.0-flash', provider: 'google', name: 'gemini-2.0-flash', displayName: 'Gemini 2.0 Flash', enabled: true },
  { id: 'claude-3.5-sonnet', provider: 'anthropic', name: 'claude-3-5-sonnet-20241022', displayName: 'Claude 3.5 Sonnet', enabled: true },
  { id: 'claude-3-opus', provider: 'anthropic', name: 'claude-3-opus-20240229', displayName: 'Claude 3 Opus', enabled: false },
  { id: 'deepseek-chat', provider: 'deepseek', name: 'deepseek-chat', displayName: 'DeepSeek Chat', enabled: false },
  { id: 'deepseek-reasoner', provider: 'deepseek', name: 'deepseek-reasoner', displayName: 'DeepSeek Reasoner', enabled: false },
];

// Mock results for demonstration
const generateMockResults = (brands: Brand[], models: ModelConfig[]): ModelResult[] => {
  const enabledModels = models.filter(m => m.enabled);
  
  return enabledModels.map(model => ({
    modelId: model.id,
    modelName: model.displayName,
    responseCount: Math.floor(Math.random() * 20) + 10,
    brandScores: brands.map(brand => {
      const mentionRate = Math.random() * 0.8 + 0.2;
      const avgRank = mentionRate > 0.5 ? Math.random() * 3 + 1 : null;
      const qualityScore = Math.random() * 0.5 + 0.5;
      const compositeScore = (mentionRate * 0.4) + ((avgRank ? (5 - avgRank) / 4 : 0) * 0.3) + (qualityScore * 0.3);
      
      return {
        brandId: brand.id,
        brandName: brand.name,
        mentionRate,
        avgRank,
        qualityScore,
        compositeScore,
        status: compositeScore >= 0.7 ? 'success' : compositeScore >= 0.4 ? 'warning' : 'destructive',
      };
    }),
  }));
};

export function useExperiment() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [models, setModels] = useState<ModelConfig[]>(DEFAULT_MODELS);
  const [results, setResults] = useState<ModelResult[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const runExperiment = () => {
    // Generate mock results for now
    const mockResults = generateMockResults(brands, models);
    setResults(mockResults);
    setHasRun(true);
  };

  const insights = hasRun && results.length > 0 ? [
    {
      type: 'positive' as const,
      message: `${results[0]?.modelName} shows strong coverage for your brands with an average mention rate of ${(results[0]?.brandScores.reduce((sum, bs) => sum + bs.mentionRate, 0) / (results[0]?.brandScores.length || 1) * 100).toFixed(0)}%`,
    },
    {
      type: 'negative' as const,
      message: `Some models show inconsistent rankings under different prompt conditions. Consider using stepwise prompts for more reliable results.`,
    },
    {
      type: 'neutral' as const,
      message: `Frontloaded prompts tend to produce more structured comparisons but may introduce formatting bias.`,
    },
  ] : [];

  return {
    brands,
    setBrands,
    keywords,
    setKeywords,
    models,
    setModels,
    results,
    hasRun,
    runExperiment,
    insights,
  };
}
