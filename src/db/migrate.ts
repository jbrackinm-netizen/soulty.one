/**
 * Run this once to create all tables
 * Usage: npx tsx src/db/migrate.ts
 * Requires: NETLIFY_DATABASE_URL environment variable
 */
import { neon } from "@netlify/neon";

const sql = neon(); // uses NETLIFY_DATABASE_URL

await sql`CREATE TYPE IF NOT EXISTS project_status AS ENUM ('active', 'paused', 'complete')`;
await sql`CREATE TYPE IF NOT EXISTS question_status AS ENUM ('open', 'reviewing', 'resolved')`;
await sql`CREATE TYPE IF NOT EXISTS task_status AS ENUM ('todo', 'in_progress', 'done')`;

await sql`
  CREATE TABLE IF NOT EXISTS projects (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    status      project_status NOT NULL DEFAULT 'active',
    created_at  TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
    updated_at  TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS documents (
    id           SERIAL PRIMARY KEY,
    project_id   INTEGER REFERENCES projects(id),
    title        TEXT NOT NULL,
    description  TEXT,
    tags         TEXT,
    uploaded_by  TEXT NOT NULL DEFAULT 'Council',
    file_name    TEXT,
    file_size    INTEGER,
    file_type    TEXT,
    created_at   TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS questions (
    id         SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    question   TEXT NOT NULL,
    answer     TEXT,
    status     question_status NOT NULL DEFAULT 'open',
    author     TEXT NOT NULL DEFAULT 'Council',
    created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
    updated_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS meetings (
    id           SERIAL PRIMARY KEY,
    project_id   INTEGER REFERENCES projects(id),
    title        TEXT NOT NULL,
    date         TEXT NOT NULL,
    summary      TEXT,
    decisions    TEXT,
    action_items TEXT,
    created_at   TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
  )
`;

await sql`
  CREATE TABLE IF NOT EXISTS tasks (
    id         SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    task       TEXT NOT NULL,
    owner      TEXT,
    status     task_status NOT NULL DEFAULT 'todo',
    due_date   TEXT,
    created_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS'),
    updated_at TEXT NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD HH24:MI:SS')
  )
`;

console.log("✅ Database tables created");
