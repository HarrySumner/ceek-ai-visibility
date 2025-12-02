import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Search, Sparkles } from "lucide-react";
import { Keyword } from "@/types";
import { cn } from "@/lib/utils";

interface KeywordManagerProps {
  keywords: Keyword[];
  onKeywordsChange: (keywords: Keyword[]) => void;
}

const INTENT_OPTIONS: { value: Keyword['intent']; label: string; color: string }[] = [
  { value: 'informational', label: 'Informational', color: 'text-blue-400' },
  { value: 'commercial', label: 'Commercial', color: 'text-warning' },
  { value: 'transactional', label: 'Transactional', color: 'text-success' },
];

const SUGGESTED_TEMPLATES = [
  "best {category} for {audience}",
  "which {category} is best for {use_case}?",
  "compare top {category} providers",
  "{category} recommendations for {context}",
];

export function KeywordManager({ keywords, onKeywordsChange }: KeywordManagerProps) {
  const [newQuery, setNewQuery] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newIntent, setNewIntent] = useState<Keyword['intent']>('commercial');

  const addKeyword = () => {
    if (!newQuery.trim()) return;
    
    const newKeyword: Keyword = {
      id: crypto.randomUUID(),
      query: newQuery.trim(),
      category: newCategory.trim() || undefined,
      intent: newIntent,
    };

    onKeywordsChange([...keywords, newKeyword]);
    setNewQuery("");
    setNewCategory("");
  };

  const removeKeyword = (id: string) => {
    onKeywordsChange(keywords.filter(k => k.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 animate-fade-in">
        <h3 className="font-semibold mb-4">Add New Keyword / Scenario</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Search Query</label>
            <Input
              placeholder="e.g., best cloud storage providers for small business"
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addKeyword()}
            />
          </div>
          
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Category (optional)</label>
            <Input
              placeholder="e.g., cloud storage, travel insurance"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Search Intent</label>
            <div className="flex gap-2">
              {INTENT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setNewIntent(option.value)}
                  className={cn(
                    "flex-1 p-3 rounded-lg border text-sm font-medium transition-all",
                    newIntent === option.value 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          
          <Button onClick={addKeyword} className="w-full">
            <Plus className="w-4 h-4" />
            Add Keyword
          </Button>
        </div>
      </div>

      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Template Ideas</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_TEMPLATES.map((template, idx) => (
            <button
              key={idx}
              onClick={() => setNewQuery(template)}
              className="px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {template}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Keywords</h3>
          <Badge variant="secondary" className="ml-auto">{keywords.length}</Badge>
        </div>
        <div className="space-y-2">
          {keywords.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No keywords added yet</p>
          ) : (
            keywords.map((keyword) => (
              <div key={keyword.id} className="flex items-start justify-between p-4 rounded-lg bg-muted/50 group">
                <div className="flex-1">
                  <p className="font-medium">{keyword.query}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {keyword.category && (
                      <Badge variant="muted">{keyword.category}</Badge>
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
