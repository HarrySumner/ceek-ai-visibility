import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, FileText, Highlighter } from "lucide-react";
import { Brand } from "@/types";

export interface RawResponse {
  id: string;
  modelId: string;
  modelName: string;
  keyword: string;
  rawText: string;
  brandMentions: Record<string, {
    detected: boolean;
    numMentions: number;
    contextSnippets: string[];
  }>;
}

interface RawResponseViewerProps {
  responses: RawResponse[];
  brands: Brand[];
}

// Highlight brand mentions in text
function highlightBrands(text: string, brands: Brand[]): React.ReactNode[] {
  if (!text || brands.length === 0) return [text];

  // Build regex pattern for all brand names and aliases
  const patterns: { pattern: RegExp; brandName: string; color: string }[] = [];
  const colors = [
    "bg-yellow-200 dark:bg-yellow-800/50",
    "bg-green-200 dark:bg-green-800/50",
    "bg-blue-200 dark:bg-blue-800/50",
    "bg-purple-200 dark:bg-purple-800/50",
    "bg-pink-200 dark:bg-pink-800/50",
    "bg-orange-200 dark:bg-orange-800/50",
  ];

  brands.forEach((brand, idx) => {
    const allNames = [brand.name, ...brand.aliases];
    allNames.forEach(name => {
      patterns.push({
        pattern: new RegExp(`\\b(${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`, "gi"),
        brandName: brand.name,
        color: colors[idx % colors.length],
      });
    });
  });

  // Split text and highlight matches
  let result: React.ReactNode[] = [text];
  
  patterns.forEach(({ pattern, brandName, color }) => {
    result = result.flatMap((segment, segIdx) => {
      if (typeof segment !== "string") return segment;
      
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match;
      
      while ((match = pattern.exec(segment)) !== null) {
        if (match.index > lastIndex) {
          parts.push(segment.slice(lastIndex, match.index));
        }
        parts.push(
          <mark 
            key={`${segIdx}-${match.index}-${brandName}`}
            className={`${color} px-0.5 rounded font-medium`}
            title={`Brand: ${brandName}`}
          >
            {match[0]}
          </mark>
        );
        lastIndex = match.index + match[0].length;
      }
      
      if (lastIndex < segment.length) {
        parts.push(segment.slice(lastIndex));
      }
      
      return parts.length > 0 ? parts : [segment];
    });
  });

  return result;
}

export function RawResponseViewer({ responses, brands }: RawResponseViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterModel, setFilterModel] = useState<string>("all");

  const filteredResponses = useMemo(() => {
    if (filterModel === "all") return responses;
    return responses.filter(r => r.modelId === filterModel);
  }, [responses, filterModel]);

  const uniqueModels = useMemo(() => {
    const models = new Map<string, string>();
    responses.forEach(r => models.set(r.modelId, r.modelName));
    return Array.from(models.entries());
  }, [responses]);

  const currentResponse = filteredResponses[currentIndex];

  const goNext = () => {
    setCurrentIndex(prev => Math.min(prev + 1, filteredResponses.length - 1));
  };

  const goPrev = () => {
    setCurrentIndex(prev => Math.max(prev - 1, 0));
  };

  // Reset index when filter changes
  const handleFilterChange = (value: string) => {
    setFilterModel(value);
    setCurrentIndex(0);
  };

  if (responses.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">No raw responses available</p>
          <p className="text-xs text-muted-foreground mt-1">Run an experiment to see LLM outputs</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentResponse) {
    return null;
  }

  // Count detected brands in current response
  const detectedBrands = brands.filter(b => currentResponse.brandMentions[b.id]?.detected);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Highlighter className="w-4 h-4" />
            Raw LLM Response
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filterModel} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder="Filter model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {uniqueModels.map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Navigation and metadata */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={goPrev}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {filteredResponses.length}
            </span>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={goNext}
              disabled={currentIndex >= filteredResponses.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Badge variant="secondary">{currentResponse.modelName}</Badge>
        </div>

        {/* Keyword */}
        <div className="p-2 rounded bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">Query</p>
          <p className="text-sm font-medium">{currentResponse.keyword}</p>
        </div>

        {/* Detected brands legend */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Detected brands:</span>
          {detectedBrands.length > 0 ? (
            detectedBrands.map((brand, idx) => {
              const colors = [
                "bg-yellow-200 dark:bg-yellow-800/50",
                "bg-green-200 dark:bg-green-800/50",
                "bg-blue-200 dark:bg-blue-800/50",
                "bg-purple-200 dark:bg-purple-800/50",
                "bg-pink-200 dark:bg-pink-800/50",
                "bg-orange-200 dark:bg-orange-800/50",
              ];
              const mentions = currentResponse.brandMentions[brand.id]?.numMentions || 0;
              return (
                <Badge 
                  key={brand.id} 
                  variant="outline" 
                  className={`${colors[brands.indexOf(brand) % colors.length]} border-0 text-xs`}
                >
                  {brand.name} ({mentions})
                </Badge>
              );
            })
          ) : (
            <span className="text-xs text-muted-foreground italic">None detected</span>
          )}
        </div>

        {/* Response text with highlights */}
        <ScrollArea className="h-[300px] rounded-lg border bg-card p-4">
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {highlightBrands(currentResponse.rawText, brands)}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
