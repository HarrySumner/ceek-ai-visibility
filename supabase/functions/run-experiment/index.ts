import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Brand {
  id: string;
  name: string;
  aliases: string[];
  type: 'client' | 'competitor';
}

interface BrandMentionResult {
  detected: boolean;
  position: number | null;
  numMentions: number;
  contextSnippets: string[];
  confidence: number;
  disambiguationNotes: string[];
}

interface ExperimentRequest {
  keyword: string;
  brands: Brand[];
  modelId: string;
  promptVariant: 'minimal' | 'frontloaded' | 'stepwise';
}

// Map model IDs to Lovable AI gateway models
const MODEL_MAP: Record<string, string> = {
  'gemini-2.5-flash': 'google/gemini-2.5-flash',
  'gemini-2.5-pro': 'google/gemini-2.5-pro',
  'gpt-5': 'openai/gpt-5',
  'gpt-5-mini': 'openai/gpt-5-mini',
};

// Common words that might be brand names but are also generic terms
const AMBIGUOUS_TERMS: Record<string, string[]> = {
  'apple': ['iphone', 'ipad', 'mac', 'ios', 'itunes', 'airpods', 'macbook', 'apple inc', 'cupertino'],
  'amazon': ['aws', 'prime', 'alexa', 'kindle', 'echo', 'bezos', 'e-commerce'],
  'target': ['store', 'retail', 'bullseye', 'shopping'],
  'delta': ['airline', 'flight', 'skymiles', 'airport'],
  'shell': ['gas', 'station', 'oil', 'petrol', 'fuel'],
  'sprint': ['mobile', 'carrier', 'phone', 't-mobile'],
  'visa': ['card', 'payment', 'credit', 'debit', 'mastercard'],
  'oracle': ['database', 'software', 'cloud', 'java'],
  'uber': ['ride', 'driver', 'lyft', 'taxi', 'eats'],
};

function buildPrompt(keyword: string, brands: Brand[], variant: 'minimal' | 'frontloaded' | 'stepwise'): string {
  const brandNames = brands.map(b => b.name).join(', ');
  
  switch (variant) {
    case 'minimal':
      return `${keyword}`;
    
    case 'frontloaded':
      return `Please answer the following question and provide a structured comparison if multiple options exist. Use a table or checklist format where appropriate.

Question: ${keyword}

Consider these brands if relevant: ${brandNames}`;
    
    case 'stepwise':
      return `I need help with the following question. Please approach this systematically:

1. First, identify the key criteria that matter for this decision
2. Then, evaluate the available options against these criteria
3. Finally, provide your recommendation with reasoning

Question: ${keyword}

Brands to consider: ${brandNames}`;
    
    default:
      return keyword;
  }
}

/**
 * Enhanced brand detection with context disambiguation
 */
