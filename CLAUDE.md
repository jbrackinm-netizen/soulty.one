# SoulT AI Council — CLAUDE.md

## What Is This Project?

**soulty.one** is the SoulT AI Council platform — a command center for organizing projects,
knowledge, decisions, and tasks across the SoulT organization. It is built for a team that
works across construction innovation, patents, AI systems, and platform development.

**Live domain:** `soulty.one`
**Council dashboard:** `council.soulty.one`
**AI brain (Phase 2):** `brain.soulty.one`
**API (Phase 2):** `api.soulty.one`

---

## Architecture

```
User Interface (Next.js 14 App Router)
     ↓
API Routes (/app/api/*)
     ↓
Database Layer (Drizzle ORM)
     ↓
SQLite (Phase 1) → PostgreSQL + pgvector (Phase 2)
```

### Phase 1 — Data-First Foundation (current)
A fully functional council dashboard with no AI components yet.
Data storage comes first. AI agents are Phase 2.

### Phase 2 — AI Council Agent Layer (upcoming)
- Anthropic Claude SDK for AI agents
- pgvector for document embedding and semantic search
- Multi-agent council for deliberation and decision support

---

## Core Modules (Phase 1)

| Module | Route | Description |
|--------|-------|-------------|
| Dashboard | `/dashboard` | Stats overview, recent docs, open questions, active tasks, latest decisions |
| Projects | `/projects` | Organize everything by project; each project has docs/questions/tasks/meetings |
| Document Vault | `/documents` | Upload and tag documents (PDFs, diagrams, research files) |
| Council Q&A | `/questions` | Ask questions, track answers; every resolved Q becomes permanent knowledge |
| Meeting Notes | `/meetings` | Log meeting summaries, decisions, and action items |
| Task Tracker | `/tasks` | Kanban-style task tracking (To-do / In Progress / Done) |

---

## Projects in the System

| Project | Purpose |
|---------|---------|
| SoulT Buildings | Structural systems and building innovations (panel systems, structural calculations) |
| SoulT Systems | Platform infrastructure and tooling |
| AI Council | Internal AI governance and agent development |
| Patent Development | IP research and patent filing pipeline (panel locking mechanism, etc.) |
| Website Platform | soulty.one public site and council dashboard |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript) |
| Styling | Tailwind CSS |
| ORM | Drizzle ORM |
| Database (Phase 1) | SQLite via better-sqlite3 (`soulty.db`) |
| Database (Phase 2) | PostgreSQL + pgvector |
| AI (Phase 2) | Anthropic Claude SDK |
| Icons | lucide-react |

---

## Key Files

```
src/
├── app/
│   ├── (dashboard)/         # All dashboard pages (sidebar layout)
│   │   ├── dashboard/       # Homepage with stats and recent activity
│   │   ├── projects/        # Project list + project detail + new project
│   │   ├── documents/       # Document vault with add form
│   │   ├── questions/       # Council Q&A with add form
│   │   ├── meetings/        # Meeting notes with add form
│   │   └── tasks/           # Kanban task tracker with add form
│   └── api/                 # REST API routes
│       ├── projects/        # GET, POST; [id]: PATCH, DELETE
│       ├── documents/       # GET (filterable by projectId), POST
│       ├── questions/       # GET, POST; [id]: PATCH, DELETE
│       ├── meetings/        # GET, POST
│       ├── tasks/           # GET, POST; [id]: PATCH, DELETE
│       └── seed/            # POST — seeds demo data
├── db/
│   ├── schema.ts            # All table definitions and types
│   └── index.ts             # Drizzle + SQLite client
├── components/
│   ├── layout/              # Sidebar, Header
│   └── ui/                  # Badge, Button, Card, StatCard
└── lib/
    └── utils.ts             # cn(), formatDate(), parseTags()
```

---

## Running Locally

```bash
npm install
npm run dev        # starts at http://localhost:3000
```

Then seed the database with demo data:
```bash
curl -X POST http://localhost:3000/api/seed
```

---

## Development Rules

1. **Phase 1 = data only.** No AI, no embeddings, no agents until Phase 2.
2. **All new features belong to a module.** Don't build outside the 6 core modules without discussion.
3. **Schema changes:** Update `src/db/schema.ts` and re-run `src/db/migrate.ts`.
4. **API routes:** Always return JSON. Use Drizzle for all DB access — no raw SQL except in migrate.ts.
5. **UI components:** Add to `src/components/ui/` before adding to pages.
6. **Client components:** Only mark `"use client"` when using hooks (useState, useRouter, etc.). Server components are the default.

---

## Phase 2 Roadmap

When Phase 1 is stable, Phase 2 will add:

- **AI Brain** — Claude-powered question answering using document embeddings
- **Semantic Search** — Find documents and answers by meaning, not just keyword
- **Agent Council** — Multiple specialized Claude agents deliberate on complex questions
- **Auto-summarization** — Meeting notes and documents are auto-summarized
- **Migration to PostgreSQL + pgvector** — Replace SQLite for production scale
