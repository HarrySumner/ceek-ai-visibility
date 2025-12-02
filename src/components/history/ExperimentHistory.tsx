import { SavedExperiment } from "@/hooks/useExperiment";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, Trash2, Eye, Calendar, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExperimentHistoryProps {
  experiments: SavedExperiment[];
  currentExperimentId: string | null;
  onLoad: (experiment: SavedExperiment) => void;
  onDelete: (experimentId: string) => void;
}

export function ExperimentHistory({ 
  experiments, 
  currentExperimentId,
  onLoad, 
  onDelete 
}: ExperimentHistoryProps) {
  if (experiments.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl mb-2">No experiments yet</h3>
        <p className="text-muted-foreground">
          Run an experiment to see it saved here for historical tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-2xl">Experiment History</h3>
            <p className="text-sm text-muted-foreground">
              {experiments.length} saved experiment{experiments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {experiments.map((experiment) => {
            const isActive = experiment.id === currentExperimentId;
            const brandCount = experiment.config?.brands?.length || 0;
            const keywordCount = experiment.config?.keywords?.length || 0;
            
            return (
              <div 
                key={experiment.id}
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  isActive 
                    ? "bg-primary/5 border-primary/30" 
                    : "bg-secondary/30 border-border hover:border-primary/20"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">
                        {experiment.name || 'Untitled Experiment'}
                      </h4>
                      {isActive && (
                        <Badge variant="default" className="text-[10px]">Active</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(experiment.created_at).toLocaleDateString()}
                      </span>
                      <span>{brandCount} brands</span>
                      <span>{keywordCount} keywords</span>
                      <span>{experiment.total_responses} responses</span>
                    </div>
                    
                    {experiment.config?.models && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {experiment.config.models.map(modelId => (
                          <Badge key={modelId} variant="outline" className="text-[10px]">
                            {modelId}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onLoad(experiment)}
                      disabled={isActive}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {isActive ? 'Viewing' : 'Load'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(experiment.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}