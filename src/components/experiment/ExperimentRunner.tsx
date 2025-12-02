import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Brand, Keyword, ModelConfig, PromptVariant } from "@/types";
import { cn } from "@/lib/utils";

interface ExperimentRunnerProps {
  brands: Brand[];
  keywords: Keyword[];
  models: ModelConfig[];
  isRunning: boolean;
  progress: number;
  currentStep: string;
  onRunExperiment: (variants: PromptVariant[], runsPerCombination: number) => void;
}

const PROMPT_VARIANTS: { id: PromptVariant; name: string; description: string }[] = [
  { id: 'minimal', name: 'Minimal', description: 'Natural response without structure' },
  { id: 'frontloaded', name: 'Frontloaded', description: 'Structured comparison with table/checklist' },
  { id: 'stepwise', name: 'Stepwise', description: 'Define criteria first, then evaluate' },
];

export function ExperimentRunner({ 
  brands, 
  keywords, 
  models, 
  isRunning,
  progress,
  currentStep,
  onRunExperiment 
}: ExperimentRunnerProps) {
  const [selectedVariants, setSelectedVariants] = useState<PromptVariant[]>(['minimal', 'frontloaded', 'stepwise']);
  const [runsPerCombination, setRunsPerCombination] = useState(1);

  const enabledModels = models.filter(m => m.enabled);
  const totalCombinations = keywords.length * enabledModels.length * selectedVariants.length * runsPerCombination;

  const toggleVariant = (variant: PromptVariant) => {
    if (selectedVariants.includes(variant)) {
      if (selectedVariants.length > 1) {
        setSelectedVariants(selectedVariants.filter(v => v !== variant));
      }
    } else {
      setSelectedVariants([...selectedVariants, variant]);
    }
  };

  const canRun = brands.length > 0 && keywords.length > 0 && enabledModels.length > 0;

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 animate-fade-in">
        <h3 className="text-2xl mb-2">Prompt Variants</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Based on Cognitive Forcing Functions (CFF) research methodology
        </p>
        <div className="space-y-3">
          {PROMPT_VARIANTS.map((variant) => (
            <div 
              key={variant.id}
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all",
                selectedVariants.includes(variant.id)
                  ? "bg-primary/5 border-primary/30"
                  : "bg-secondary/30 border-border hover:border-primary/20"
              )}
              onClick={() => toggleVariant(variant.id)}
            >
              <div>
                <p className="font-medium">{variant.name}</p>
                <p className="text-sm text-muted-foreground">{variant.description}</p>
              </div>
              <div className={cn(
                "w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center",
                selectedVariants.includes(variant.id)
                  ? "bg-primary border-primary"
                  : "border-muted-foreground"
              )}>
                {selectedVariants.includes(variant.id) && (
                  <CheckCircle2 className="w-full h-full text-primary-foreground" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <h3 className="text-xl mb-4">Runs Per Combination</h3>
        <div className="flex gap-2">
          {[1, 2, 3, 5].map((count) => (
            <button
              key={count}
              onClick={() => setRunsPerCombination(count)}
              className={cn(
                "flex-1 p-3 rounded-lg border font-medium transition-all",
                runsPerCombination === count
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {count}x
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <h3 className="text-xl mb-4">Experiment Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-secondary/50 rounded-lg">
            <p className="text-2xl font-bold font-mono">{brands.length}</p>
            <p className="text-xs text-muted-foreground">Brands</p>
          </div>
          <div className="text-center p-4 bg-secondary/50 rounded-lg">
            <p className="text-2xl font-bold font-mono">{keywords.length}</p>
            <p className="text-xs text-muted-foreground">Keywords</p>
          </div>
          <div className="text-center p-4 bg-secondary/50 rounded-lg">
            <p className="text-2xl font-bold font-mono">{enabledModels.length}</p>
            <p className="text-xs text-muted-foreground">Models</p>
          </div>
          <div className="text-center p-4 bg-secondary/50 rounded-lg">
            <p className="text-2xl font-bold font-mono text-primary">{totalCombinations}</p>
            <p className="text-xs text-muted-foreground">Total API Calls</p>
          </div>
        </div>

        {!canRun && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-warning/10 border border-warning/20 mb-4">
            <AlertCircle className="w-5 h-5 text-warning" />
            <p className="text-sm text-warning">
              Add at least one brand, keyword, and enable at least one model to run
            </p>
          </div>
        )}

        {isRunning && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{currentStep}</span>
              <span className="text-sm font-mono">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Button 
          onClick={() => onRunExperiment(selectedVariants, runsPerCombination)} 
          disabled={!canRun || isRunning}
          className="w-full btn-ceek"
          size="lg"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Running Experiment...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Run Experiment
            </>
          )}
        </Button>
      </div>
    </div>
  );
}