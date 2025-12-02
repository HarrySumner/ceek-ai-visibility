import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ModelConfig } from "@/types";
import { cn } from "@/lib/utils";

interface ModelSelectorProps {
  models: ModelConfig[];
  onModelsChange: (models: ModelConfig[]) => void;
}

const MODEL_INFO: Record<string, { color: string; description: string }> = {
  'openai': { color: 'text-emerald-400', description: 'OpenAI GPT models' },
  'google': { color: 'text-blue-400', description: 'Google Gemini models' },
  'anthropic': { color: 'text-orange-400', description: 'Anthropic Claude models' },
  'deepseek': { color: 'text-purple-400', description: 'DeepSeek models' },
};

export function ModelSelector({ models, onModelsChange }: ModelSelectorProps) {
  const toggleModel = (modelId: string) => {
    onModelsChange(
      models.map(m => 
        m.id === modelId ? { ...m, enabled: !m.enabled } : m
      )
    );
  };

  const enabledCount = models.filter(m => m.enabled).length;

  const groupedModels = models.reduce((acc, model) => {
    if (!acc[model.provider]) acc[model.provider] = [];
    acc[model.provider].push(model);
    return acc;
  }, {} as Record<string, ModelConfig[]>);

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold">Select AI Models</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Choose which models to include in your experiment
            </p>
          </div>
          <Badge variant={enabledCount > 0 ? 'default' : 'muted'}>
            {enabledCount} selected
          </Badge>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedModels).map(([provider, providerModels], idx) => {
            const info = MODEL_INFO[provider];
            return (
              <div 
                key={provider}
                className="animate-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn("font-semibold capitalize", info?.color)}>
                    {provider}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {info?.description}
                  </span>
                </div>
                <div className="space-y-2">
                  {providerModels.map((model) => (
                    <div 
                      key={model.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer",
                        model.enabled 
                          ? "bg-primary/5 border-primary/30" 
                          : "bg-muted/30 border-border hover:border-primary/20"
                      )}
                      onClick={() => toggleModel(model.id)}
                    >
                      <div>
                        <p className="font-medium">{model.displayName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{model.name}</p>
                      </div>
                      <Switch 
                        checked={model.enabled}
                        onCheckedChange={() => toggleModel(model.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
