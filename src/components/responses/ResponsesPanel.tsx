import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ModelResult } from "@/types";
import { FileText, MessageSquare, Play, RotateCcw } from "lucide-react";
import { ConversationVisualizer } from "@/components/conversation/ConversationVisualizer";

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
          <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">Preview</p>
          <h1 className="text-3xl text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Conversation Preview
          </h1>
        </div>

        {/* Demo conversation visualizer */}
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Multi-Turn CFF Conversation Demo</CardTitle>
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
            <div className="h-[500px]">
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
          <h2 className="text-lg font-semibold mb-1">Run an Experiment</h2>
          <p className="text-sm text-muted-foreground">Your actual responses will appear here after running an experiment</p>
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

      <div className="grid gap-4">
        {filteredResults.map((result) => (
          <Card key={result.modelId}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  {result.modelName}
                </CardTitle>
                <Badge variant="outline">{result.responseCount} responses</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Brand Scores Summary */}
                <div className="flex flex-wrap gap-2">
                  {result.brandScores.map((score) => (
                    <Badge 
                      key={score.brandId} 
                      variant={score.status === 'success' ? 'default' : score.status === 'warning' ? 'secondary' : 'destructive'}
                    >
                      {score.brandName}: {(score.mentionRate * 100).toFixed(0)}%
                    </Badge>
                  ))}
                </div>

                {/* Content Quality */}
                {result.avgContentQuality && (
                  <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Sentiment</p>
                      <p className="font-medium">{result.avgContentQuality.sentiment.toFixed(2)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Readability</p>
                      <p className="font-medium">{result.avgContentQuality.readability.toFixed(1)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Overall</p>
                      <p className="font-medium">{result.avgContentQuality.overall.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}