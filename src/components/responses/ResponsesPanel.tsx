import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ModelResult, ContentQuality, Brand } from "@/types";
import { FileText, RotateCcw, Brain, BarChart3, ArrowRight, CheckCircle2, Download, Loader2, Settings2 } from "lucide-react";
import { ConversationVisualizer } from "@/components/conversation/ConversationVisualizer";
import { RawResponseViewer, RawResponse } from "./RawResponseViewer";
import { useGifRecorder } from "@/hooks/useGifRecorder";
import { toast } from "sonner";
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

// GIF quality presets
const GIF_PRESETS = {
  low: { width: 400, height: 200, frameRate: 6, label: "Low (Fast)" },
  medium: { width: 600, height: 300, frameRate: 8, label: "Medium" },
  high: { width: 800, height: 400, frameRate: 10, label: "High (Slow)" },
  custom: { width: 600, height: 300, frameRate: 8, label: "Custom" },
} as const;

type PresetKey = keyof typeof GIF_PRESETS;

export function ResponsesPanel({ results, rawResponses = [], brands = [], onNavigateToNLP }: ResponsesPanelProps) {
  const [showConversation, setShowConversation] = useState(true);
  const [conversationKey, setConversationKey] = useState(0);
  const [speed, setSpeed] = useState([7]);
  const conversationRef = useRef<HTMLDivElement>(null);
  
  // GIF settings state
  const [gifPreset, setGifPreset] = useState<PresetKey>("medium");
  const [gifWidth, setGifWidth] = useState(600);
  const [gifHeight, setGifHeight] = useState(300);
  const [gifFrameRate, setGifFrameRate] = useState(8);
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const { isRecording, isProcessing, progress, startRecording, stopRecording, downloadGif } = useGifRecorder({
    frameRate: gifFrameRate,
    width: gifWidth,
    height: gifHeight,
  });

  const handlePresetChange = (preset: PresetKey) => {
    setGifPreset(preset);
    if (preset !== "custom") {
      setGifWidth(GIF_PRESETS[preset].width);
      setGifHeight(GIF_PRESETS[preset].height);
      setGifFrameRate(GIF_PRESETS[preset].frameRate);
    }
  };

  const restartConversation = () => {
    setConversationKey(k => k + 1);
  };

  const handleRecordGif = async () => {
    if (!conversationRef.current) return;
    
    if (isRecording) {
      const blob = await stopRecording();
      if (blob) {
        downloadGif(blob, `conversation-${Date.now()}.gif`);
        toast.success("GIF downloaded successfully!");
      } else {
        toast.error("Failed to create GIF");
      }
    } else {
      setSettingsOpen(false);
      // Start fresh recording with new conversation
      setConversationKey(k => k + 1);
      setTimeout(() => {
        if (conversationRef.current) {
          startRecording(conversationRef.current);
          toast.info(`Recording at ${gifWidth}x${gifHeight} @ ${gifFrameRate}fps`);
        }
      }, 100);
    }
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
                    disabled={isRecording}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={restartConversation} disabled={isRecording}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  {hasResults ? "Replay" : "Restart"}
                </Button>
                {isRecording ? (
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleRecordGif}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        {progress}%
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-1" />
                        Stop & Save
                      </>
                    )}
                  </Button>
                ) : (
                  <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isProcessing}>
                        <Download className="w-4 h-4 mr-1" />
                        Record GIF
                        <Settings2 className="w-3 h-3 ml-1 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 bg-popover border border-border z-50" align="end">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">GIF Settings</h4>
                          <p className="text-xs text-muted-foreground">
                            Customize quality and dimensions
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs">Quality Preset</Label>
                          <Select value={gifPreset} onValueChange={(v) => handlePresetChange(v as PresetKey)}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border border-border z-50">
                              <SelectItem value="low">Low (Fast, ~400x200)</SelectItem>
                              <SelectItem value="medium">Medium (~600x300)</SelectItem>
                              <SelectItem value="high">High (Slow, ~800x400)</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {gifPreset === "custom" && (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs">Width (px)</Label>
                                <Input
                                  type="number"
                                  value={gifWidth}
                                  onChange={(e) => setGifWidth(Number(e.target.value))}
                                  min={200}
                                  max={1200}
                                  className="h-8 text-xs"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Height (px)</Label>
                                <Input
                                  type="number"
                                  value={gifHeight}
                                  onChange={(e) => setGifHeight(Number(e.target.value))}
                                  min={100}
                                  max={800}
                                  className="h-8 text-xs"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <Label className="text-xs">Frame Rate</Label>
                                <span className="text-xs text-muted-foreground">{gifFrameRate} fps</span>
                              </div>
                              <Slider
                                value={[gifFrameRate]}
                                onValueChange={([v]) => setGifFrameRate(v)}
                                min={4}
                                max={15}
                                step={1}
                              />
                            </div>
                          </>
                        )}

                        <div className="pt-2 border-t border-border">
                          <Button 
                            className="w-full" 
                            size="sm"
                            onClick={handleRecordGif}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Start Recording
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                {hasResults && (
                  <Button variant="ghost" size="sm" onClick={() => setShowConversation(false)} disabled={isRecording}>
                    Hide
                  </Button>
                )}
              </div>
            </div>
            {isRecording && (
              <p className="text-xs text-destructive mt-2">
                ● Recording in progress... Click "Stop & Save" when the conversation ends.
              </p>
            )}
            {isProcessing && (
              <div className="mt-2">
                <Progress value={progress} className="h-1" />
                <p className="text-xs text-muted-foreground mt-1">Processing GIF...</p>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div ref={conversationRef} className="h-[350px]">
              <ConversationVisualizer
                key={conversationKey}
                keyword="What are the best luxury handbag brands for investment?"
                modelName="LLM"
                isPlaying={true}
                speed={speed[0]}
                onComplete={() => {
                  if (isRecording) {
                    // Auto-stop after a brief delay when conversation completes
                    setTimeout(async () => {
                      const blob = await stopRecording();
                      if (blob) {
                        downloadGif(blob, `conversation-${Date.now()}.gif`);
                        toast.success("GIF downloaded successfully!");
                      }
                    }, 1000);
                  }
                }}
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
