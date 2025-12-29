import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const KEYWORD_API_BASE = 'https://app.keyword.com/api/v2';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('KEYWORD_COM_API_KEY');
    if (!apiKey) {
      console.error('KEYWORD_COM_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, groupName, params } = await req.json();
    console.log(`Keyword API request: action=${action}, groupName=${groupName}`);

    let endpoint: string;
    const method = 'GET';

    switch (action) {
      case 'getGroups':
        // List all groups (projects) in the account
        endpoint = '/groups';
        break;
      case 'getKeywords':
        if (!groupName) {
          return new Response(
            JSON.stringify({ error: 'groupName required for getKeywords' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // Get keywords for a specific group
        endpoint = `/groups/${encodeURIComponent(groupName)}/keywords`;
        break;
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    // Build URL with query params
    const url = new URL(`${KEYWORD_API_BASE}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    console.log(`Fetching: ${url.toString()}`);

    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const responseText = await response.text();
    console.log(`Response status: ${response.status}, length: ${responseText.length}`);

    if (!response.ok) {
      console.error(`Keyword API error: ${responseText}`);
      return new Response(
        JSON.stringify({ error: `API error: ${response.status}`, details: responseText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    console.log(`Returning data with ${Array.isArray(data?.data) ? data.data.length : 'unknown'} items`);

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Edge function error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