function detectBrandMentions(response: string, brands: Brand[]): Record<string, BrandMentionResult> {
  const mentions: Record<string, BrandMentionResult> = {};
  const responseLower = response.toLowerCase();
  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  for (const brand of brands) {
    const namesToCheck = [brand.name, ...brand.aliases];
    const result: BrandMentionResult = {
      detected: false,
      position: null,
      numMentions: 0,
      contextSnippets: [],
      confidence: 0,
      disambiguationNotes: [],
    };
    
    let totalMatches = 0;
    let confidenceFactors: number[] = [];
    
    for (const name of namesToCheck) {
      const nameLower = name.toLowerCase();
      
      // Skip very short names (likely abbreviations that need context)
      if (nameLower.length < 2) continue;
      
      // Create word boundary regex for exact matching
      const wordBoundaryRegex = new RegExp(`\\b${escapeRegex(nameLower)}\\b`, 'gi');
      const matches = response.match(wordBoundaryRegex);
      
      if (matches && matches.length > 0) {
        totalMatches += matches.length;
        result.detected = true;
        
        // Check disambiguation for ambiguous terms
        const disambiguationResult = checkDisambiguation(nameLower, response);
        confidenceFactors.push(disambiguationResult.confidence);
        
        if (disambiguationResult.notes.length > 0) {
          result.disambiguationNotes.push(...disambiguationResult.notes);
        }
        
        // Find position in ranked lists
        const rankPosition = findRankPosition(nameLower, response);
        if (rankPosition !== null && (result.position === null || rankPosition < result.position)) {
          result.position = rankPosition;
        }
        
        // Extract context snippets
        const snippets = extractContextSnippets(name, response, sentences);
        for (const snippet of snippets) {
          if (result.contextSnippets.length < 3 && !result.contextSnippets.includes(snippet)) {
            result.contextSnippets.push(snippet);
          }
        }
        
        // Boost confidence for capitalized matches (more likely to be brand names)
        const capitalizedRegex = new RegExp(`\\b${escapeRegex(name)}\\b`, 'g');
        const capitalizedMatches = response.match(capitalizedRegex);
        if (capitalizedMatches && capitalizedMatches.length > 0) {
          confidenceFactors.push(0.9); // High confidence for exact case match
        }
      }
    }
    
    result.numMentions = totalMatches;
    
    // Calculate overall confidence
    if (confidenceFactors.length > 0) {
      result.confidence = confidenceFactors.reduce((a, b) => a + b, 0) / confidenceFactors.length;
    }
    
    // Boost confidence if mentioned multiple times
    if (totalMatches >= 3) {
      result.confidence = Math.min(1, result.confidence + 0.1);
    }
    
    // Boost confidence if found in a ranked position
    if (result.position !== null) {
      result.confidence = Math.min(1, result.confidence + 0.15);
    }
    
    mentions[brand.id] = result;
  }
  
  return mentions;
}

/**
 * Check if an ambiguous term is being used as a brand name or generic word
 */
function checkDisambiguation(term: string, response: string): { confidence: number; notes: string[] } {
  const responseLower = response.toLowerCase();
  const contextTerms = AMBIGUOUS_TERMS[term];
  const notes: string[] = [];
  
  // If not in our ambiguous list, assume high confidence
  if (!contextTerms) {
    return { confidence: 0.85, notes: [] };
  }
  
  // Check for brand-related context clues
  let brandContextScore = 0;
  let genericContextScore = 0;
  
  for (const contextTerm of contextTerms) {
    if (responseLower.includes(contextTerm)) {
      brandContextScore++;
    }
  }
  
  // Check for generic usage patterns
  if (term === 'apple' && responseLower.includes('fruit')) {
    genericContextScore += 2;
    notes.push('Possible generic fruit reference detected');
  }
  if (term === 'target' && responseLower.includes('goal')) {
    genericContextScore += 2;
    notes.push('Possible generic goal/aim reference detected');
  }
  if (term === 'shell' && (responseLower.includes('command') || responseLower.includes('script'))) {
    genericContextScore += 2;
    notes.push('Possible command shell reference detected');
  }
  
  // Calculate confidence based on context balance
  const totalContext = brandContextScore + genericContextScore;
  if (totalContext === 0) {
    return { confidence: 0.6, notes: ['No strong context clues found'] };
  }
  
  const brandRatio = brandContextScore / (brandContextScore + genericContextScore);
  const confidence = 0.5 + (brandRatio * 0.4); // Range: 0.5 to 0.9
  
  if (brandContextScore > genericContextScore) {
    notes.push(`Brand context detected (${brandContextScore} clues)`);
  } else if (genericContextScore > brandContextScore) {
    notes.push(`Generic usage possible (${genericContextScore} indicators)`);
  }
  
  return { confidence, notes };
}

/**
 * Find the position of a brand in a ranked list (1., 2., etc.)
 */
