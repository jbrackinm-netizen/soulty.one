-- SoulT / Nexus Brain — Supabase schema
-- Run this in the Supabase SQL editor or via psql

-- ── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR UNIQUE NOT NULL,
  name        VARCHAR,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ── Projects ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ── Memories (context / decisions / tasks) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS memories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  type        VARCHAR CHECK (type IN ('task', 'decision', 'document', 'conversation')),
  content     TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ── Task logs (AI call audit trail) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type   VARCHAR,
  model_used  VARCHAR CHECK (model_used IN ('claude', 'gpt', 'gemini')),
  prompt      TEXT,
  response    TEXT,
  usage       JSONB,
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ── Workflows ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workflows (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  name        VARCHAR NOT NULL,
  steps       JSONB DEFAULT '[]',
  status      VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  created_at  TIMESTAMP DEFAULT NOW()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_memories_project  ON memories(project_id);
CREATE INDEX IF NOT EXISTS idx_memories_user     ON memories(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_type     ON memories(type);
CREATE INDEX IF NOT EXISTS idx_task_logs_created ON task_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_workflows_project ON workflows(project_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status  ON workflows(status);

-- Enable full-text search on memories.content
ALTER TABLE memories ADD COLUMN IF NOT EXISTS content_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;
CREATE INDEX IF NOT EXISTS idx_memories_content_fts ON memories USING GIN (content_tsv);
