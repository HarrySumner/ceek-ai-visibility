import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Loader2, Plus, X, Sparkles, Building2, Search, Cpu } from "lucide-react";
import { Brand, Keyword, ModelConfig, PromptVariant } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AskPanelProps {
  brands: Brand[];
  setBrands: (brands: Brand[]) => void;
  keywords: Keyword[];
  setKeywords: (keywords: Keyword[]) => void;
  models: ModelConfig[];
  setModels: (models: ModelConfig[]) => void;
  isRunning: boolean;
  progress: number;
  currentStep: string;
  onRunExperiment: (variants: PromptVariant[], runsPerCombination: number) => void;
}

export function AskPanel({
  brands,
  setBrands,
  keywords,
  setKeywords,
  models,
  setModels,
  isRunning,
  progress,
  currentStep,
  onRunExperiment,
}: AskPanelProps) {
  const [newBrandName, setNewBrandName] = useState("");
  const [seedKeyword, setSeedKeyword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [runsPerCombination, setRunsPerCombination] = useState(1);
  
  // Use all CFF variants by default (analysis happens in NLP panel)
  const selectedVariants: PromptVariant[] = ['minimal', 'frontloaded', 'stepwise'];

  const enabledModels = models.filter(m => m.enabled);

  // Brand management
  const addBrand = (type: 'client' | 'competitor') => {
    if (!newBrandName.trim()) return;
    const newBrand: Brand = {
      id: crypto.randomUUID(),
      name: newBrandName.trim(),
      aliases: [],
      type,
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
        body: { seedKeyword: seedKeyword.trim(), count: 5 }
      });

      if (error) throw error;

      const newKeywords: Keyword[] = data.keywords.map((query: string) => ({
        id: crypto.randomUUID(),
        query,
        category: seedKeyword.trim(),
        intent: 'informational' as const,
      }));

      setKeywords([...keywords, ...newKeywords]);
      toast.success(`Generated ${newKeywords.length} keyword variants`);
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

  // Model management
  const toggleModel = (modelId: string) => {
    setModels(models.map(m => 
      m.id === modelId ? { ...m, enabled: !m.enabled } : m
    ));
  };

  // Run experiment - conversation mode tests all 3 CFF variants per call
  const canRun = brands.length > 0 && keywords.length > 0 && enabledModels.length > 0;
  const totalConversations = keywords.length * enabledModels.length * runsPerCombination;
  const totalResponses = totalConversations * 3; // 3 CFF variants per conversation

  return (
    <div className="space-y-6">
      <div className="py-2">
        <p className="text-xs text-muted-foreground tracking-widest uppercase mb-2">Experiment</p>
        <h1 className="text-3xl text-foreground" style={{ fontFamily: "'DM Serif Display', serif" }}>
          Ask a LLM
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brands */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="w-5 h-5" />
              Brands
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Brand name..."
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addBrand('client')}
              />
              <Button size="sm" onClick={() => addBrand('client')}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {brands.map((brand) => (
                <Badge key={brand.id} variant={brand.type === 'client' ? 'default' : 'secondary'} className="gap-1">
                  {brand.name}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeBrand(brand.id)} />
                </Badge>
              ))}
              {brands.length === 0 && (
                <p className="text-sm text-muted-foreground">No brands added</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Keywords */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="w-5 h-5" />
              Keywords
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Seed keyword..."
                value={seedKeyword}
                onChange={(e) => setSeedKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && generateKeywords()}
              />
              <Button size="sm" onClick={generateKeywords} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {keywords.map((kw) => (
                <Badge key={kw.id} variant="outline" className="gap-1">
                  {kw.query}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => removeKeyword(kw.id)} />
                </Badge>
              ))}
              {keywords.length === 0 && (
                <p className="text-sm text-muted-foreground">No keywords generated</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Models */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Cpu className="w-5 h-5" />
              Models
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {models.map((model) => (
                <label
                  key={model.id}
                  className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={model.enabled}
                    onCheckedChange={() => toggleModel(model.id)}
                  />
                  <span className="text-sm">{model.displayName}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Run Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-medium">Ready to run</p>
              <p className="text-sm text-muted-foreground">
                {keywords.length} keywords × {enabledModels.length} models = <strong>{totalConversations}</strong> conversations
              </p>
              <p className="text-xs text-muted-foreground">
                Each conversation tests 3 CFF variants in sequence → <strong>{totalResponses}</strong> total responses
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-sm">Runs:</Label>
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
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {Math.round(progress)}%
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Run Experiment
                  </>
                )}
              </Button>
            </div>
          </div>
          {isRunning && (
            <div className="mt-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{currentStep}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
