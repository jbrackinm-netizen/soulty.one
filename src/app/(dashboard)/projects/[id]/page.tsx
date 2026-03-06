import { db, projects, documents, questions, meetings, tasks } from "@/db";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { FileText, HelpCircle, Calendar, CheckSquare } from "lucide-react";
import { formatDate, parseTags } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const [project] = await db.select().from(projects).where(eq(projects.id, id));
  if (!project) notFound();

  const [docs, qs, mtgs, tsks] = await Promise.all([
    db.select().from(documents).where(eq(documents.projectId, id)),
    db.select().from(questions).where(eq(questions.projectId, id)),
    db.select().from(meetings).where(eq(meetings.projectId, id)),
    db.select().from(tasks).where(eq(tasks.projectId, id)),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
            <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
          </div>
          {project.description && <p className="mt-1 text-sm text-gray-500">{project.description}</p>}
          <p className="mt-1 text-xs text-gray-400">Created {formatDate(project.createdAt)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Documents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Documents ({docs.length})</h3>
              </div>
              <Link href="/documents" className="text-xs text-soul-600 hover:underline">+ Add</Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {docs.length === 0 ? (
              <p className="px-6 py-6 text-center text-sm text-gray-400">No documents</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {docs.map(d => (
                  <li key={d.id} className="px-6 py-3">
                    <p className="text-sm font-medium text-gray-900">{d.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {parseTags(d.tags).map(t => (
                        <span key={t} className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{t}</span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{d.uploadedBy} · {formatDate(d.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Questions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Questions ({qs.length})</h3>
              </div>
              <Link href="/questions" className="text-xs text-soul-600 hover:underline">+ Add</Link>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {qs.length === 0 ? (
              <p className="px-6 py-6 text-center text-sm text-gray-400">No questions</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {qs.map(q => (
                  <li key={q.id} className="px-6 py-3">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">{q.question}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant={statusVariant(q.status)}>{q.status}</Badge>
                      <span className="text-xs text-gray-400">{formatDate(q.createdAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Meetings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Meetings ({mtgs.length})</h3>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {mtgs.length === 0 ? (
              <p className="px-6 py-6 text-center text-sm text-gray-400">No meetings</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {mtgs.map(m => (
                  <li key={m.id} className="px-6 py-3">
                    <p className="text-sm font-medium text-gray-900">{m.title}</p>
                    <p className="text-xs text-gray-400">{formatDate(m.date)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">Tasks ({tsks.length})</h3>
            </div>
          </CardHeader>
          <CardBody className="p-0">
            {tsks.length === 0 ? (
              <p className="px-6 py-6 text-center text-sm text-gray-400">No tasks</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {tsks.map(t => (
                  <li key={t.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{t.task}</p>
                      <p className="text-xs text-gray-400">{t.owner ?? "Unassigned"}</p>
                    </div>
                    <Badge variant={statusVariant(t.status)}>{t.status.replace("_", " ")}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
