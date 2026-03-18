-- ============================================================
-- DevForge AI — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- Safe to re-run multiple times
-- ============================================================

-- Profiles (auto-created on signup)
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  name        TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Add role column if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  description TEXT DEFAULT '',
  is_public   BOOLEAN DEFAULT FALSE,
  deploy_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Project Files
CREATE TABLE IF NOT EXISTS project_files (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  path        TEXT NOT NULL,
  content     TEXT DEFAULT '',
  language    TEXT DEFAULT 'plaintext',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ──────────────────────────────────────

ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Drop old policies before recreating
DROP POLICY IF EXISTS "profiles: own read"       ON profiles;
DROP POLICY IF EXISTS "profiles: own update"     ON profiles;
DROP POLICY IF EXISTS "profiles: own insert"     ON profiles;
DROP POLICY IF EXISTS "profiles: admin read all" ON profiles;

DROP POLICY IF EXISTS "projects: own or public read" ON projects;
DROP POLICY IF EXISTS "projects: own insert"         ON projects;
DROP POLICY IF EXISTS "projects: own update"         ON projects;
DROP POLICY IF EXISTS "projects: own delete"         ON projects;
DROP POLICY IF EXISTS "projects: admin all"          ON projects;

DROP POLICY IF EXISTS "files: own read"   ON project_files;
DROP POLICY IF EXISTS "files: own insert" ON project_files;
DROP POLICY IF EXISTS "files: own update" ON project_files;
DROP POLICY IF EXISTS "files: own delete" ON project_files;

-- Profiles policies
CREATE POLICY "profiles: own read"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles: own update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles: own insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles: admin read all" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Projects policies
CREATE POLICY "projects: own or public read" ON projects
  FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "projects: own insert" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects: own update" ON projects
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "projects: own delete" ON projects
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "projects: admin all" ON projects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Project Files policies
CREATE POLICY "files: own read" ON project_files
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "files: own insert" ON project_files
  FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "files: own update" ON project_files
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "files: own delete" ON project_files
  FOR DELETE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- ── Auto-create profile on signup ──────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
