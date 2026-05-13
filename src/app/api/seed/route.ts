import { NextResponse } from "next/server";
import { db, projects, documents, questions, meetings, tasks } from "@/db";

export async function POST() {
  // Clear all existing data (cascade order)
  await db.delete(tasks);
  await db.delete(meetings);
  await db.delete(questions);
  await db.delete(documents);
  await db.delete(projects);

  // ── Projects ────────────────────────────────────────────────────────────────
  const projectRows = await db.insert(projects).values([
    { name: "SoulT Buildings",    description: "Structural systems and building innovations", status: "active" },
    { name: "SoulT Systems",      description: "Platform infrastructure and tooling",          status: "active" },
    { name: "AI Council",         description: "Internal AI governance and agent development", status: "active" },
    { name: "Patent Development", description: "IP research and patent filing pipeline",       status: "active" },
    { name: "Website Platform",   description: "soulty.one public site and council dashboard", status: "active" },
  ]).returning();

  const [buildings, _systems, council, patents, website] = projectRows;

  // ── Documents ───────────────────────────────────────────────────────────────
  // schema fields: projectId, title, content, tags
  await db.insert(documents).values([
    {
      projectId: buildings.id,
      title:     "Panel System Overview",
      content:   "High-level overview of the interlocking panel design and assembly process.",
      tags:      JSON.stringify(["structural", "panels"]),
    },
    {
      projectId: buildings.id,
      title:     "Structural Load Calculations",
      content:   "Engineering calculations for lateral and gravity loads on the panel system.",
      tags:      JSON.stringify(["calculations", "engineering"]),
    },
    {
      projectId: patents.id,
      title:     "Patent Draft — Panel Lock",
      content:   "First draft of the panel locking mechanism patent, covering claims 1–12.",
      tags:      JSON.stringify(["patent", "draft"]),
    },
    {
      projectId: website.id,
      title:     "Phase 1 Architecture",
      content:   "System architecture for soulty.one Phase 1: Next.js 14 + Drizzle + Turso.",
      tags:      JSON.stringify(["architecture", "phase1"]),
    },
  ]);

  // ── Questions ───────────────────────────────────────────────────────────────
  // schema fields: projectId, title, content, answer, status
  await db.insert(questions).values([
    {
      projectId: buildings.id,
      title:     "What structural calculations support the panel system?",
      content:   "Need to verify all gravity and lateral load assumptions.",
      status:    "resolved",
      answer:    "See Structural Load Calculations document — gravity loads resolved at 1.2 kN/m², lateral at 0.8 kN/m².",
    },
    {
      projectId: buildings.id,
      title:     "What is the maximum span for unsupported panels?",
      content:   "Clarify span limits before finalising the structural specification.",
      status:    "open",
    },
    {
      projectId: patents.id,
      title:     "Which claims in the panel lock patent are most defensible?",
      content:   "Council review needed before filing.",
      status:    "in_progress",
    },
    {
      projectId: council.id,
      title:     "How should AI agents escalate decisions to the council?",
      content:   "Define the escalation protocol and confidence threshold for agent hand-off.",
      status:    "open",
    },
  ]);

  // ── Meetings ────────────────────────────────────────────────────────────────
  // schema fields: projectId, title, date, attendees, summary, decisions, nextSteps
  await db.insert(meetings).values([
    {
      projectId: council.id,
      title:     "Council Kick-off",
      date:      "2026-03-01",
      attendees: JSON.stringify(["J. Brackin", "Claude"]),
      summary:   "Established Phase 1 scope: data-first platform with 6 core modules before AI integration.",
      decisions: JSON.stringify(["Use Next.js + Turso for Phase 1", "No AI agents until Phase 2", "Deploy to soulty.one"]),
      nextSteps: JSON.stringify(["Scaffold project", "Define DB schema", "Build all 6 modules"]),
    },
    {
      projectId: buildings.id,
      title:     "Panel System Review",
      date:      "2026-02-20",
      attendees: JSON.stringify(["J. Brackin", "Engineering Team"]),
      summary:   "Reviewed structural integrity and assembly process for the interlocking panel system.",
      decisions: JSON.stringify(["Proceed with steel core design", "Commission third-party structural review"]),
      nextSteps: JSON.stringify(["Upload load calculations", "Write patent draft"]),
    },
  ]);

  // ── Tasks ───────────────────────────────────────────────────────────────────
  // schema fields: projectId, title, description, status, priority, dueDate
  await db.insert(tasks).values([
    { projectId: website.id,   title: "Deploy council dashboard to council.soulty.one", status: "in_progress", priority: "high",   dueDate: "2026-03-15" },
    { projectId: buildings.id, title: "Design panel locking system",                    status: "in_progress", priority: "high",   dueDate: "2026-03-20" },
    { projectId: patents.id,   title: "Write patent draft — panel lock",                status: "todo",        priority: "medium", dueDate: "2026-03-31" },
    { projectId: buildings.id, title: "Upload structural calculations",                  status: "done",        priority: "medium", dueDate: "2026-02-28" },
    { projectId: council.id,   title: "Define Phase 2 AI agent architecture",           status: "todo",        priority: "medium", dueDate: "2026-04-01" },
  ]);

  return NextResponse.json({ success: true, message: "Database seeded with demo data" });
}
