import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { db, projects, documents, questions, meetings, tasks } from "@/db";

async function runMigrations() {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL ?? "file:soulty.db",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS projects (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT NOT NULL,
      description TEXT,
      status      TEXT NOT NULL DEFAULT 'planning',
      progress    INTEGER DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at  TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
    CREATE TABLE IF NOT EXISTS documents (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id   INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      title        TEXT NOT NULL,
      content      TEXT,
      tags         TEXT,
      created_at   TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at   TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
    CREATE TABLE IF NOT EXISTS questions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      title      TEXT NOT NULL,
      content    TEXT,
      answer     TEXT,
      status     TEXT NOT NULL DEFAULT 'open',
      created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
    CREATE TABLE IF NOT EXISTS meetings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      date        TEXT,
      attendees   TEXT,
      summary     TEXT,
      decisions   TEXT,
      next_steps  TEXT,
      created_at  TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at  TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id  INTEGER REFERENCES projects(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      description TEXT,
      status      TEXT NOT NULL DEFAULT 'todo',
      priority    TEXT NOT NULL DEFAULT 'medium',
      due_date    TEXT,
      created_at  TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
      updated_at  TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
    );
  `);

  await client.close();
}

export async function POST() {
  await runMigrations();

  // Clear existing
  await db.delete(tasks);
  await db.delete(meetings);
  await db.delete(questions);
  await db.delete(documents);
  await db.delete(projects);

  // Projects
  const projectRows = await db.insert(projects).values([
    { name: "SoulT Buildings",    description: "Structural systems and building innovations", status: "active" },
    { name: "SoulT Systems",      description: "Platform infrastructure and tooling",          status: "active" },
    { name: "AI Council",         description: "Internal AI governance and agent development", status: "active" },
    { name: "Patent Development", description: "IP research and patent filing pipeline",       status: "active" },
    { name: "Website Platform",   description: "soulty.one public site and council dashboard", status: "active" },
  ]).returning();

  const [buildings, , council, patents, website] = projectRows;

  // Documents
  await db.insert(documents).values([
    { projectId: buildings.id, title: "Panel System Overview",        content: "High-level overview of the interlocking panel design", tags: JSON.stringify(["structural","panels"]) },
    { projectId: buildings.id, title: "Structural Load Calculations", content: "Engineering calculations for lateral and gravity loads",  tags: JSON.stringify(["calculations","engineering"]) },
    { projectId: patents.id,   title: "Patent Draft — Panel Lock",    content: "First draft of the panel locking mechanism patent",      tags: JSON.stringify(["patent","draft"]) },
    { projectId: website.id,   title: "Phase 1 Architecture",         content: "System architecture for soulty.one Phase 1",             tags: JSON.stringify(["architecture","phase1"]) },
  ]);

  // Questions
  await db.insert(questions).values([
    { projectId: buildings.id, title: "What structural calculations support the panel system?",   status: "resolved", answer: "Gravity loads at 1.2 kN/m², lateral at 0.8 kN/m².", content: "See Structural Load Calculations document." },
    { projectId: buildings.id, title: "What is the maximum span for unsupported panels?",          status: "open" },
    { projectId: patents.id,   title: "Which claims in the panel lock patent are most defensible?", status: "in_progress" },
    { projectId: council.id,   title: "How should AI agents escalate decisions to the council?",    status: "open" },
  ]);

  // Meetings
  await db.insert(meetings).values([
    {
      projectId:  council.id,
      title:      "Council Kick-off",
      date:       "2026-03-01",
      summary:    "Established Phase 1 scope: data-first platform with 6 core modules before AI integration.",
      decisions:  JSON.stringify(["Use Next.js + SQLite for Phase 1", "No AI agents until Phase 2", "Deploy to soulty.one"]),
      nextSteps:  JSON.stringify(["Scaffold project", "Define DB schema", "Build all 6 modules"]),
    },
    {
      projectId:  buildings.id,
      title:      "Panel System Review",
      date:       "2026-02-20",
      summary:    "Reviewed structural integrity and assembly process for the interlocking panel system.",
      decisions:  JSON.stringify(["Proceed with steel core design", "Commission third-party structural review"]),
      nextSteps:  JSON.stringify(["Upload load calculations", "Write patent draft"]),
    },
  ]);

  // Tasks
  await db.insert(tasks).values([
    { projectId: website.id,   title: "Deploy council dashboard to council.soulty.one", status: "in_progress", priority: "high",   dueDate: "2026-03-15" },
    { projectId: buildings.id, title: "Design panel locking system",                    status: "in_progress", priority: "high",   dueDate: "2026-03-20" },
    { projectId: patents.id,   title: "Write patent draft — panel lock",                status: "todo",        priority: "medium", dueDate: "2026-03-31" },
    { projectId: buildings.id, title: "Upload structural calculations",                  status: "done",        priority: "medium", dueDate: "2026-02-28" },
    { projectId: council.id,   title: "Define Phase 2 AI agent architecture",           status: "todo",        priority: "high",   dueDate: "2026-04-01" },
  ]);

  return NextResponse.json({ success: true, message: "Database migrated and seeded with demo data" });
}
