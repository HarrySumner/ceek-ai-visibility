import { supabase } from "@/integrations/supabase/client";
import { KeywordProject, KeywordData } from "@/types";

interface KeywordApiGroupAttributes {
  name: string;
  keywords_count?: Record<string, number> | number[];
  keyword_count?: number;
  url?: string;
}

interface KeywordApiGroup {
  id: string;
  type: string;
  attributes: KeywordApiGroupAttributes;
}

interface KeywordApiKeywordAttributes {
  keyword: string;
  search_volume?: number;
  monthly_search_volume?: number;
  volume?: number;
  latest_ranking?: number | null;
  rank?: number | null;
  position?: number | null;
  cpc?: number;
  competition?: string | number;
  trend?: number;
}

interface KeywordApiKeyword {
  id: string | number;
  type: string;
  attributes: KeywordApiKeywordAttributes;
}

export async function getProjects(): Promise<KeywordProject[]> {
  const { data, error } = await supabase.functions.invoke('keyword-api', {
    body: { action: 'getGroups' }
  });

  if (error) {
    console.error('Failed to fetch groups:', error);
    throw new Error(error.message);
  }

  // Transform API response to our format
  // Keyword.com API returns { data: [{ id: "GroupName", attributes: {...} }] }
  const groups: KeywordApiGroup[] = data?.data || [];
  
  return groups.map((g) => {
    // keywords_count can be an object like { "ARCHIVED": 16 } or empty array
    let keywordCount = 0;
    const kwCount = g.attributes?.keywords_count;
    if (kwCount && typeof kwCount === 'object' && !Array.isArray(kwCount)) {
      // Sum all keyword counts from the object
      keywordCount = Object.values(kwCount).reduce((sum: number, val: number) => sum + val, 0);
    } else if (typeof kwCount === 'number') {
      keywordCount = kwCount;
    }

    return {
      id: g.id, // Use id (which is the group name) for fetching keywords
      name: g.attributes?.name || g.id,
      keywordCount,
      domain: g.attributes?.url,
    };
  });
}

export async function getKeywords(groupName: string): Promise<KeywordData[]> {
  const { data, error } = await supabase.functions.invoke('keyword-api', {
    body: { 
      action: 'getKeywords', 
      groupName,
    }
  });

  if (error) {
    console.error('Failed to fetch keywords:', error);
    throw new Error(error.message);
  }

  // Transform API response
  const keywords: KeywordApiKeyword[] = data?.data || [];
  
  return keywords.map((k) => {
    const attrs: KeywordApiKeywordAttributes = k.attributes || { keyword: '' };
    const volume = attrs.search_volume || attrs.monthly_search_volume || attrs.volume || 0;
    
    return {
      id: String(k.id),
      keyword: attrs.keyword || '',
      monthlyVolume: volume,
      annualVolume: volume * 12,
      rank: attrs.latest_ranking || attrs.rank || attrs.position || null,
      cpc: attrs.cpc || 0,
      competition: parseCompetition(attrs.competition),
      trend: attrs.trend || 0,
    };
  });
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
