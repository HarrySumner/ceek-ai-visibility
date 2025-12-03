import { Button } from "@/components/ui/button";
import { FileJson, FileSpreadsheet, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModelResult, Brand, Keyword } from "@/types";
import { toast } from "sonner";

interface ExportPanelProps {
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
    extension: '.json'
  },
  { 
    id: 'csv', 
    name: 'CSV', 
    icon: FileSpreadsheet, 
    description: 'Spreadsheet-compatible format',
    extension: '.csv'
  },
  { 
    id: 'report', 
    name: 'Report', 
    icon: FileText, 
    description: 'Human-readable summary document',
    extension: '.md'
  },
];

export function ExportPanel({ results, brands, keywords }: ExportPanelProps) {
  const hasResults = results.length > 0;

  const handleExport = (format: string) => {
    if (!hasResults) {
      toast.error("No results to export. Run an experiment first.");
      return;
    }

    let content: string;
    let filename: string;
    let mimeType: string;

    switch (format) {
      case 'json':
        content = JSON.stringify({ results, brands, keywords, exportedAt: new Date().toISOString() }, null, 2);
        filename = `brand-ceeker-export-${Date.now()}.json`;
        mimeType = 'application/json';
        break;
      
      case 'csv':
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
        content = [headers.join(','), ...rows].join('\n');
        filename = `brand-ceeker-export-${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;
      
      case 'report':
        content = generateReport(results, brands);
        filename = `brand-ceeker-report-${Date.now()}.md`;
        mimeType = 'text/markdown';
        break;
      
      default:
        return;
    }

    // Create and download file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 animate-fade-in">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">Data</p>
        <h3 className="text-2xl mb-4" style={{ fontFamily: "'DM Serif Display', serif" }}>Export Results</h3>

        <div className="space-y-3">
          {EXPORT_OPTIONS.map((option, idx) => {
            const Icon = option.icon;
            return (
              <div 
                key={option.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border transition-all animate-fade-in",
                  hasResults 
                    ? "bg-secondary/30 border-border hover:border-primary/50" 
                    : "bg-secondary/10 border-border/50 opacity-50"
                )}
                style={{ animationDelay: `${idx * 100}ms` }}
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
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={!hasResults}
                  onClick={() => handleExport(option.id)}
                >
                  <Download className="w-4 h-4 mr-1" />
                  {option.extension}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {!hasResults && (
        <div className="glass-card p-6 text-center animate-fade-in" style={{ animationDelay: '300ms' }}>
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
    '# AI Brand Ceeker Report',
    '',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    '## Summary',
    '',
  ];

  // Overall stats
  const allScores = results.flatMap(r => r.brandScores);
  const avgMention = allScores.reduce((s, bs) => s + bs.mentionRate, 0) / allScores.length;
  const avgComposite = allScores.reduce((s, bs) => s + bs.compositeScore, 0) / allScores.length;

  lines.push(`- **Average Mention Rate**: ${(avgMention * 100).toFixed(1)}%`);
  lines.push(`- **Average Composite Score**: ${(avgComposite * 100).toFixed(1)}%`);
  lines.push(`- **Models Tested**: ${results.length}`);
  lines.push(`- **Brands Tracked**: ${brands.length}`);
  lines.push('');

  // Per-model breakdown
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