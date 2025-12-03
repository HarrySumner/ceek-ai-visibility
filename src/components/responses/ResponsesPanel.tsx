import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ModelResult } from "@/types";
import { FileText, MessageSquare } from "lucide-react";

interface ResponsesPanelProps {
  results: ModelResult[];
}

export function ResponsesPanel({ results }: ResponsesPanelProps) {
  const [selectedModel, setSelectedModel] = useState<string>("all");

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Responses Yet</h2>
        <p className="text-muted-foreground">Run an experiment to see responses here</p>
      </div>
    );
  }

  const filteredResults = selectedModel === "all" 
    ? results 
    : results.filter(r => r.modelId === selectedModel);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
            Check Responses
          </h1>
          <p className="text-muted-foreground">Review raw model outputs</p>
        </div>
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
