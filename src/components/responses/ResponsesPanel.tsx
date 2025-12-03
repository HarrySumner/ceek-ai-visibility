import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ModelResult, ContentQuality, Brand } from "@/types";
import { FileText, RotateCcw, Brain, BarChart3, ArrowRight, CheckCircle2 } from "lucide-react";
import { ConversationVisualizer } from "@/components/conversation/ConversationVisualizer";
import { RawResponseViewer, RawResponse } from "./RawResponseViewer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ResponsesPanelProps {
  results: ModelResult[];
  rawResponses?: RawResponse[];
  brands?: Brand[];
  onNavigateToNLP?: () => void;
}

// Aggregate all results into a single model-agnostic view
function aggregateResults(results: ModelResult[]): {
  totalResponses: number;
  avgQuality: ContentQuality | null;
  brandSummary: { brandName: string; avgMentionRate: number; status: 'success' | 'warning' | 'destructive' }[];
  modelsUsed: string[];
} {
  if (results.length === 0) {
    return { totalResponses: 0, avgQuality: null, brandSummary: [], modelsUsed: [] };
  }

  const totalResponses = results.reduce((sum, r) => sum + r.responseCount, 0);
  const modelsUsed = results.map(r => r.modelName);

  // Aggregate content quality
  const qualityResults = results.filter(r => r.avgContentQuality);
  let avgQuality: ContentQuality | null = null;
  
  if (qualityResults.length > 0) {
    avgQuality = {
      sentiment: qualityResults.reduce((sum, r) => sum + (r.avgContentQuality?.sentiment || 0), 0) / qualityResults.length,
      readability: qualityResults.reduce((sum, r) => sum + (r.avgContentQuality?.readability || 0), 0) / qualityResults.length,
      persuasiveness: qualityResults.reduce((sum, r) => sum + (r.avgContentQuality?.persuasiveness || 0), 0) / qualityResults.length,
      clarity: qualityResults.reduce((sum, r) => sum + (r.avgContentQuality?.clarity || 0), 0) / qualityResults.length,
      emotionalAppeal: qualityResults.reduce((sum, r) => sum + (r.avgContentQuality?.emotionalAppeal || 0), 0) / qualityResults.length,
      explanatoryDirectiveness: qualityResults.reduce((sum, r) => sum + (r.avgContentQuality?.explanatoryDirectiveness || 0), 0) / qualityResults.length,
      overall: qualityResults.reduce((sum, r) => sum + (r.avgContentQuality?.overall || 0), 0) / qualityResults.length,
    };
  }

  // Aggregate brand scores
  const brandMap = new Map<string, { totalRate: number; count: number }>();
  results.forEach(r => {
    r.brandScores.forEach(score => {
      const existing = brandMap.get(score.brandName) || { totalRate: 0, count: 0 };
      brandMap.set(score.brandName, {
        totalRate: existing.totalRate + score.mentionRate,
        count: existing.count + 1,
      });
    });
  });

  const brandSummary = Array.from(brandMap.entries()).map(([brandName, { totalRate, count }]) => {
    const avgMentionRate = totalRate / count;
    const status = avgMentionRate >= 0.5 ? 'success' : avgMentionRate >= 0.2 ? 'warning' : 'destructive';
    return { brandName, avgMentionRate, status: status as 'success' | 'warning' | 'destructive' };
  });

  return { totalResponses, avgQuality, brandSummary, modelsUsed };
}

export function ResponsesPanel({ results, rawResponses = [], brands = [], onNavigateToNLP }: ResponsesPanelProps) {
  const [showConversation, setShowConversation] = useState(true);
  const [conversationKey, setConversationKey] = useState(0);
  const [speed, setSpeed] = useState([7]);

  const restartConversation = () => {
    setConversationKey(k => k + 1);
  };

  const hasResults = results.length > 0;
  const aggregated = aggregateResults(results);

  return (
    <div className="space-y-6">
      <div className="py-2">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">Analysis</p>
        <h1 className="text-3xl text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Check Responses
        </h1>
      </div>

      {/* What this does explanation - always visible */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold">Response Analysis</h3>
              <p className="text-sm text-muted-foreground">
                This panel shows aggregated response quality using the <strong>Ghosh NLP Framework</strong>:
              </p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="flex items-center gap-2 text-xs">
                  <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Sentiment & tone analysis</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Readability scoring</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Persuasiveness metrics</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Brand detection</span>
                </div>
              </div>
              {hasResults && onNavigateToNLP && (
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-primary mt-2"
                  onClick={onNavigateToNLP}
                >
                  View detailed NLP analysis <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversation visualizer */}
      {showConversation && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Conversation Flow {hasResults ? "" : "Demo"}</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Speed:</span>
                  <Slider
                    value={speed}
                    onValueChange={setSpeed}
                    min={1}
                    max={10}
                    step={1}
                    className="w-20"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={restartConversation}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  {hasResults ? "Replay" : "Restart"}
                </Button>
                {hasResults && (
                  <Button variant="ghost" size="sm" onClick={() => setShowConversation(false)}>
                    Hide
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ConversationVisualizer
                key={conversationKey}
                keyword="What are the best luxury handbag brands for investment?"
                modelName="LLM"
                isPlaying={true}
                speed={speed[0]}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {!showConversation && hasResults && (
        <Button variant="outline" size="sm" onClick={() => setShowConversation(true)}>
          Show Conversation Flow
        </Button>
      )}

      {/* Results Summary - Model Agnostic */}
      {hasResults ? (
        <>
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 bg-muted/30">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Experiment Complete
              </CardTitle>
              <Badge variant="outline">{aggregated.totalResponses} total responses</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Models tested: {aggregated.modelsUsed.join(", ")}
            </p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Brand Detection Summary */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  Brand Detection Summary
                </h4>
                <div className="space-y-2">
                  {aggregated.brandSummary.map((brand) => (
                    <div 
                      key={brand.brandName}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          brand.status === 'success' ? 'bg-green-500' : 
                          brand.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <span className="text-sm font-medium">{brand.brandName}</span>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="flex items-center gap-1 text-xs">
                            <span className="text-muted-foreground">Avg mentions:</span>
                            <span className="font-mono font-semibold">{(brand.avgMentionRate * 100).toFixed(0)}%</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Average mention rate across all models</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                  {aggregated.brandSummary.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No brands configured for detection</p>
                  )}
                </div>
              </div>

              {/* Content Quality Summary */}
              {aggregated.avgQuality && (
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Content Quality (Aggregated)
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Overall Score</p>
                      <p className="text-2xl font-bold text-primary">{(aggregated.avgQuality.overall * 100).toFixed(0)}%</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Sentiment</p>
                      <p className="text-lg font-semibold">{aggregated.avgQuality.sentiment.toFixed(2)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Readability</p>
                      <p className="text-lg font-semibold">{aggregated.avgQuality.readability.toFixed(1)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <p className="text-xs text-muted-foreground">Clarity</p>
                      <p className="text-lg font-semibold">{aggregated.avgQuality.clarity.toFixed(2)}</p>
                    </div>
                  </div>
                  {onNavigateToNLP && (
                    <Button 
                      variant="outline" 
                      className="w-full mt-2"
                      onClick={onNavigateToNLP}
                    >
                      View Full NLP Analysis <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Raw Response Viewer */}
        <RawResponseViewer responses={rawResponses} brands={brands} />
      </>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border rounded-lg">
          <FileText className="w-10 h-10 text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold mb-1">No Experiment Results Yet</h3>
          <p className="text-sm text-muted-foreground">Go to "Ask a LLM" tab to configure and run an experiment</p>
        </div>
      )}
    </div>
  );
}
