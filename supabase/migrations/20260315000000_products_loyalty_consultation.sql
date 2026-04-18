-- Products table for e-commerce (opcional)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'geral',
  stock INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Barbershop owners can manage products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM barbershops WHERE barbershops.id = products.barbershop_id AND barbershops.owner_id = auth.uid())
  );

-- Loyalty badges definitions
CREATE TABLE IF NOT EXISTS public.loyalty_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'trophy',
  requirement_type TEXT NOT NULL DEFAULT 'appointments',
  requirement_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges" ON public.loyalty_badges
  FOR SELECT USING (true);

INSERT INTO public.loyalty_badges (name, description, icon, requirement_type, requirement_value) VALUES
  ('Primeira Visita', 'Fez seu primeiro agendamento', 'sparkles', 'appointments', 1),
  ('Cliente Fiel', 'Completou 5 agendamentos', 'heart', 'appointments', 5),
  ('Explorador', 'Experimentou 3 estilos diferentes', 'compass', 'styles', 3),
  ('Pontual', '5 agendamentos sem atraso', 'clock', 'on_time', 5),
  ('Veterano', 'Completou 20 agendamentos', 'award', 'appointments', 20),
  ('Avaliador', 'Deixou 3 avaliações', 'message-circle', 'reviews', 3),
  ('Indicador', 'Indicou 3 amigos', 'users', 'referrals', 3)
;

-- User earned badges
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.loyalty_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Loyalty points
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'appointment',
  description TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points" ON public.loyalty_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert points" ON public.loyalty_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Consultation requests (consulta prévia)
CREATE TABLE IF NOT EXISTS public.consultation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  barbershop_id UUID NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
  photo_urls TEXT[] DEFAULT '{}',
  lifestyle_description TEXT DEFAULT '',
  style_preferences TEXT DEFAULT '',
  hair_type TEXT DEFAULT '',
  face_shape TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  barber_response TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view own consultations" ON public.consultation_requests
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Clients can create consultations" ON public.consultation_requests
  FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Barbers can view consultations for their shop" ON public.consultation_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM barbershops WHERE barbershops.id = consultation_requests.barbershop_id AND barbershops.owner_id = auth.uid())
  );

CREATE POLICY "Barbers can update consultations" ON public.consultation_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM barbershops WHERE barbershops.id = consultation_requests.barbershop_id AND barbershops.owner_id = auth.uid())
  );
