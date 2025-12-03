import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ModelResult } from "@/types";
import { FileText, MessageSquare, RotateCcw, Info, Brain, BarChart3 } from "lucide-react";
import { ConversationVisualizer } from "@/components/conversation/ConversationVisualizer";
import { NLPScoreBreakdown } from "./NLPScoreBreakdown";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ResponsesPanelProps {
  results: ModelResult[];
}

export function ResponsesPanel({ results }: ResponsesPanelProps) {
  const [selectedModel, setSelectedModel] = useState<string>("all");
  const [showConversation, setShowConversation] = useState(true);
  const [conversationKey, setConversationKey] = useState(0);
  const [speed, setSpeed] = useState([7]);

  const restartConversation = () => {
    setConversationKey(k => k + 1);
  };

  if (results.length === 0) {
    return (
      <div className="space-y-6">
        <div className="py-2">
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">Analysis</p>
          <h1 className="text-3xl text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Check Responses
          </h1>
        </div>

        {/* What this does explanation */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">What is Response Analysis?</h3>
                <p className="text-sm text-muted-foreground">
                  After running an experiment, this panel analyzes each LLM's responses using the <strong>Ghosh NLP Framework</strong>:
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
                    <span>CFF structure detection</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo conversation visualizer */}
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Conversation Flow Demo</CardTitle>
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
                  Restart
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ConversationVisualizer
                key={conversationKey}
                keyword="What are the best luxury handbag brands for investment?"
                modelName="GPT-4o"
                isPlaying={true}
                speed={speed[0]}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border rounded-lg">
          <FileText className="w-10 h-10 text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold mb-1">No Experiment Results Yet</h3>
          <p className="text-sm text-muted-foreground">Go to "Ask a LLM" tab to configure and run an experiment</p>
        </div>
      </div>
    );
  }

  const filteredResults = selectedModel === "all" 
    ? results 
    : results.filter(r => r.modelId === selectedModel);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="py-2">
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">Results</p>
          <h1 className="text-3xl text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Check Responses
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant={showConversation ? "default" : "outline"} 
            size="sm"
            onClick={() => setShowConversation(!showConversation)}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            {showConversation ? "Hide" : "Show"} Conversation
          </Button>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Models</SelectItem>
              {results.map(r => (
                <SelectItem key={r.modelId} value={r.modelId}>{r.modelName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Conversation Visualizer */}
      {showConversation && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Live Conversation Flow</CardTitle>
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
                  Replay
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ConversationVisualizer
                key={conversationKey}
                keyword="What are the best luxury handbag brands for investment?"
                modelName={filteredResults[0]?.modelName || "GPT-4o"}
                isPlaying={true}
                speed={speed[0]}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results with NLP Analysis */}
      <div className="grid gap-4">
        {filteredResults.map((result) => (
          <Card key={result.modelId} className="overflow-hidden">
            <CardHeader className="pb-3 bg-muted/30">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  {result.modelName}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{result.responseCount} responses</Badge>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">Aggregated scores across all CFF variants (minimal, frontloaded, stepwise) for this model.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Brand Detection Results */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Brand Detection
                  </h4>
                  <div className="space-y-2">
                    {result.brandScores.map((score) => (
                      <div 
                        key={score.brandId}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            score.status === 'success' ? 'bg-green-500' : 
                            score.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                          }`} />
                          <span className="text-sm font-medium">{score.brandName}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="flex items-center gap-1">
                                <span className="text-muted-foreground">Mentions:</span>
                                <span className="font-mono font-semibold">{(score.mentionRate * 100).toFixed(0)}%</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>How often this brand appears in responses</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {score.avgRank && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger className="flex items-center gap-1">
                                  <span className="text-muted-foreground">Rank:</span>
                                  <span className="font-mono font-semibold">#{score.avgRank.toFixed(1)}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Average position in ranked lists</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                    ))}
                    {result.brandScores.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No brands configured for detection</p>
                    )}
                  </div>
                </div>

                {/* NLP Quality Analysis */}
                {result.avgContentQuality && (
                  <NLPScoreBreakdown quality={result.avgContentQuality} />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}