import { supabase } from "@/integrations/supabase/client";
import { KeywordProject, KeywordData } from "@/types";

export async function getProjects(): Promise<KeywordProject[]> {
  const { data, error } = await supabase.functions.invoke('keyword-api', {
    body: { action: 'getProjects' }
  });

  if (error) {
    console.error('Failed to fetch projects:', error);
    throw new Error(error.message);
  }

  // Transform API response to our format
  const projects = data?.projects || data?.data || [];
  return projects.map((p: { id: string; name: string; keyword_count?: number; keywords_count?: number; domain?: string }) => ({
    id: String(p.id),
    name: p.name,
    keywordCount: p.keyword_count || p.keywords_count || 0,
    domain: p.domain,
  }));
}

export async function getKeywords(projectId: string): Promise<KeywordData[]> {
  const { data, error } = await supabase.functions.invoke('keyword-api', {
    body: { 
      action: 'getKeywordData', 
      projectId,
      params: { limit: 500 }
    }
  });

  if (error) {
    console.error('Failed to fetch keywords:', error);
    throw new Error(error.message);
  }

  // Transform API response
  const keywords = data?.keywords || data?.data || [];
  return keywords.map((k: { 
    id: string; 
    keyword: string; 
    search_volume?: number; 
    monthly_volume?: number;
    volume?: number;
    rank?: number | null;
    position?: number | null;
    cpc?: number;
    competition?: string | number;
    trend?: number;
  }) => ({
    id: String(k.id),
    keyword: k.keyword,
    monthlyVolume: k.search_volume || k.monthly_volume || k.volume || 0,
    annualVolume: (k.search_volume || k.monthly_volume || k.volume || 0) * 12,
    rank: k.rank || k.position || null,
    cpc: k.cpc || 0,
    competition: parseCompetition(k.competition),
    trend: k.trend || 0,
  }));
}

function parseCompetition(value: string | number | undefined): 'low' | 'medium' | 'high' {
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    if (lower === 'high' || lower === 'h') return 'high';
    if (lower === 'medium' || lower === 'med' || lower === 'm') return 'medium';
    return 'low';
  }
  if (typeof value === 'number') {
    if (value > 0.66) return 'high';
    if (value > 0.33) return 'medium';
    return 'low';
  }
  return 'low';
}

export function formatVolume(volume: number): string {
  if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
  return String(volume);
}
