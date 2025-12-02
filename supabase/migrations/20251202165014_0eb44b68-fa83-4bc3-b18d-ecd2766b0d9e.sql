-- Create experiments table to store experiment metadata
CREATE TABLE public.experiments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'completed',
  total_responses INTEGER DEFAULT 0
);

-- Create experiment_results table for model-level results
CREATE TABLE public.experiment_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experiment_id UUID NOT NULL REFERENCES public.experiments(id) ON DELETE CASCADE,
  model_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  brand_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
  response_count INTEGER NOT NULL DEFAULT 0,
  avg_content_quality JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_experiment_results_experiment_id ON public.experiment_results(experiment_id);
CREATE INDEX idx_experiments_created_at ON public.experiments(created_at DESC);

-- Enable RLS (but allow public access for now since no auth)
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiment_results ENABLE ROW LEVEL SECURITY;

-- Create policies for public read/write (no auth required for MVP)
CREATE POLICY "Allow public read experiments" ON public.experiments FOR SELECT USING (true);
CREATE POLICY "Allow public insert experiments" ON public.experiments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete experiments" ON public.experiments FOR DELETE USING (true);

CREATE POLICY "Allow public read experiment_results" ON public.experiment_results FOR SELECT USING (true);
CREATE POLICY "Allow public insert experiment_results" ON public.experiment_results FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete experiment_results" ON public.experiment_results FOR DELETE USING (true);