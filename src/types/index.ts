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
  provider: 'lovable' | 'openai' | 'google' | 'anthropic' | 'deepseek';
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

// NLP Content Quality Framework (Ghosh 2024)
export interface ContentQuality {
  // Sentiment (0.4-0.6 optimal for analytical neutrality)
  sentiment: number;
  // Readability (Flesch-Kincaid Grade Level, 8-10 optimal)
  readability: number;
  // Persuasiveness - technical vocabulary density (0.06-0.10 optimal)
  persuasiveness: number;
  // Clarity - inverse word length (higher = clearer)
  clarity: number;
  // Emotional appeal - emotional word density (0.01-0.03 optimal)
  emotionalAppeal: number;
  // Explanatory directiveness - directive phrase density (0.10-0.30 optimal)
  explanatoryDirectiveness: number;
  // Overall composite score (0-1)
  overall: number;
}

export interface BrandScore {
  brandId: string;
  brandName: string;
  mentionRate: number;
  avgRank: number | null;
  qualityScore: number;
  compositeScore: number;
  // Precision, Recall, F1 metrics
  precision?: number;
  recall?: number;
  f1?: number;
  status: 'success' | 'warning' | 'destructive';
}

export interface ModelResult {
  modelId: string;
  modelName: string;
  brandScores: BrandScore[];
  responseCount: number;
  avgContentQuality?: ContentQuality;
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

// Scoring weights configuration
export interface ScoringWeights {
  mentionWeight: number; // default 0.4
  rankWeight: number; // default 0.3
  qualityWeight: number; // default 0.3
}