function findRankPosition(brandName: string, response: string): number | null {
  const brandLower = brandName.toLowerCase();
  
  // Pattern 1: Numbered lists (1., 2., etc.)
  const numberedPattern = new RegExp(
    `(^|\\n)\\s*(\\d+)\\.?\\s*[^\\n]*?\\b${escapeRegex(brandLower)}\\b`,
    'gim'
  );
  const numberedMatch = numberedPattern.exec(response);
  if (numberedMatch) {
    return parseInt(numberedMatch[2]);
  }
  
  // Pattern 2: Bullet points with ordinal context
  const bulletPattern = new RegExp(
    `[-•*]\\s*(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th)[^\\n]*?\\b${escapeRegex(brandLower)}\\b`,
    'gim'
  );
  const bulletMatch = bulletPattern.exec(response);
  if (bulletMatch) {
    const ordinal = bulletMatch[1].toLowerCase();
    const ordinalMap: Record<string, number> = {
      'first': 1, '1st': 1,
      'second': 2, '2nd': 2,
      'third': 3, '3rd': 3,
      'fourth': 4, '4th': 4,
      'fifth': 5, '5th': 5,
    };
    return ordinalMap[ordinal] || null;
  }
  
  // Pattern 3: "Top X" or "Best X" followed by brand
  const topPattern = new RegExp(
    `(top|best|number)\\s*(\\d+|one|two|three)[^\\n]*?\\b${escapeRegex(brandLower)}\\b`,
    'gim'
  );
  if (topPattern.test(response)) {
    return 1; // Assume top position if mentioned in "top/best" context
  }
  
  return null;
}

/**
 * Extract context snippets around brand mentions
 */
