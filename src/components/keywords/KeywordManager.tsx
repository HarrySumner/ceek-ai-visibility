import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Search, Sparkles, Loader2, Wand2 } from "lucide-react";
import { Keyword } from "@/types";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface KeywordManagerProps {
  keywords: Keyword[];
  onKeywordsChange: (keywords: Keyword[]) => void;
}

const INTENT_OPTIONS: { value: Keyword['intent']; label: string; color: string }[] = [
  { value: 'informational', label: 'Informational', color: 'text-blue-400' },
  { value: 'commercial', label: 'Commercial', color: 'text-warning' },
  { value: 'transactional', label: 'Transactional', color: 'text-success' },
];

export function KeywordManager({ keywords, onKeywordsChange }: KeywordManagerProps) {
  const [seedKeyword, setSeedKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [variantCount, setVariantCount] = useState(6);

  const generateVariants = async () => {
    if (!seedKeyword.trim()) {
      toast.error("Please enter a seed keyword");
      return;
    }
    
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-keywords', {
        body: {
          seedKeyword: seedKeyword.trim(),
          category: category.trim() || undefined,
          count: variantCount,
        }
      });

      if (error) {
        throw error;
      }

      if (data?.keywords && Array.isArray(data.keywords)) {
        onKeywordsChange([...keywords, ...data.keywords]);
        toast.success(`Generated ${data.keywords.length} keyword variants`);
        setSeedKeyword("");
        setCategory("");
      }
    } catch (err) {
      console.error("Failed to generate keywords:", err);
      toast.error("Failed to generate keywords. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const removeKeyword = (id: string) => {
    onKeywordsChange(keywords.filter(k => k.id !== id));
  };

  const clearAllKeywords = () => {
    onKeywordsChange([]);
    toast.success("All keywords cleared");
  };

  return (
    <div className="space-y-6">
      {/* Seed Keyword Input */}
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-4">
          <Wand2 className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Generate Keyword Variants</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Enter a seed keyword and we'll auto-generate semantic variants for comprehensive testing
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Seed Keyword</label>
            <Input
              placeholder="e.g., cloud storage, project management, CRM"
              value={seedKeyword}
              onChange={(e) => setSeedKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && generateVariants()}
            />
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Category (optional)</label>
            <Input
              placeholder="e.g., SaaS, enterprise software"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Number of Variants</label>
            <div className="flex gap-2">
              {[4, 6, 8, 10].map((count) => (
                <button
                  key={count}
                  onClick={() => setVariantCount(count)}
                  className={cn(
                    "flex-1 p-3 rounded-lg border font-medium transition-all",
                    variantCount === count
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
          
          <Button 
            onClick={generateVariants} 
            className="w-full"
            disabled={isGenerating || !seedKeyword.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Variants...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Semantic Variants
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Generated Keywords */}
      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Keywords</h3>
          <Badge variant="secondary" className="ml-auto">{keywords.length}</Badge>
          {keywords.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllKeywords}>
              Clear All
            </Button>
          )}
        </div>
        <div className="space-y-2">
          {keywords.length === 0 ? (
            <div className="text-center py-8">
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No keywords yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Enter a seed keyword above to generate variants
              </p>
            </div>
          ) : (
            keywords.map((keyword) => (
              <div key={keyword.id} className="flex items-start justify-between p-4 rounded-lg bg-muted/50 group">
                <div className="flex-1">
                  <p className="font-medium">{keyword.query}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {keyword.category && (
                      <Badge variant="secondary">{keyword.category}</Badge>
                    )}
                    {keyword.intent && (
                      <Badge variant="outline" className={cn(
                        keyword.intent === 'informational' && "text-blue-400 border-blue-400/30",
                        keyword.intent === 'commercial' && "text-warning border-warning/30",
                        keyword.intent === 'transactional' && "text-success border-success/30"
                      )}>
                        {keyword.intent}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => removeKeyword(keyword.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
