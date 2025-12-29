import { supabase } from "@/integrations/supabase/client";

export interface DriveFile {
  id: string;
  name: string;
  webViewLink: string;
}

export interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// Check if Google Drive is configured (fetches from edge function)
export async function checkDriveConfigured(): Promise<{ configured: boolean; clientId: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('gdrive-upload', {
      body: { action: 'getClientId' }
    });
    
    if (error) {
      console.error('Failed to check Drive config:', error);
      return { configured: false, clientId: '' };
    }
    
    return { configured: data.configured, clientId: data.clientId };
  } catch {
    return { configured: false, clientId: '' };
  }
}

export function getAuthUrl(clientId: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<GoogleTokens> {
  const { data, error } = await supabase.functions.invoke('gdrive-upload', {
    body: {
      action: 'exchangeCode',
      code,
      redirectUri,
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function uploadToDrive(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType: string = 'text/plain',
  folderId?: string
): Promise<DriveFile> {
  const { data, error } = await supabase.functions.invoke('gdrive-upload', {
    body: {
      action: 'upload',
      accessToken,
      fileName,
      content,
      mimeType,
      folderId,
    }
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

// Local storage helpers for OAuth tokens
const TOKEN_KEY = 'gdrive_tokens';

export function getStoredTokens(): GoogleTokens | null {
  try {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) return null;
    
    const tokens = JSON.parse(stored);
    // Check if expired (with 5 min buffer)
    if (tokens.expiresAt && Date.now() > tokens.expiresAt - 300000) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
    return tokens;
  } catch {
    return null;
  }
}

export function storeTokens(tokens: GoogleTokens): void {
  const withExpiry = {
    ...tokens,
    expiresAt: Date.now() + (tokens.expires_in * 1000),
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(withExpiry));
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
}
