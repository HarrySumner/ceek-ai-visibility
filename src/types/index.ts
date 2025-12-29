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

export type IndustryVertical = 
  | 'travel-tourism'
  | 'hospitality-events'
  | 'lifestyle-leisure'
  | 'food-beverage'
  | 'construction-realestate'
  | 'health-wellness';

export const INDUSTRY_VERTICALS: { id: IndustryVertical; label: string; icon: string }[] = [
  { id: 'travel-tourism', label: 'Travel & Tourism', icon: '✈️' },
  { id: 'hospitality-events', label: 'Hospitality & Events', icon: '🏨' },
  { id: 'lifestyle-leisure', label: 'Lifestyle & Leisure', icon: '🎯' },
  { id: 'food-beverage', label: 'Food & Beverage', icon: '🍽️' },
  { id: 'construction-realestate', label: 'Construction & Real Estate', icon: '🏗️' },
  { id: 'health-wellness', label: 'Health & Wellness', icon: '💪' },
];

export interface ExperimentContext {
  industry: IndustryVertical | null;
  positioning: string;
  competitors: string[];
}

export interface ModelConfig {
  id: string;
  provider: 'lovable' | 'openai' | 'google' | 'anthropic' | 'deepseek';
  name: string;
  displayName: string;
  enabled: boolean;
  color?: string;
}

export interface BrandMention {
  brandId: string;
  detected: boolean;
  position: number | null;
  numMentions: number;
  contextSnippets: string[];
  confidence: number;
  disambiguationNotes: string[];
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

export interface Recommendation {
  id: string;
  type: 'opportunity' | 'warning' | 'strength';
  title: string;
  description: string;
  metric: string;
  impact: 'high' | 'medium' | 'low';
  models: string[];
}

export interface ExperimentConfig {
  brands: Brand[];
  keywords: Keyword[];
  models: ModelConfig[];
  promptVariants: PromptVariant[];
  runsPerCombination: number;
  context?: ExperimentContext;
}

export interface ExperimentResults {
  id: string;
  config: ExperimentConfig;
  results: ModelResult[];
  recommendations: Recommendation[];
  summary: string;
  createdAt: Date;
}

// Scoring weights configuration
export interface ScoringWeights {
  mentionWeight: number; // default 0.4
  rankWeight: number; // default 0.3
  qualityWeight: number; // default 0.3
}

// Keyword.com integration types
export interface KeywordProject {
  id: string;
  name: string;
  keywordCount: number;
  domain?: string;
}

export interface KeywordData {
  id: string;
  keyword: string;
  monthlyVolume: number;
  annualVolume: number;
  rank: number | null;
  cpc: number;
  competition: 'low' | 'medium' | 'high';
  trend: number; // percentage change
}

export interface SEOInsight {
  brandId: string;
  brandName: string;
  keywords: KeywordData[];
  totalVolume: number;
  avgRank: number | null;
  aiVisibility: number;
  opportunityScore: 'high' | 'medium' | 'low';
  recommendation: string;
}
