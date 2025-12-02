export interface Brand {
  id: string;
  name: string;
  aliases: string[];
  type: 'client' | 'competitor';
}

export interface Keyword {
  id: string;
  query: string;
  category?: string;
  intent?: 'informational' | 'commercial' | 'transactional';
}

export type PromptVariant = 'minimal' | 'frontloaded' | 'stepwise';

export interface ModelConfig {
  id: string;
  provider: 'openai' | 'google' | 'anthropic' | 'deepseek';
  name: string;
  displayName: string;
  enabled: boolean;
}

export interface BrandMention {
  brandId: string;
  detected: boolean;
  position: number | null;
  numMentions: number;
  contextSnippets: string[];
}

export interface ResponseRecord {
  id: string;
  keywordId: string;
  promptVariant: PromptVariant;
  modelId: string;
  rawResponse: string;
  brandMentions: BrandMention[];
  contentQuality: ContentQuality;
  timestamp: Date;
}

export interface ContentQuality {
  readability: number;
  explanationDepth: number;
  balancedTone: number;
  overall: number;
}

export interface BrandScore {
  brandId: string;
  brandName: string;
  mentionRate: number;
  avgRank: number | null;
  qualityScore: number;
  compositeScore: number;
  status: 'success' | 'warning' | 'destructive';
}

export interface ModelResult {
  modelId: string;
  modelName: string;
  brandScores: BrandScore[];
  responseCount: number;
}

export interface ExperimentConfig {
  brands: Brand[];
  keywords: Keyword[];
  models: ModelConfig[];
  promptVariants: PromptVariant[];
  runsPerCombination: number;
}

export interface ExperimentResults {
  id: string;
  config: ExperimentConfig;
  results: ModelResult[];
  summary: string;
  createdAt: Date;
}
