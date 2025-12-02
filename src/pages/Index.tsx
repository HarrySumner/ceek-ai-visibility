import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { BrandMatrix } from "@/components/dashboard/BrandMatrix";
import { InsightsSummary } from "@/components/dashboard/InsightsSummary";
import { BrandManager } from "@/components/brands/BrandManager";
import { KeywordManager } from "@/components/keywords/KeywordManager";
import { ModelSelector } from "@/components/models/ModelSelector";
import { ExperimentRunner } from "@/components/experiment/ExperimentRunner";
import { ExportPanel } from "@/components/export/ExportPanel";
import { useExperiment } from "@/hooks/useExperiment";
import { Tags, Search, Cpu, BarChart3 } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const {
    brands,
    setBrands,
    keywords,
    setKeywords,
    models,
    setModels,
    results,
    hasRun,
    runExperiment,
    insights,
  } = useExperiment();

  const enabledModels = models.filter(m => m.enabled);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Dashboard</h2>
              <p className="text-muted-foreground mt-1">
                Track how AI models mention and rank your brands
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                title="Brands Tracked"
                value={brands.length}
                subtitle={`${brands.filter(b => b.type === 'client').length} yours, ${brands.filter(b => b.type === 'competitor').length} competitors`}
                icon={Tags}
                variant="primary"
              />
              <MetricCard
                title="Keywords"
                value={keywords.length}
                subtitle="Search scenarios"
                icon={Search}
              />
              <MetricCard
                title="Models Active"
                value={enabledModels.length}
                subtitle={`of ${models.length} available`}
                icon={Cpu}
              />
              <MetricCard
                title="Avg. Composite Score"
                value={hasRun && results.length > 0 
                  ? `${(results.flatMap(r => r.brandScores).reduce((sum, bs) => sum + bs.compositeScore, 0) / results.flatMap(r => r.brandScores).length * 100).toFixed(0)}%`
                  : '—'
                }
                subtitle={hasRun ? "Across all brands" : "Run experiment first"}
                icon={BarChart3}
                variant={hasRun ? "success" : "default"}
              />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <BrandMatrix 
                  results={results} 
                  brands={brands}
                />
              </div>
              <div>
                <InsightsSummary insights={insights} />
              </div>
            </div>
          </div>
        );

      case 'brands':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Brand Management</h2>
              <p className="text-muted-foreground mt-1">
                Add your brands and competitors to track
              </p>
            </div>
            <BrandManager brands={brands} onBrandsChange={setBrands} />
          </div>
        );

      case 'keywords':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Keywords & Scenarios</h2>
              <p className="text-muted-foreground mt-1">
                Define the search queries and scenarios to test
              </p>
            </div>
            <KeywordManager keywords={keywords} onKeywordsChange={setKeywords} />
          </div>
        );

      case 'models':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">AI Models</h2>
              <p className="text-muted-foreground mt-1">
                Select which AI models to include in your experiments
              </p>
            </div>
            <ModelSelector models={models} onModelsChange={setModels} />
          </div>
        );

      case 'run':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Run Experiment</h2>
              <p className="text-muted-foreground mt-1">
                Configure and execute your brand rank tracking experiment
              </p>
            </div>
            <ExperimentRunner
              brands={brands}
              keywords={keywords}
              models={models}
              onRunComplete={runExperiment}
            />
          </div>
        );

      case 'export':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Export Results</h2>
              <p className="text-muted-foreground mt-1">
                Download your data in various formats
              </p>
            </div>
            <ExportPanel hasResults={hasRun} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Index;
