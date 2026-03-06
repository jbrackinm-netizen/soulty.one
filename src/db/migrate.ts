/**
 * Run this once to create all tables in soulty.db
 * Usage: npx tsx src/db/migrate.ts
 */
import Database from "better-sqlite3";

const sqlite = new Database("./soulty.db");

sqlite.pragma("journal_mode = WAL");

sqlite.exec(`
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

console.log("✅ Database tables created in soulty.db");
sqlite.close();
