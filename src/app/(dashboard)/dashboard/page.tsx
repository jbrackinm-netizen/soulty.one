import { db, projects, documents, questions, meetings, tasks } from "@/db";
import { eq, count, desc } from "drizzle-orm";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { FolderOpen, FileText, HelpCircle, Calendar, CheckSquare, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { DashboardNexus } from "./dashboard-nexus";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [
    projectCount,
    documentCount,
    openQuestionCount,
    activeTaskCount,
    meetingCount,
    recentDocs,
    openQuestions,
    activeTasks,
    recentMeetings,
    allProjects,
  ] = await Promise.all([
    db.select({ c: count() }).from(projects).then(r => r[0].c),
    db.select({ c: count() }).from(documents).then(r => r[0].c),
    db.select({ c: count() }).from(questions).where(eq(questions.status, "open")).then(r => r[0].c),
    db.select({ c: count() }).from(tasks).where(eq(tasks.status, "in_progress")).then(r => r[0].c),
    db.select({ c: count() }).from(meetings).then(r => r[0].c),
    db.select().from(documents).orderBy(desc(documents.createdAt)).limit(5),
    db.select().from(questions).where(eq(questions.status, "open")).orderBy(desc(questions.createdAt)).limit(5),
    db.select().from(tasks).where(eq(tasks.status, "in_progress")).orderBy(desc(tasks.createdAt)).limit(5),
    db.select().from(meetings).orderBy(desc(meetings.date)).limit(3),
    db.select().from(projects).orderBy(projects.name).limit(10),
  ]);

  const projectMap = Object.fromEntries(allProjects.map(p => [p.id, p.name]));

  return (
    <div className="space-y-6">
      {/* Stats row — exactly 5 cards as specified */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Projects"        value={projectCount}       icon={FolderOpen}  color="soul"   />
        <StatCard label="Documents"       value={documentCount}      icon={FileText}    color="blue"   />
        <StatCard label="Open Questions"  value={openQuestionCount}  icon={HelpCircle}  color="yellow" />
        <StatCard label="Active Tasks"    value={activeTaskCount}    icon={CheckSquare} color="soul"   />
        <StatCard label="Meetings"        value={meetingCount}       icon={Calendar}    color="green"  />
      </div>

      {/* Nexus Brain AI Insight */}
      <DashboardNexus
        projects={allProjects.map(p => ({ name: p.name, status: p.status, description: p.description ?? undefined }))}
        tasks={activeTasks.map(t => ({ title: t.task, status: t.status as "open" | "in_progress" | "blocked" | "done", owner: t.owner ?? undefined, dueDate: t.dueDate ?? undefined }))}
        meetings={recentMeetings.map(m => ({ title: m.title, date: m.date, summary: m.summary ?? undefined, decisions: m.decisions ? JSON.parse(m.decisions) : undefined }))}
      />

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Documents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Recent Documents</h2>
              <Link href="/documents" className="text-xs text-soul-600 hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {recentDocs.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">No documents yet</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentDocs.map(doc => (
                  <li key={doc.id} className="flex items-start gap-3 px-6 py-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{doc.title}</p>
                      <p className="text-xs text-gray-500">
                        {doc.projectId ? projectMap[doc.projectId] : "General"} · {formatDate(doc.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Open Questions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Open Questions</h2>
              <Link href="/questions" className="text-xs text-soul-600 hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {openQuestions.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">No open questions</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {openQuestions.map(q => (
                  <li key={q.id} className="px-6 py-3">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{q.question}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={statusVariant(q.status)}>{q.status}</Badge>
                      <span className="text-xs text-gray-400">{q.author} · {formatDate(q.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Active Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Active Tasks</h2>
              <Link href="/tasks" className="text-xs text-soul-600 hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {activeTasks.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">No active tasks</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {activeTasks.map(t => (
                  <li key={t.id} className="flex items-center gap-3 px-6 py-3">
                    <CheckSquare className="h-4 w-4 shrink-0 text-soul-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{t.task}</p>
                      <p className="text-xs text-gray-500">{t.owner ?? "Unassigned"}</p>
                    </div>
                    {t.dueDate && (
                      <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0">
                        <Clock className="h-3 w-3" />
                        {formatDate(t.dueDate)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Recent Meetings */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900">Recent Meetings</h2>
              <Link href="/meetings" className="text-xs text-soul-600 hover:underline">View all</Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {recentMeetings.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-gray-400">No meetings yet</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {recentMeetings.map(m => {
                  const decisions: string[] = m.decisions ? JSON.parse(m.decisions) : [];
                  const actions: string[]   = m.actionItems ? JSON.parse(m.actionItems) : [];
                  return (
                    <li key={m.id} className="px-6 py-4">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900">{m.title}</p>
                        <span className="shrink-0 text-xs text-gray-400">{formatDate(m.date)}</span>
                      </div>
                      {m.summary && (
                        <p className="text-xs text-gray-500 mb-2 line-clamp-1">{m.summary}</p>
                      )}
                      {decisions.length > 0 && (
                        <div className="space-y-0.5">
                          {decisions.slice(0, 2).map((d, i) => (
                            <p key={i} className="text-xs text-soul-700">· {d}</p>
                          ))}
                          {decisions.length > 2 && (
                            <p className="text-xs text-gray-400">+{decisions.length - 2} more decisions</p>
                          )}
                        </div>
                      )}
                      {actions.length > 0 && (
                        <p className="mt-1 text-xs text-gray-400">{actions.length} action item{actions.length !== 1 ? "s" : ""}</p>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Projects overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Projects Overview</h2>
            <Link href="/projects" className="text-xs text-soul-600 hover:underline">View all</Link>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {allProjects.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-gray-400">No projects yet</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {allProjects.map(p => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-soul-50 shrink-0">
                    <FolderOpen className="h-4 w-4 text-soul-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="truncate text-xs text-gray-500">{p.description}</p>
                  </div>
                  <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
