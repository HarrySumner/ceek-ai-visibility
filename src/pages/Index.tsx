import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AskPanel } from "@/components/ask/AskPanel";
import { ResponsesPanel } from "@/components/responses/ResponsesPanel";
import { ExportPanel } from "@/components/export/ExportPanel";
import { NLPAnalysisPanel } from "@/components/nlp/NLPAnalysisPanel";
import { CompareModelsPanel } from "@/components/compare/CompareModelsPanel";
import { ExperimentHistory } from "@/components/history/ExperimentHistory";
import { HeroLanding } from "@/components/landing/HeroLanding";
import { useExperiment } from "@/hooks/useExperiment";

const Index = () => {
  const [activeTab, setActiveTab] = useState("ask");
  const [showHero, setShowHero] = useState(true);
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
    savedExperiments,
    loadExperiment,
    deleteExperiment,
    currentExperimentId,
  } = useExperiment();

  // Show hero landing when no experiment has been run and user hasn't dismissed it
  const shouldShowHero = showHero && !hasRun && results.length === 0 && activeTab === "ask";

  const handleGetStarted = () => {
    setShowHero(false);
  };

  const renderContent = () => {
    if (shouldShowHero) {
      return <HeroLanding onGetStarted={handleGetStarted} />;
    }

    switch (activeTab) {
      case "ask":
        return (
          <AskPanel
            brands={brands}
            setBrands={setBrands}
            keywords={keywords}
            setKeywords={setKeywords}
            models={models}
            setModels={setModels}
            isRunning={isRunning}
            progress={progress}
            currentStep={currentStep}
            onRunExperiment={runExperiment}
          />
        );

      case "responses":
        return <ResponsesPanel results={results} />;

      case "export":
        return <ExportPanel results={results} brands={brands} keywords={keywords} />;

      case "nlp":
        return <NLPAnalysisPanel results={results} />;

      case "compare":
        return <CompareModelsPanel results={results} brands={brands} />;

      case "history":
        return (
          <ExperimentHistory
            experiments={savedExperiments}
            currentExperimentId={currentExperimentId}
            onLoad={loadExperiment}
            onDelete={deleteExperiment}
          />
        );

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
