import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, 
  Loader2, 
  Plus, 
  X, 
  Sparkles, 
  Building2, 
  Search, 
  Target,
  ChevronRight,
  ChevronLeft,
  Zap
} from "lucide-react";
import { Brand, Keyword, ModelConfig, PromptVariant, IndustryVertical, ExperimentContext } from "@/types";
import { IndustrySelector } from "./IndustrySelector";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SetupPanelProps {
  brands: Brand[];
  setBrands: (brands: Brand[]) => void;
  keywords: Keyword[];
  setKeywords: (keywords: Keyword[]) => void;
  models: ModelConfig[];
  setModels: (models: ModelConfig[]) => void;
  context: ExperimentContext;
  setContext: (context: ExperimentContext) => void;
  isRunning: boolean;
  progress: number;
  currentStep: string;
  onRunExperiment: (variants: PromptVariant[], runsPerCombination: number) => void;
}

type SetupStep = 'context' | 'brands' | 'queries' | 'run';

const STEPS: { id: SetupStep; label: string; icon: React.ReactNode }[] = [
  { id: 'context', label: 'Context', icon: <Target className="w-4 h-4" /> },
  { id: 'brands', label: 'Brand', icon: <Building2 className="w-4 h-4" /> },
  { id: 'queries', label: 'Queries', icon: <Search className="w-4 h-4" /> },
  { id: 'run', label: 'Run', icon: <Zap className="w-4 h-4" /> },
];

