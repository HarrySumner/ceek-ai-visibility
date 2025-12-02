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
import { ExperimentHistory } from "@/components/history/ExperimentHistory";
import { useExperiment } from "@/hooks/useExperiment";
import { TrendingUp, Target, Activity, Zap } from "lucide-react";

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
    isRunning,
    progress,
    currentStep,
    runExperiment,
    insights,
    savedExperiments,
    loadExperiment,
    deleteExperiment,
    currentExperimentId,
  } = useExperiment();

  const enabledModels = models.filter(m => m.enabled);

  // Calculate aggregate metrics
  const avgMentionRate = results.length > 0
    ? results.reduce((sum, r) => 
        sum + r.brandScores.reduce((s, bs) => s + bs.mentionRate, 0) / r.brandScores.length, 0
      ) / results.length
    : 0;

  const avgComposite = results.length > 0
    ? results.reduce((sum, r) => 
        sum + r.brandScores.reduce((s, bs) => s + bs.compositeScore, 0) / r.brandScores.length, 0
      ) / results.length
    : 0;

  const totalResponses = results.reduce((sum, r) => sum + r.responseCount, 0);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center py-8">
              <h1 className="text-4xl md:text-5xl mb-4 text-foreground">
                The unfair advantage to<br />brand visibility in AI.
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Track how AI models perceive and recommend your brand across different contexts and prompts.
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Average Mention Rate"
                value={`${(avgMentionRate * 100).toFixed(1)}%`}
                icon={<Target className="w-5 h-5" />}
                trend={hasRun ? "+12% vs baseline" : undefined}
                status={avgMentionRate > 0.5 ? "success" : avgMentionRate > 0.3 ? "warning" : "default"}
              />
              <MetricCard
                title="Composite Score"
                value={avgComposite.toFixed(2)}
                icon={<TrendingUp className="w-5 h-5" />}
                description="Combined mention, rank & quality"
                status={avgComposite > 0.6 ? "success" : avgComposite > 0.3 ? "warning" : "default"}
              />
              <MetricCard
                title="Models Tested"
                value={enabledModels.length.toString()}
                icon={<Activity className="w-5 h-5" />}
                description={`of ${models.length} available`}
              />
              <MetricCard
                title="Total Responses"
                value={totalResponses.toString()}
                icon={<Zap className="w-5 h-5" />}
                description="API calls completed"
              />
            </div>

            {/* Results Matrix */}
            <BrandMatrix results={results} brands={brands} />

            {/* Insights */}
            <InsightsSummary insights={insights} />
          </div>
        );

      case "brands":
        return <BrandManager brands={brands} onBrandsChange={setBrands} />;

      case "keywords":
        return <KeywordManager keywords={keywords} onKeywordsChange={setKeywords} />;

      case "models":
        return <ModelSelector models={models} onModelsChange={setModels} />;

      case "run":
        return (
          <ExperimentRunner
            brands={brands}
            keywords={keywords}
            models={models}
            isRunning={isRunning}
            progress={progress}
            currentStep={currentStep}
            onRunExperiment={runExperiment}
          />
        );

      case "history":
        return (
          <ExperimentHistory
            experiments={savedExperiments}
            currentExperimentId={currentExperimentId}
            onLoad={loadExperiment}
            onDelete={deleteExperiment}
          />
        );

      case "export":
        return <ExportPanel results={results} brands={brands} keywords={keywords} />;

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default Index;