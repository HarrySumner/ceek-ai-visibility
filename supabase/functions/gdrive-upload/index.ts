import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Google OAuth token exchange
async function exchangeCodeForTokens(code: string, clientId: string, clientSecret: string, redirectUri: string) {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }
  
  return response.json();
}

// Upload file to Google Drive
async function uploadToDrive(accessToken: string, fileName: string, content: string, mimeType: string, folderId?: string) {
  const metadata: Record<string, unknown> = {
    name: fileName,
    mimeType: mimeType,
  };
  
  if (folderId) {
    metadata.parents = [folderId];
  }

  // Create multipart upload
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartBody = 
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary="${boundary}"`,
    },
    body: multipartBody,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Drive upload failed: ${error}`);
  }

  return response.json();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, accessToken, code, clientId, clientSecret, redirectUri, fileName, content, mimeType, folderId } = await req.json();
    console.log(`GDrive API request: action=${action}`);

    switch (action) {
      case 'exchangeCode': {
        if (!code || !clientId || !clientSecret || !redirectUri) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters for token exchange' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const tokens = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri);
        return new Response(
          JSON.stringify(tokens),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'upload': {
        if (!accessToken || !fileName || !content) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters for upload' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const file = await uploadToDrive(accessToken, fileName, content, mimeType || 'text/plain', folderId);
        console.log(`File uploaded: ${file.name} (${file.id})`);
        return new Response(
          JSON.stringify(file),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('GDrive function error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