function extractContextSnippets(brandName: string, response: string, sentences: string[]): string[] {
  const snippets: string[] = [];
  const brandLower = brandName.toLowerCase();
  
  for (const sentence of sentences) {
    if (sentence.toLowerCase().includes(brandLower)) {
      const trimmed = sentence.trim();
      if (trimmed.length > 20 && trimmed.length < 300) {
        snippets.push(trimmed);
      }
    }
  }
  
  return snippets;
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// NLP Content Quality Analysis (Ghosh 2024 framework)
function analyzeContentQuality(response: string) {
  const words = response.split(/\s+/).filter(w => w.length > 0);
  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const wordCount = words.length;
  const sentenceCount = sentences.length || 1;
  
  // 1. Sentiment approximation (neutral = 0.5)
  const positiveWords = ['best', 'excellent', 'great', 'recommended', 'top', 'quality', 'reliable', 'trusted', 'leading', 'popular', 'effective'];
  const negativeWords = ['worst', 'avoid', 'poor', 'bad', 'unreliable', 'expensive', 'limited', 'issues', 'problems', 'concerns'];
  const posCount = words.filter(w => positiveWords.includes(w.toLowerCase())).length;
  const negCount = words.filter(w => negativeWords.includes(w.toLowerCase())).length;
  const sentiment = wordCount > 0 ? 0.5 + (posCount - negCount) / (wordCount * 2) : 0.5;
  
  // 2. Readability (Flesch-Kincaid approximation)
  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0) / (wordCount || 1);
  const readability = Math.max(0, Math.min(20, 0.39 * avgWordsPerSentence + 11.8 * avgSyllables - 15.59));
  
  // 3. Persuasiveness (technical vocabulary density)
  const technicalWords = ['analysis', 'compare', 'evaluate', 'criteria', 'metrics', 'performance', 'features', 'specifications', 'benchmark', 'assessment'];
  const technicalCount = words.filter(w => technicalWords.includes(w.toLowerCase())).length;
  const persuasiveness = wordCount > 0 ? technicalCount / wordCount : 0;
  
  // 4. Clarity (inverse of average word length, normalized)
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (wordCount || 1);
  const clarity = Math.max(0, Math.min(1, 1 - (avgWordLength - 4) / 10));
  
  // 5. Emotional appeal (emotional word density)
  const emotionalWords = ['amazing', 'love', 'hate', 'terrible', 'wonderful', 'fantastic', 'awful', 'incredible', 'perfect', 'disaster'];
  const emotionalCount = words.filter(w => emotionalWords.includes(w.toLowerCase())).length;
  const emotionalAppeal = wordCount > 0 ? emotionalCount / wordCount : 0;
  
  // 6. Explanatory directiveness (directive phrase density)
  const directivePhrases = ['should', 'recommend', 'suggest', 'consider', 'choose', 'opt for', 'go with', 'select', 'prefer', 'ideal for'];
  const directiveCount = directivePhrases.filter(phrase => response.toLowerCase().includes(phrase)).length;
  const explanatoryDirectiveness = wordCount > 0 ? (directiveCount * 5) / wordCount : 0;
  
  // 7. Structure detection
  const hasTable = /\|.*\|.*\|/m.test(response) || /\t.*\t/m.test(response);
  const hasNumberedList = /^\s*\d+\./m.test(response);
  const hasBulletList = /^\s*[-•*]/m.test(response);
  const hasComparison = /compar|versus|vs\.?|better than|worse than/i.test(response);
  
  // Overall composite score
  const sentimentScore = 1 - Math.abs(sentiment - 0.5) * 2;
  const readabilityScore = readability >= 8 && readability <= 12 ? 1 : Math.max(0, 1 - Math.abs(readability - 10) / 6);
  const persuasivenessScore = persuasiveness >= 0.04 && persuasiveness <= 0.12 ? 1 : Math.max(0, 1 - Math.abs(persuasiveness - 0.08) * 10);
  const clarityScore = clarity;
  const emotionalScore = emotionalAppeal <= 0.03 ? 1 : Math.max(0, 1 - (emotionalAppeal - 0.03) * 20);
  const directivenessScore = explanatoryDirectiveness >= 0.08 && explanatoryDirectiveness <= 0.35 ? 1 : Math.max(0, 1 - Math.abs(explanatoryDirectiveness - 0.20) * 4);
  
  // Bonus for structured responses
  const structureBonus = (hasTable ? 0.05 : 0) + (hasNumberedList ? 0.03 : 0) + (hasBulletList ? 0.02 : 0) + (hasComparison ? 0.03 : 0);
  
  const overall = Math.min(1, (sentimentScore + readabilityScore + persuasivenessScore + clarityScore + emotionalScore + directivenessScore) / 6 + structureBonus);
  
  return {
    sentiment: Math.round(sentiment * 100) / 100,
    readability: Math.round(readability * 10) / 10,
    persuasiveness: Math.round(persuasiveness * 1000) / 1000,
    clarity: Math.round(clarity * 100) / 100,
    emotionalAppeal: Math.round(emotionalAppeal * 1000) / 1000,
    explanatoryDirectiveness: Math.round(explanatoryDirectiveness * 1000) / 1000,
    overall: Math.round(overall * 100) / 100,
    structureMarkers: {
      hasTable,
      hasNumberedList,
      hasBulletList,
      hasComparison,
    },
  };
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  const vowels = word.match(/[aeiouy]+/g);
  return vowels ? vowels.length : 1;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { keyword, brands, modelId, promptVariant } = await req.json() as ExperimentRequest;
    
    console.log(`Running experiment: model=${modelId}, variant=${promptVariant}, keyword="${keyword.substring(0, 50)}..."`);
    console.log(`Tracking ${brands.length} brands`);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const gatewayModel = MODEL_MAP[modelId] || 'google/gemini-2.5-flash';
    const prompt = buildPrompt(keyword, brands, promptVariant);
    
    console.log(`Using gateway model: ${gatewayModel}`);
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: gatewayModel,
        messages: [
          { 
            role: "system", 
            content: "You are a helpful assistant that provides balanced, informative comparisons and recommendations. Be objective and consider multiple perspectives. When comparing options, use clear structure like numbered lists or tables when appropriate." 
          },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const rawResponse = data.choices?.[0]?.message?.content || "";
    
    console.log(`Response received: ${rawResponse.length} characters`);
    
    // Enhanced brand mention detection
    const brandMentions = detectBrandMentions(rawResponse, brands);
    
    // Content quality analysis
    const contentQuality = analyzeContentQuality(rawResponse);
    
    // Log detection summary
    for (const [brandId, mention] of Object.entries(brandMentions)) {
      if (mention.detected) {
        console.log(`Brand ${brandId}: detected=${mention.detected}, position=${mention.position}, confidence=${mention.confidence.toFixed(2)}, mentions=${mention.numMentions}`);
      }
    }
    
    return new Response(JSON.stringify({
      rawResponse,
      brandMentions,
      contentQuality,
      modelId,
      promptVariant,
      keyword,
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Error in run-experiment function:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
