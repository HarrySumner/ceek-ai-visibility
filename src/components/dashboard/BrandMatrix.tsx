import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BrandScore, ModelResult } from "@/types";

interface BrandMatrixProps {
  results: ModelResult[];
  brands: { id: string; name: string }[];
}

function getStatusVariant(score: number): 'success' | 'warning' | 'destructive' {
  if (score >= 0.7) return 'success';
  if (score >= 0.4) return 'warning';
  return 'destructive';
}

function formatScore(score: number): string {
  return (score * 100).toFixed(0);
}

export function BrandMatrix({ results, brands }: BrandMatrixProps) {
  if (results.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <p className="text-muted-foreground">No results yet. Run an experiment to see the brand matrix.</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">Brand × Model Matrix</h3>
        <p className="text-sm text-muted-foreground mt-1">Composite scores across all models and brands</p>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="rounded-tl-lg">Model</th>
              {brands.map((brand) => (
                <th key={brand.id}>{brand.name}</th>
              ))}
              <th className="rounded-tr-lg">Responses</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, idx) => (
              <tr key={result.modelId} className={cn(
                "transition-colors hover:bg-muted/30",
                idx % 2 === 0 && "bg-muted/10"
              )}>
                <td className="font-medium">{result.modelName}</td>
                {brands.map((brand) => {
                  const brandScore = result.brandScores.find(bs => bs.brandId === brand.id);
                  if (!brandScore) {
                    return <td key={brand.id} className="text-muted-foreground">—</td>;
                  }
                  const variant = getStatusVariant(brandScore.compositeScore);
                  return (
                    <td key={brand.id}>
                      <div className="flex items-center gap-2">
                        <span className="score-cell font-semibold">
                          {formatScore(brandScore.compositeScore)}
                        </span>
                        <Badge variant={variant} className="text-[10px]">
                          {(brandScore.mentionRate * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      {brandScore.avgRank && (
                        <span className="text-xs text-muted-foreground">
                          Avg rank: #{brandScore.avgRank.toFixed(1)}
                        </span>
                      )}
                    </td>
                  );
                })}
                <td className="score-cell text-muted-foreground">{result.responseCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
