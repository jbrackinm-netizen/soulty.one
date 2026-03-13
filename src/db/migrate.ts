/**
 * Run this once to create all tables
 * Usage: npx tsx src/db/migrate.ts
 * For local dev: uses file:soulty.db (no env vars needed)
 * For cloud: set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN
 */
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL ?? "file:soulty.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

await client.executeMultiple(`
  CREATE TABLE IF NOT EXISTS projects (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    description TEXT,
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS documents (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id   INTEGER REFERENCES projects(id),
    title        TEXT NOT NULL,
    description  TEXT,
    tags         TEXT,
    uploaded_by  TEXT NOT NULL DEFAULT 'Council',
    file_name    TEXT,
    file_size    INTEGER,
    file_type    TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS questions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(id),
    question   TEXT NOT NULL,
    answer     TEXT,
    status     TEXT NOT NULL DEFAULT 'open',
    author     TEXT NOT NULL DEFAULT 'Council',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS meetings (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id   INTEGER REFERENCES projects(id),
    title        TEXT NOT NULL,
    date         TEXT NOT NULL,
    summary      TEXT,
    decisions    TEXT,
    action_items TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES projects(id),
    task       TEXT NOT NULL,
    owner      TEXT,
    status     TEXT NOT NULL DEFAULT 'todo',
    due_date   TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

console.log("✅ Database tables created");
await client.close();
