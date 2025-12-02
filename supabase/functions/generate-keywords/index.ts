import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateKeywordsRequest {
  seedKeyword: string;
  category?: string;
  count?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { seedKeyword, category, count = 6 } = await req.json() as GenerateKeywordsRequest;
    
    console.log(`Generating ${count} variants for seed keyword: "${seedKeyword}"`);
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert at generating search queries that people would ask AI assistants. Given a seed keyword or topic, generate diverse semantic variants that represent different ways people might ask about this topic.

Generate exactly ${count} search queries that:
1. Vary in intent (informational, commercial, transactional)
2. Include comparison queries ("best X vs Y", "compare X")
3. Include recommendation queries ("best X for [audience]")
4. Include feature-focused queries ("X with best [feature]")
5. Include use-case specific queries ("X for small business", "X for beginners")

Return ONLY a JSON array of objects with this exact structure:
[
  {"query": "the search query", "intent": "informational|commercial|transactional"}
]

Do not include any explanation, just the JSON array.`;

    const userPrompt = category 
      ? `Seed keyword: "${seedKeyword}" (Category: ${category})`
      : `Seed keyword: "${seedKeyword}"`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
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
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    console.log("Raw response:", content);
    
    // Parse the JSON response
    let keywords: { query: string; intent: string }[] = [];
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        keywords = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse keywords:", parseError);
      // Fallback: generate basic variants
      keywords = [
        { query: `best ${seedKeyword}`, intent: "commercial" },
        { query: `${seedKeyword} comparison`, intent: "informational" },
        { query: `top ${seedKeyword} for business`, intent: "commercial" },
        { query: `which ${seedKeyword} should I choose`, intent: "transactional" },
        { query: `${seedKeyword} recommendations`, intent: "commercial" },
        { query: `compare ${seedKeyword} options`, intent: "informational" },
      ].slice(0, count);
    }

    console.log(`Generated ${keywords.length} keyword variants`);

    return new Response(JSON.stringify({
      seedKeyword,
      category,
      keywords: keywords.map((k, idx) => ({
        id: crypto.randomUUID(),
        query: k.query,
        category: category || seedKeyword,
        intent: k.intent as 'informational' | 'commercial' | 'transactional',
      })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error generating keywords:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
