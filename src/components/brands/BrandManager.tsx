import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Building2, Target } from "lucide-react";
import { Brand } from "@/types";
import { cn } from "@/lib/utils";

interface BrandManagerProps {
  brands: Brand[];
  onBrandsChange: (brands: Brand[]) => void;
}

export function BrandManager({ brands, onBrandsChange }: BrandManagerProps) {
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandType, setNewBrandType] = useState<'client' | 'competitor'>('client');
  const [newAliases, setNewAliases] = useState("");

  const addBrand = () => {
    if (!newBrandName.trim()) return;
    
    const newBrand: Brand = {
      id: crypto.randomUUID(),
      name: newBrandName.trim(),
      aliases: newAliases.split(',').map(a => a.trim()).filter(Boolean),
      type: newBrandType,
    };

    onBrandsChange([...brands, newBrand]);
    setNewBrandName("");
    setNewAliases("");
  };

  const removeBrand = (id: string) => {
    onBrandsChange(brands.filter(b => b.id !== id));
  };

  const clientBrands = brands.filter(b => b.type === 'client');
  const competitorBrands = brands.filter(b => b.type === 'competitor');

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 animate-fade-in">
        <h3 className="font-semibold mb-4">Add New Brand</h3>
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => setNewBrandType('client')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all",
                newBrandType === 'client' 
                  ? "border-primary bg-primary/10 text-primary" 
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              <Building2 className="w-4 h-4" />
              Your Brand
            </button>
            <button
              onClick={() => setNewBrandType('competitor')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all",
                newBrandType === 'competitor' 
                  ? "border-primary bg-primary/10 text-primary" 
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              <Target className="w-4 h-4" />
              Competitor
            </button>
          </div>
          
          <Input
            placeholder="Brand name (e.g., Acme Corp)"
            value={newBrandName}
            onChange={(e) => setNewBrandName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addBrand()}
          />
          
          <Input
            placeholder="Aliases (comma-separated, e.g., Acme, ACME Inc)"
            value={newAliases}
            onChange={(e) => setNewAliases(e.target.value)}
          />
          
          <Button onClick={addBrand} className="w-full">
            <Plus className="w-4 h-4" />
            Add Brand
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Your Brands</h3>
            <Badge variant="secondary" className="ml-auto">{clientBrands.length}</Badge>
          </div>
          <div className="space-y-2">
            {clientBrands.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No brands added yet</p>
            ) : (
              clientBrands.map((brand) => (
                <div key={brand.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group">
                  <div>
                    <p className="font-medium">{brand.name}</p>
                    {brand.aliases.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Also: {brand.aliases.join(', ')}
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeBrand(brand.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-warning" />
            <h3 className="font-semibold">Competitors</h3>
            <Badge variant="secondary" className="ml-auto">{competitorBrands.length}</Badge>
          </div>
          <div className="space-y-2">
            {competitorBrands.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No competitors added yet</p>
            ) : (
              competitorBrands.map((brand) => (
                <div key={brand.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 group">
                  <div>
                    <p className="font-medium">{brand.name}</p>
                    {brand.aliases.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Also: {brand.aliases.join(', ')}
                      </p>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeBrand(brand.id)}
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
    </div>
  );
}
