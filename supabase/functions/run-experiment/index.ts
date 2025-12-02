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

function detectBrandMentions(response: string, brands: Brand[]) {
  const mentions: Record<string, { detected: boolean; position: number | null; numMentions: number; contextSnippets: string[] }> = {};
  
  const responseLower = response.toLowerCase();
  const sentences = response.split(/[.!?]+/);
  
  for (const brand of brands) {
    const namesToCheck = [brand.name, ...brand.aliases];
    let detected = false;
    let firstPosition: number | null = null;
    let numMentions = 0;
    const contextSnippets: string[] = [];
    
    for (const name of namesToCheck) {
      const nameLower = name.toLowerCase();
      const regex = new RegExp(`\\b${nameLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = response.match(regex);
      
      if (matches) {
        detected = true;
        numMentions += matches.length;
        
        // Find position in ranked lists (1., 2., etc.)
        const rankMatch = response.match(new RegExp(`(\\d+)\\.?\\s*[^.]*${nameLower}`, 'i'));
        if (rankMatch && firstPosition === null) {
          firstPosition = parseInt(rankMatch[1]);
        }
        
        // Extract context snippets
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes(nameLower) && contextSnippets.length < 2) {
            contextSnippets.push(sentence.trim());
          }
        }
      }
    }
    
    mentions[brand.id] = { detected, position: firstPosition, numMentions, contextSnippets };
  }
  
  return mentions;
}

// NLP Content Quality Analysis (Ghosh 2024 framework)
function analyzeContentQuality(response: string) {
  const words = response.split(/\s+/).filter(w => w.length > 0);
  const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const wordCount = words.length;
  const sentenceCount = sentences.length || 1;
  
  // 1. Sentiment approximation (neutral = 0.5)
  const positiveWords = ['best', 'excellent', 'great', 'recommended', 'top', 'quality', 'reliable', 'trusted'];
  const negativeWords = ['worst', 'avoid', 'poor', 'bad', 'unreliable', 'expensive', 'limited'];
  const posCount = words.filter(w => positiveWords.includes(w.toLowerCase())).length;
  const negCount = words.filter(w => negativeWords.includes(w.toLowerCase())).length;
  const sentiment = wordCount > 0 ? 0.5 + (posCount - negCount) / (wordCount * 2) : 0.5;
  
  // 2. Readability (Flesch-Kincaid approximation)
  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0) / (wordCount || 1);
  const readability = Math.max(0, Math.min(20, 0.39 * avgWordsPerSentence + 11.8 * avgSyllables - 15.59));
  
  // 3. Persuasiveness (technical vocabulary density)
  const technicalWords = ['analysis', 'compare', 'evaluate', 'criteria', 'metrics', 'performance', 'features', 'specifications'];
  const technicalCount = words.filter(w => technicalWords.includes(w.toLowerCase())).length;
  const persuasiveness = wordCount > 0 ? technicalCount / wordCount : 0;
  
  // 4. Clarity (inverse of average word length, normalized)
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / (wordCount || 1);
  const clarity = Math.max(0, Math.min(1, 1 - (avgWordLength - 4) / 10));
  
  // 5. Emotional appeal (emotional word density)
  const emotionalWords = ['amazing', 'love', 'hate', 'terrible', 'wonderful', 'fantastic', 'awful', 'incredible'];
  const emotionalCount = words.filter(w => emotionalWords.includes(w.toLowerCase())).length;
  const emotionalAppeal = wordCount > 0 ? emotionalCount / wordCount : 0;
  
  // 6. Explanatory directiveness (directive phrase density)
  const directivePhrases = ['should', 'recommend', 'suggest', 'consider', 'choose', 'opt for', 'go with', 'select'];
  const directiveCount = directivePhrases.filter(phrase => response.toLowerCase().includes(phrase)).length;
  const explanatoryDirectiveness = wordCount > 0 ? (directiveCount * 5) / wordCount : 0;
  
  // Overall composite score
  // Penalize extremes: optimal sentiment is 0.4-0.6, readability 8-10, etc.
  const sentimentScore = 1 - Math.abs(sentiment - 0.5) * 2;
  const readabilityScore = readability >= 8 && readability <= 10 ? 1 : Math.max(0, 1 - Math.abs(readability - 9) / 5);
  const persuasivenessScore = persuasiveness >= 0.06 && persuasiveness <= 0.10 ? 1 : Math.max(0, 1 - Math.abs(persuasiveness - 0.08) * 10);
  const clarityScore = clarity;
  const emotionalScore = emotionalAppeal <= 0.03 ? 1 : Math.max(0, 1 - (emotionalAppeal - 0.03) * 20);
  const directivenessScore = explanatoryDirectiveness >= 0.10 && explanatoryDirectiveness <= 0.30 ? 1 : Math.max(0, 1 - Math.abs(explanatoryDirectiveness - 0.20) * 5);
  
  const overall = (sentimentScore + readabilityScore + persuasivenessScore + clarityScore + emotionalScore + directivenessScore) / 6;
  
  return {
    sentiment: Math.round(sentiment * 100) / 100,
    readability: Math.round(readability * 10) / 10,
    persuasiveness: Math.round(persuasiveness * 1000) / 1000,
    clarity: Math.round(clarity * 100) / 100,
    emotionalAppeal: Math.round(emotionalAppeal * 1000) / 1000,
    explanatoryDirectiveness: Math.round(explanatoryDirectiveness * 1000) / 1000,
    overall: Math.round(overall * 100) / 100,
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
    
    console.log(`Running experiment: model=${modelId}, variant=${promptVariant}, keyword="${keyword}"`);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const gatewayModel = MODEL_MAP[modelId] || 'google/gemini-2.5-flash';
    const prompt = buildPrompt(keyword, brands, promptVariant);
    
    console.log(`Using gateway model: ${gatewayModel}`);
    console.log(`Prompt: ${prompt.substring(0, 200)}...`);
    
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
            content: "You are a helpful assistant that provides balanced, informative comparisons and recommendations. Be objective and consider multiple perspectives." 
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
    
    console.log(`Response received: ${rawResponse.substring(0, 200)}...`);
    
    // Analyze response
    const brandMentions = detectBrandMentions(rawResponse, brands);
    const contentQuality = analyzeContentQuality(rawResponse);
    
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
