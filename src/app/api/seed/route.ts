import { NextResponse } from "next/server";
import { db, projects, documents, questions, meetings, tasks } from "@/db";

export async function POST() {
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

  const [buildings, systems, council, patents, website] = projectRows;

  // Documents
  await db.insert(documents).values([
    { projectId: buildings.id, title: "Panel System Overview",        description: "High-level overview of the interlocking panel design", tags: JSON.stringify(["structural","panels"]),  uploadedBy: "J. Brackin" },
    { projectId: buildings.id, title: "Structural Load Calculations", description: "Engineering calculations for lateral and gravity loads",  tags: JSON.stringify(["calculations","engineering"]), uploadedBy: "J. Brackin" },
    { projectId: patents.id,   title: "Patent Draft — Panel Lock",    description: "First draft of the panel locking mechanism patent",      tags: JSON.stringify(["patent","draft"]),       uploadedBy: "Council" },
    { projectId: website.id,   title: "Phase 1 Architecture",         description: "System architecture for soulty.one Phase 1",             tags: JSON.stringify(["architecture","phase1"]), uploadedBy: "Claude" },
  ]);

  // Questions
  await db.insert(questions).values([
    { projectId: buildings.id, question: "What structural calculations support the panel system?",   status: "resolved", answer: "See Structural Load Calculations document — gravity loads resolved at 1.2 kN/m², lateral at 0.8 kN/m².", author: "J. Brackin" },
    { projectId: buildings.id, question: "What is the maximum span for unsupported panels?",          status: "open",     author: "Council" },
    { projectId: patents.id,   question: "Which claims in the panel lock patent are most defensible?", status: "reviewing", author: "Council" },
    { projectId: council.id,   question: "How should AI agents escalate decisions to the council?",    status: "open",     author: "Council" },
  ]);

  // Meetings
  await db.insert(meetings).values([
    {
      projectId: council.id,
      title:       "Council Kick-off",
      date:        "2026-03-01",
      summary:     "Established Phase 1 scope: data-first platform with 6 core modules before AI integration.",
      decisions:   JSON.stringify(["Use Next.js + SQLite for Phase 1", "No AI agents until Phase 2", "Deploy to soulty.one"]),
      actionItems: JSON.stringify(["Scaffold project", "Define DB schema", "Build all 6 modules"]),
    },
    {
      projectId: buildings.id,
      title:       "Panel System Review",
      date:        "2026-02-20",
      summary:     "Reviewed structural integrity and assembly process for the interlocking panel system.",
      decisions:   JSON.stringify(["Proceed with steel core design", "Commission third-party structural review"]),
      actionItems: JSON.stringify(["Upload load calculations", "Write patent draft"]),
    },
  ]);

  // Tasks
  await db.insert(tasks).values([
    { projectId: website.id,   task: "Deploy council dashboard to council.soulty.one", owner: "Claude",      status: "in_progress", dueDate: "2026-03-15" },
    { projectId: buildings.id, task: "Design panel locking system",                    owner: "J. Brackin",  status: "in_progress", dueDate: "2026-03-20" },
    { projectId: patents.id,   task: "Write patent draft — panel lock",                owner: "J. Brackin",  status: "todo",        dueDate: "2026-03-31" },
    { projectId: buildings.id, task: "Upload structural calculations",                  owner: "J. Brackin",  status: "done",        dueDate: "2026-02-28" },
    { projectId: council.id,   task: "Define Phase 2 AI agent architecture",           owner: "Council",     status: "todo",        dueDate: "2026-04-01" },
  ]);

  return NextResponse.json({ success: true, message: "Database seeded with demo data" });
}
