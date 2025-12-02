import { Button } from "@/components/ui/button";
import { FileJson, FileSpreadsheet, FileText, Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExportPanelProps {
  hasResults: boolean;
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

export function ExportPanel({ hasResults }: ExportPanelProps) {
  const handleExport = (format: string) => {
    // TODO: Implement actual export
    console.log(`Exporting as ${format}`);
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 animate-fade-in">
        <h3 className="font-semibold mb-2">Export Results</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Download your experiment results in various formats
        </p>

        <div className="space-y-3">
          {EXPORT_OPTIONS.map((option, idx) => {
            const Icon = option.icon;
            return (
              <div 
                key={option.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border transition-all animate-fade-in",
                  hasResults 
                    ? "bg-muted/30 border-border hover:border-primary/50" 
                    : "bg-muted/10 border-border/50 opacity-50"
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
                  <Download className="w-4 h-4" />
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
