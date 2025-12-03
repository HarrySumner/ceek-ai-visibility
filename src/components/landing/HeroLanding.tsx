import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

interface HeroLandingProps {
  onGetStarted: () => void;
}

export function HeroLanding({ onGetStarted }: HeroLandingProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Dark Hero Section */}
      <div className="bg-sidebar text-sidebar-foreground rounded-2xl overflow-hidden">
        <div className="px-8 py-16 md:px-16 md:py-24 lg:py-32">
          <div className="max-w-3xl">
            <p className="text-xs tracking-[0.3em] uppercase text-sidebar-foreground/50 mb-6">
              AI Brand Visibility
            </p>
            
            <h1 
              className="text-4xl md:text-5xl lg:text-6xl text-sidebar-foreground leading-tight mb-8"
              style={{ fontFamily: "'DM Serif Display', serif" }}
            >
              The unfair advantage to brand visibility in AI.
            </h1>
            
            <p className="text-lg text-sidebar-foreground/70 mb-10 max-w-xl leading-relaxed">
              Track how AI models perceive, recommend, and rank your brand. 
              Measure visibility across GPT, Gemini, Claude, and more.
            </p>
            
            <Button 
              onClick={onGetStarted}
              className="btn-ceek bg-sidebar-foreground text-sidebar hover:bg-sidebar-foreground/90 px-8 py-6 text-base rounded-full"
            >
              Start Experiment
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <FeatureCard
          title="Multi-Model Testing"
          description="Test your brand across GPT-4, Gemini, Claude, and DeepSeek simultaneously."
        />
        <FeatureCard
          title="CFF Analysis"
          description="Cognitive Forcing Functions reveal how prompt structure affects brand visibility."
        />
        <FeatureCard
          title="NLP Metrics"
          description="Ghosh (2024) framework for content quality: sentiment, readability, and more."
        />
      </div>

      {/* How It Works */}
      <div className="mt-12 p-8 rounded-2xl border bg-card">
        <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
          How It Works
        </p>
        <h2 
          className="text-2xl mb-6"
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          Three steps to AI visibility insights
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          <Step number={1} title="Add Brands & Keywords" description="Define your brand and competitors, then generate semantic keyword variants." />
          <Step number={2} title="Run Experiment" description="Query multiple AI models with different cognitive forcing function prompts." />
          <Step number={3} title="Analyse Results" description="View NLP metrics, compare models, and export comprehensive reports." />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 rounded-xl border bg-card hover:border-primary/30 transition-colors">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <Sparkles className="w-4 h-4 text-primary" />
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
        {number}
      </div>
      <div>
        <h4 className="font-medium mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
