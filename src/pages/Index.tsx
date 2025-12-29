import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AskPanel } from "@/components/ask/AskPanel";
import { ResponsesPanel } from "@/components/responses/ResponsesPanel";
import { ExportPanelEnhanced } from "@/components/export/ExportPanelEnhanced";
import { NLPAnalysisPanel } from "@/components/nlp/NLPAnalysisPanel";
import { CompareModelsPanel } from "@/components/compare/CompareModelsPanel";
import { ExperimentHistory } from "@/components/history/ExperimentHistory";
import { KeywordsPanel } from "@/components/keywords/KeywordsPanel";
import { KeywordInsightsPanel } from "@/components/keywords/KeywordInsightsPanel";
import { useExperiment } from "@/hooks/useExperiment";

const Index = () => {
  const [activeTab, setActiveTab] = useState("keywords");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const {
    brands,
    setBrands,
    keywords,
    setKeywords,
    models,
    setModels,
    results,
    rawResponses,
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

  // Handle project selection from Keywords panel
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  // Handle keyword test from Keyword Tracking
  const handleTestKeyword = (keyword: string) => {
    // Add keyword to experiment keywords if not already present
    const exists = keywords.some(k => k.query.toLowerCase() === keyword.toLowerCase());
    if (!exists) {
      const newKeyword = {
        id: `kw-${Date.now()}`,
        query: keyword,
        intent: 'commercial' as const,
      };
      setKeywords([...keywords, newKeyword]);
    }
    // Navigate to Ask tab
    setActiveTab("ask");
  };

  // Handle bulk keyword test from Keyword Tracking
  const handleTestMultipleKeywords = (keywordStrings: string[]) => {
    const newKeywords = keywordStrings
      .filter(kw => !keywords.some(k => k.query.toLowerCase() === kw.toLowerCase()))
      .map((kw, idx) => ({
        id: `kw-${Date.now()}-${idx}`,
        query: kw,
        intent: 'commercial' as const,
      }));
    
    if (newKeywords.length > 0) {
      setKeywords([...keywords, ...newKeywords]);
    }
    // Navigate to Ask tab
    setActiveTab("ask");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "keywords":
        return (
          <KeywordsPanel 
            brands={brands} 
            onTestKeyword={handleTestKeyword} 
            onTestMultipleKeywords={handleTestMultipleKeywords}
            selectedProjectId={selectedProjectId}
            onProjectSelect={handleProjectSelect}
          />
        );

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
            selectedProjectId={selectedProjectId}
            onProjectChange={handleProjectSelect}
          />
        );

      case "responses":
        return (
          <ResponsesPanel 
            results={results} 
            rawResponses={rawResponses}
            brands={brands}
            onNavigateToNLP={() => setActiveTab("nlp")} 
          />
        );

      case "insights":
        return <KeywordInsightsPanel brands={brands} results={results} />;

      case "export":
        return <ExportPanelEnhanced results={results} brands={brands} keywords={keywords} />;

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
