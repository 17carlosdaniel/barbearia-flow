-- Engagement tables for "Enquanto você espera"

CREATE TABLE IF NOT EXISTS public.wait_missions_progress (
  user_id UUID NOT NULL,
  mission_id TEXT NOT NULL,
  progress_count INTEGER NOT NULL DEFAULT 0,
  completed_count INTEGER NOT NULL DEFAULT 0,
  last_completed_at TIMESTAMP WITH TIME ZONE NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mission_id)
);

ALTER TABLE public.wait_missions_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wait mission progress" ON public.wait_missions_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own wait mission progress" ON public.wait_missions_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wait mission progress" ON public.wait_missions_progress
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.wait_rewards_events (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  mission_id TEXT NOT NULL,
  mission_type TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  barbershop_id TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wait_rewards_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wait rewards" ON public.wait_rewards_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wait rewards" ON public.wait_rewards_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.wait_quiz_results (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommended_style TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wait_quiz_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wait quiz results" ON public.wait_quiz_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wait quiz results" ON public.wait_quiz_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.wait_surveys (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wait_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wait surveys" ON public.wait_surveys
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wait surveys" ON public.wait_surveys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.wait_photo_posts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL,
  image_data_url TEXT NOT NULL,
  caption TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wait_photo_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own wait photo posts" ON public.wait_photo_posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wait photo posts" ON public.wait_photo_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);
