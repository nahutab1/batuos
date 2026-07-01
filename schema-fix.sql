-- SADECE BU 3 TABLOYU OLUŞTUR (mevcut triggerlar bozulmaz)

-- 6. Startup Discovery
CREATE TABLE IF NOT EXISTS startup_ideas (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name text NOT NULL,
  description text,
  source text NOT NULL,
  source_urls text[] DEFAULT '{}',
  problem_solved text,
  target_audience text,
  business_model text,
  why_noteworthy text,
  first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  age_label text DEFAULT 'new',
  engagement_score INTEGER DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  duplicate_hash text UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 7. Discovery Discussions
CREATE TABLE IF NOT EXISTS discovery_discussions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  startup_id uuid REFERENCES startup_ideas(id) ON DELETE CASCADE NOT NULL,
  messages jsonb DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 8. Nutrition / Food Logs
CREATE TABLE IF NOT EXISTS food_logs (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  meal_type text NOT NULL DEFAULT 'snack',
  food_name text NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein_g NUMERIC(6,1) DEFAULT 0,
  carbs_g NUMERIC(6,1) DEFAULT 0,
  fat_g NUMERIC(6,1) DEFAULT 0,
  image_url text,
  notes text,
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Daha önce yoksa triggerları ekle
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_startup_ideas_updated_at') THEN
    CREATE TRIGGER update_startup_ideas_updated_at BEFORE UPDATE ON startup_ideas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_discovery_discussions_updated_at') THEN
    CREATE TRIGGER update_discovery_discussions_updated_at BEFORE UPDATE ON discovery_discussions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_food_logs_updated_at') THEN
    CREATE TRIGGER update_food_logs_updated_at BEFORE UPDATE ON food_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- RLS
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'food_logs' AND policyname = 'Allow all for authenticated') THEN
    CREATE POLICY "Allow all for authenticated" ON food_logs FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;
