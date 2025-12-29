import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { FileJson, FileSpreadsheet, FileText, Download, Cloud, LogIn, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelResult, Brand, Keyword } from "@/types";
import { toast } from "sonner";
import { 
  checkDriveConfigured,
  getAuthUrl, 
  uploadToDrive, 
  getStoredTokens, 
  clearTokens,
  storeTokens,
  exchangeCodeForTokens
} from "@/lib/gdriveApi";

interface ExportPanelEnhancedProps {
  results: ModelResult[];
  brands: Brand[];
  keywords: Keyword[];
}

const EXPORT_OPTIONS = [
  { 
    id: 'json', 
    name: 'JSON', 
    icon: FileJson, 
    description: 'Full data export with all metadata',
    extension: '.json',
    mimeType: 'application/json',
  },
  { 
    id: 'csv', 
    name: 'CSV', 
    icon: FileSpreadsheet, 
    description: 'Spreadsheet-compatible format',
    extension: '.csv',
    mimeType: 'text/csv',
  },
  { 
    id: 'report', 
    name: 'Report', 
    icon: FileText, 
    description: 'Human-readable summary document',
    extension: '.md',
    mimeType: 'text/markdown',
  },
];

export function ExportPanelEnhanced({ results, brands, keywords }: ExportPanelEnhancedProps) {
  const [driveEnabled, setDriveEnabled] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [driveConfigured, setDriveConfigured] = useState(false);
  const [clientId, setClientId] = useState('');
  const [checkingConfig, setCheckingConfig] = useState(true);
  
  const hasResults = results.length > 0;

  // Check if Drive is configured and for stored tokens
  useEffect(() => {
    async function init() {
      setCheckingConfig(true);
      const { configured, clientId: cid } = await checkDriveConfigured();
      setDriveConfigured(configured);
      setClientId(cid);
      
      const tokens = getStoredTokens();
      if (tokens) {
        setIsSignedIn(true);
      }
      setCheckingConfig(false);
    }
    init();
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code) {
      handleOAuthCallback(code);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleOAuthCallback = async (code: string) => {
    try {
      const redirectUri = window.location.origin + window.location.pathname;
      const tokens = await exchangeCodeForTokens(code, redirectUri);
      storeTokens(tokens);
      setIsSignedIn(true);
      toast.success("Signed in to Google Drive");
    } catch (error) {
      console.error('OAuth error:', error);
      toast.error("Failed to sign in to Google Drive");
    }
  };

  const handleSignIn = () => {
    if (!clientId) {
      toast.error("Google Drive not configured");
      return;
    }
    const redirectUri = window.location.origin + window.location.pathname;
    const url = getAuthUrl(clientId, redirectUri);
    window.location.href = url;
  };

  const handleSignOut = () => {
    clearTokens();
    setIsSignedIn(false);
    setDriveEnabled(false);
    toast.success("Signed out of Google Drive");
  };

  const generateContent = (format: string): { content: string; filename: string } => {
    const timestamp = Date.now();
    
    switch (format) {
      case 'json':
        return {
          content: JSON.stringify({ results, brands, keywords, exportedAt: new Date().toISOString() }, null, 2),
          filename: `brand-ceeker-export-${timestamp}.json`,
        };
      
      case 'csv': {
        const headers = ['Model', 'Brand', 'Mention Rate', 'Avg Rank', 'Quality Score', 'Composite Score'];
        const rows = results.flatMap(r => 
          r.brandScores.map(bs => [
            r.modelName,
            bs.brandName,
            (bs.mentionRate * 100).toFixed(1) + '%',
            bs.avgRank?.toFixed(1) || 'N/A',
            (bs.qualityScore * 100).toFixed(1) + '%',
            (bs.compositeScore * 100).toFixed(1) + '%',
          ].join(','))
        );
        return {
          content: [headers.join(','), ...rows].join('\n'),
          filename: `brand-ceeker-export-${timestamp}.csv`,
        };
      }
      
      case 'report':
        return {
          content: generateReport(results, brands),
          filename: `brand-ceeker-report-${timestamp}.md`,
        };
      
      default:
        return { content: '', filename: '' };
    }
  };

  const downloadLocally = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async (format: string) => {
    if (!hasResults) {
      toast.error("No results to export. Run an experiment first.");
      return;
    }

    const option = EXPORT_OPTIONS.find(o => o.id === format);
    if (!option) return;

    const { content, filename } = generateContent(format);

    // Always download locally
    downloadLocally(content, filename, option.mimeType);

    // Upload to Drive if enabled
    if (driveEnabled && isSignedIn) {
      setUploading(format);
      try {
        const tokens = getStoredTokens();
        if (!tokens) {
          throw new Error("No valid tokens");
        }

        const file = await uploadToDrive(tokens.access_token, filename, content, option.mimeType);
        
        toast.success(`Uploaded to Google Drive`, {
          action: {
            label: "Open",
            onClick: () => window.open(file.webViewLink, '_blank'),
          },
        });
      } catch (error) {
        console.error('Drive upload failed:', error);
        toast.error("Drive upload failed, but file was downloaded locally");
      } finally {
        setUploading(null);
      }
    } else {
      toast.success(`Exported as ${format.toUpperCase()}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Google Drive Integration Card */}
      {!checkingConfig && driveConfigured && (
        <Card className="p-6 bg-secondary/30 border-border animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Cloud className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold">Google Drive Integration</h4>
                <p className="text-sm text-muted-foreground">
                  {isSignedIn ? 'Connected - exports will upload to Drive' : 'Sign in to upload exports directly to Drive'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isSignedIn && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="drive-toggle"
                    checked={driveEnabled}
                    onCheckedChange={setDriveEnabled}
                  />
                  <Label htmlFor="drive-toggle" className="text-sm">
                    Upload to Drive
                  </Label>
                </div>
              )}

              <Button
                variant={isSignedIn ? "outline" : "default"}
                onClick={isSignedIn ? handleSignOut : handleSignIn}
              >
                {isSignedIn ? (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!checkingConfig && !driveConfigured && (
        <Card className="p-6 bg-secondary/20 border-border animate-fade-in">
          <div className="flex items-center gap-4">
            <Cloud className="w-6 h-6 text-muted-foreground" />
            <div>
              <h4 className="font-medium text-muted-foreground">Google Drive Not Configured</h4>
              <p className="text-sm text-muted-foreground">
                Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET secrets to enable Drive uploads
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Export Options */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">Data</p>
        <h3 className="text-2xl mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>Export Results</h3>

        <div className="space-y-3">
          {EXPORT_OPTIONS.map((option, idx) => {
            const Icon = option.icon;
            const isUploading = uploading === option.id;
            
            return (
              <div 
                key={option.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border transition-all animate-fade-in",
                  hasResults 
                    ? "bg-secondary/30 border-border hover:border-primary/50" 
                    : "bg-secondary/10 border-border/50 opacity-50"
                )}
                style={{ animationDelay: `${(idx + 1) * 100}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{option.name}</p>
                    <p className="text-xs text-muted-foreground">{option.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {driveEnabled && isSignedIn && (
                    <Cloud className="w-4 h-4 text-primary" />
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={!hasResults || isUploading}
                    onClick={() => handleExport(option.id)}
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-1" />
                    ) : (
                      <Download className="w-4 h-4 mr-1" />
                    )}
                    {option.extension}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {!hasResults && (
        <div className="glass-card p-6 text-center animate-fade-in" style={{ animationDelay: '400ms' }}>
          <p className="text-muted-foreground">
            Run an experiment first to enable exports
          </p>
        </div>
      )}
    </div>
  );
}

function generateReport(results: ModelResult[], brands: Brand[]): string {
  const lines: string[] = [
    '# AI Brand Visibility Report',
    '',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    '## Summary',
    '',
  ];

  const allScores = results.flatMap(r => r.brandScores);
  const avgMention = allScores.reduce((s, bs) => s + bs.mentionRate, 0) / allScores.length;
  const avgComposite = allScores.reduce((s, bs) => s + bs.compositeScore, 0) / allScores.length;

  lines.push(`- **Average Mention Rate**: ${(avgMention * 100).toFixed(1)}%`);
  lines.push(`- **Average Composite Score**: ${(avgComposite * 100).toFixed(1)}%`);
  lines.push(`- **Models Tested**: ${results.length}`);
  lines.push(`- **Brands Tracked**: ${brands.length}`);
  lines.push('');

  lines.push('## Results by Model');
  lines.push('');

  for (const result of results) {
    lines.push(`### ${result.modelName}`);
    lines.push('');
    lines.push(`Responses: ${result.responseCount}`);
    lines.push('');
    lines.push('| Brand | Mention Rate | Avg Rank | Composite Score |');
    lines.push('|-------|--------------|----------|-----------------|');
    
    for (const bs of result.brandScores) {
      lines.push(`| ${bs.brandName} | ${(bs.mentionRate * 100).toFixed(1)}% | ${bs.avgRank?.toFixed(1) || 'N/A'} | ${(bs.compositeScore * 100).toFixed(1)}% |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