export function SetupPanel({
  brands,
  setBrands,
  keywords,
  setKeywords,
  models,
  setModels,
  context,
  setContext,
  isRunning,
  progress,
  currentStep: runningStep,
  onRunExperiment,
}: SetupPanelProps) {
  const [step, setStep] = useState<SetupStep>('context');
  const [newBrandName, setNewBrandName] = useState("");
  const [seedKeyword, setSeedKeyword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [runsPerCombination, setRunsPerCombination] = useState(1);
  
  const selectedVariants: PromptVariant[] = ['minimal', 'frontloaded', 'stepwise'];
  const enabledModels = models.filter(m => m.enabled);

  const stepIndex = STEPS.findIndex(s => s.id === step);
  const canGoNext = () => {
    switch (step) {
      case 'context': return context.industry !== null;
      case 'brands': return brands.length > 0;
      case 'queries': return keywords.length > 0;
      default: return false;
    }
  };

  const goNext = () => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < STEPS.length) {
      setStep(STEPS[nextIndex].id);
    }
  };

  const goPrev = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setStep(STEPS[prevIndex].id);
    }
  };

  // Brand management
  const addBrand = () => {
    if (!newBrandName.trim()) return;
    const newBrand: Brand = {
      id: crypto.randomUUID(),
      name: newBrandName.trim(),
      aliases: [],
      type: 'client',
    };
    setBrands([...brands, newBrand]);
    setNewBrandName("");
  };

  const removeBrand = (id: string) => {
    setBrands(brands.filter(b => b.id !== id));
  };

  // Keyword generation
  const generateKeywords = async () => {
    if (!seedKeyword.trim()) {
      toast.error("Please enter a seed keyword");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-keywords', {
        body: { 
          seedKeyword: seedKeyword.trim(), 
          count: 5,
          industry: context.industry,
        }
      });

      if (error) throw error;

      const newKeywords: Keyword[] = data.keywords.map((kw: { id?: string; query: string; category?: string; intent?: string }) => ({
        id: kw.id || crypto.randomUUID(),
        query: kw.query,
        category: kw.category || seedKeyword.trim(),
        intent: (kw.intent as 'informational' | 'commercial' | 'transactional') || 'informational',
      }));

      setKeywords([...keywords, ...newKeywords]);
      toast.success(`Generated ${newKeywords.length} query variants`);
      setSeedKeyword("");
    } catch (error) {
      console.error('Error generating keywords:', error);
      toast.error("Failed to generate keywords");
    } finally {
      setIsGenerating(false);
    }
  };

  const removeKeyword = (id: string) => {
    setKeywords(keywords.filter(k => k.id !== id));
  };

  const toggleModel = (modelId: string) => {
    setModels(models.map(m => 
      m.id === modelId ? { ...m, enabled: !m.enabled } : m
    ));
  };

  const canRun = brands.length > 0 && keywords.length > 0 && enabledModels.length > 0;
  const totalConversations = keywords.length * enabledModels.length * runsPerCombination;
  const estimatedSeconds = Math.ceil(totalConversations / 2) * 15;
  const estimatedMinutes = Math.floor(estimatedSeconds / 60);
  const remainingSeconds = estimatedSeconds % 60;
  const estimatedTime = estimatedMinutes > 0 
    ? `~${estimatedMinutes}m ${remainingSeconds}s` 
    : `~${estimatedSeconds}s`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="py-2">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">Experiment Setup</p>
        <h1 className="text-3xl text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Ask a LLM
        </h1>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <button
              onClick={() => setStep(s.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                step === s.id
                  ? "bg-primary text-primary-foreground"
                  : stepIndex > i
                    ? "bg-success/20 text-success"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {s.icon}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight className="w-4 h-4 text-muted-foreground mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {step === 'context' && (
          <div className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Industry Vertical</CardTitle>
              </CardHeader>
              <CardContent>
                <IndustrySelector 
                  selected={context.industry} 
                  onSelect={(industry) => setContext({ ...context, industry })} 
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Brand Positioning</CardTitle>
                <p className="text-sm text-muted-foreground">
                  One sentence about what makes your brand unique
                </p>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="e.g., Leading sustainable luxury travel experiences for discerning travellers"
                  value={context.positioning}
                  onChange={(e) => setContext({ ...context, positioning: e.target.value })}
                  className="resize-none"
                  rows={2}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'brands' && (
          <div className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="w-5 h-5" />
                  Your Brand & Competitors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter brand name..."
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addBrand()}
                    className="flex-1"
                  />
                  <Button onClick={addBrand} disabled={!newBrandName.trim()}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 min-h-[48px]">
                  {brands.map((brand, i) => (
                    <Badge 
                      key={brand.id} 
                      variant={i === 0 ? 'default' : 'secondary'} 
                      className="gap-1 px-3 py-1.5 text-sm"
                    >
                      {i === 0 && <Target className="w-3 h-3" />}
                      {brand.name}
                      <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => removeBrand(brand.id)} />
                    </Badge>
                  ))}
                  {brands.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">Add your brand first, then competitors</p>
                  )}
                </div>
                
                {brands.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    First brand is your primary brand. Others are competitors for comparison.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'queries' && (
          <div className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Search className="w-5 h-5" />
                  Search Queries
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  What would your customers ask an AI about your industry?
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter topic or question..."
                    value={seedKeyword}
                    onChange={(e) => setSeedKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && generateKeywords()}
                    className="flex-1"
                  />
                  <Button onClick={generateKeywords} disabled={isGenerating || !seedKeyword.trim()}>
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-1" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {keywords.map((kw) => (
                    <Badge key={kw.id} variant="outline" className="gap-1 px-3 py-1.5">
                      {kw.query}
                      <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => removeKeyword(kw.id)} />
                    </Badge>
                  ))}
                  {keywords.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">Enter a topic and click Generate</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'run' && (
          <div className="space-y-6 animate-fade-in">
            {/* Models Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">AI Models to Test</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {models.map((model) => (
                    <label
                      key={model.id}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                        model.enabled 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Checkbox
                        checked={model.enabled}
                        onCheckedChange={() => toggleModel(model.id)}
                      />
                      <div>
                        <span className="font-medium text-sm block">{model.displayName}</span>
                        <span className="text-xs text-muted-foreground capitalize">{model.provider}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Run Summary */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between gap-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-2xl font-semibold">{totalConversations}</p>
                      <p className="text-sm text-muted-foreground">synthetic conversations</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{enabledModels.length} models</span>
                      <span>•</span>
                      <span>{keywords.length} queries</span>
                      <span>•</span>
                      <span>{estimatedTime}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Runs each:</Label>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        value={runsPerCombination}
                        onChange={(e) => setRunsPerCombination(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                        className="w-16"
                      />
                    </div>
                    <Button
                      size="lg"
                      onClick={() => onRunExperiment(selectedVariants, runsPerCombination)}
                      disabled={!canRun || isRunning}
                      className="px-8"
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {Math.round(progress)}%
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Run Analysis
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {isRunning && (
                  <div className="mt-6">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">{runningStep}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={stepIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        
        {step !== 'run' && (
          <Button
            onClick={goNext}
            disabled={!canGoNext()}
          >
            Continue
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
