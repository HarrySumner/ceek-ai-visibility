import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronLeft, 
  ChevronRight,
  MessageSquare,
  Bot,
  User,
  Highlighter
} from "lucide-react";
import { Brand } from "@/types";
import { RawResponse } from "@/components/responses/RawResponseViewer";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConversationViewerProps {
  rawResponses: RawResponse[];
  brands: Brand[];
}

const MODEL_COLORS: Record<string, string> = {
  'GPT-4o': 'bg-green-500',
  'GPT-4o Mini': 'bg-green-400',
  'Claude Sonnet 4': 'bg-orange-500',
  'Claude 3.5 Haiku': 'bg-orange-400',
  'Gemini 2.5 Flash': 'bg-blue-500',
  'Gemini 2.5 Pro': 'bg-blue-600',
};

const BRAND_HIGHLIGHT_COLORS = [
  'bg-yellow-200 text-yellow-900',
  'bg-pink-200 text-pink-900',
  'bg-cyan-200 text-cyan-900',
  'bg-purple-200 text-purple-900',
  'bg-lime-200 text-lime-900',
];

function highlightBrands(text: string, brands: Brand[]): React.ReactNode[] {
  if (!text || brands.length === 0) return [text];

  let result: React.ReactNode[] = [text];
  
  brands.forEach((brand, brandIndex) => {
    const colorClass = BRAND_HIGHLIGHT_COLORS[brandIndex % BRAND_HIGHLIGHT_COLORS.length];
    const searchTerms = [brand.name, ...brand.aliases];
    
    searchTerms.forEach(term => {
      if (!term) return;
      
      const newResult: React.ReactNode[] = [];
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      
      result.forEach((segment, segIndex) => {
        if (typeof segment !== 'string') {
          newResult.push(segment);
          return;
        }
        
        const parts = segment.split(regex);
        parts.forEach((part, partIndex) => {
          if (regex.test(part)) {
            newResult.push(
              <mark 
                key={`${brandIndex}-${segIndex}-${partIndex}`}
                className={cn("px-1 rounded font-medium", colorClass)}
              >
                {part}
              </mark>
            );
          } else if (part) {
            newResult.push(part);
          }
        });
      });
      
      result = newResult;
    });
  });
  
  return result;
}

export function ConversationViewer({ rawResponses, brands }: ConversationViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showHighlights, setShowHighlights] = useState(true);
  const [filterModel, setFilterModel] = useState<string>('all');

  if (rawResponses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">Run an analysis to view conversations</p>
        </CardContent>
      </Card>
    );
  }

  const models = [...new Set(rawResponses.map(r => r.modelName))];
  const filteredResponses = filterModel === 'all' 
    ? rawResponses 
    : rawResponses.filter(r => r.modelName === filterModel);
  
  const current = filteredResponses[currentIndex] || filteredResponses[0];
  const modelColor = MODEL_COLORS[current?.modelName] || 'bg-primary';

  const detectedBrands = brands.filter(b => current?.brandMentions?.[b.id]?.detected);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Synthetic Conversations
        </h2>
        <div className="flex items-center gap-3">
          <Select value={filterModel} onValueChange={setFilterModel}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Models" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              {models.map(model => (
                <SelectItem key={model} value={model}>{model}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant={showHighlights ? "default" : "outline"}
            size="sm"
            onClick={() => setShowHighlights(!showHighlights)}
          >
            <Highlighter className="w-4 h-4 mr-1" />
            Highlights
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("w-3 h-3 rounded-full", modelColor)} />
              <CardTitle className="text-lg">{current?.modelName}</CardTitle>
              <Badge variant="outline">{current?.keyword}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                {currentIndex + 1} / {filteredResponses.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentIndex(Math.min(filteredResponses.length - 1, currentIndex + 1))}
                disabled={currentIndex === filteredResponses.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Query */}
          <div className="flex gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="flex-1 p-3 rounded-lg bg-muted">
              <p className="text-sm font-medium">{current?.keyword}</p>
            </div>
          </div>

          {/* Response */}
          <div className="flex gap-3">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", modelColor)}>
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <ScrollArea className="h-[300px] p-4 rounded-lg border bg-card">
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {showHighlights 
                    ? highlightBrands(current?.rawText || '', brands)
                    : current?.rawText
                  }
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Brand Detection Legend */}
          {detectedBrands.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground mb-2">Detected Brands</p>
              <div className="flex flex-wrap gap-2">
                {detectedBrands.map((brand, i) => {
                  const colorClass = BRAND_HIGHLIGHT_COLORS[brands.indexOf(brand) % BRAND_HIGHLIGHT_COLORS.length];
                  const mentions = current?.brandMentions?.[brand.id];
                  
                  return (
                    <Badge key={brand.id} className={cn("gap-1", colorClass)}>
                      {brand.name}
                      {mentions?.numMentions && (
                        <span className="opacity-70">×{mentions.numMentions}</span>
                      )}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
