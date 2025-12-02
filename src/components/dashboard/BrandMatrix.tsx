import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ModelResult } from "@/types";
import { Info } from "lucide-react";

interface BrandMatrixProps {
  results: ModelResult[];
  brands: { id: string; name: string }[];
}

function getStatusVariant(score: number): 'success' | 'warning' | 'destructive' {
  if (score >= 0.6) return 'success';
  if (score >= 0.3) return 'warning';
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
    <TooltipProvider>
      <div className="glass-card overflow-hidden animate-fade-in">
        <div className="p-4 border-b border-border">
          <h3 className="text-2xl">Brand × Model Matrix</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Composite scores combining mention rate (40%), rank position (30%), and content quality (30%)
          </p>
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
                  "transition-colors hover:bg-secondary/50",
                  idx % 2 === 0 && "bg-secondary/20"
                )}>
                  <td className="font-medium">
                    <div className="flex flex-col">
                      <span>{result.modelName}</span>
                      {result.avgContentQuality && (
                        <span className="text-xs text-muted-foreground">
                          Quality: {(result.avgContentQuality.overall * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </td>
                  {brands.map((brand) => {
                    const brandScore = result.brandScores.find(bs => bs.brandId === brand.id);
                    if (!brandScore) {
                      return <td key={brand.id} className="text-muted-foreground">—</td>;
                    }
                    const variant = getStatusVariant(brandScore.compositeScore);
                    return (
                      <td key={brand.id}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="cursor-help">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "score-cell font-semibold text-lg",
                                  variant === 'success' && "text-success",
                                  variant === 'warning' && "text-warning",
                                  variant === 'destructive' && "text-destructive"
                                )}>
                                  {formatScore(brandScore.compositeScore)}
                                </span>
                                <Badge variant={variant} className="text-[10px]">
                                  {(brandScore.mentionRate * 100).toFixed(0)}% mentioned
                                </Badge>
                              </div>
                              {brandScore.avgRank && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-xs text-muted-foreground">
                                    Avg rank: #{brandScore.avgRank.toFixed(1)}
                                  </span>
                                  <Info className="w-3 h-3 text-muted-foreground" />
                                </div>
                              )}
                              {!brandScore.avgRank && brandScore.mentionRate > 0 && (
                                <span className="text-xs text-muted-foreground">
                                  No clear ranking detected
                                </span>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <div className="space-y-2 text-sm">
                              <p className="font-semibold">{brand.name} on {result.modelName}</p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <span className="text-muted-foreground">Mention rate:</span>
                                <span>{(brandScore.mentionRate * 100).toFixed(1)}%</span>
                                <span className="text-muted-foreground">Avg rank:</span>
                                <span>{brandScore.avgRank?.toFixed(1) || 'N/A'}</span>
                                <span className="text-muted-foreground">Quality score:</span>
                                <span>{(brandScore.qualityScore * 100).toFixed(1)}%</span>
                                <span className="text-muted-foreground">Composite:</span>
                                <span className="font-semibold">{(brandScore.compositeScore * 100).toFixed(1)}%</span>
                              </div>
                              <p className="text-xs text-muted-foreground pt-2 border-t">
                                Composite = Mention (40%) + Rank (30%) + Quality (30%)
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    );
                  })}
                  <td className="score-cell text-muted-foreground">{result.responseCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Legend */}
        <div className="p-4 border-t border-border bg-secondary/20">
          <div className="flex items-center gap-6 text-xs">
            <span className="text-muted-foreground">Score legend:</span>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success"></div>
              <span>≥60 Strong</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning"></div>
              <span>30-59 Moderate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <span>&lt;30 Weak</span>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}