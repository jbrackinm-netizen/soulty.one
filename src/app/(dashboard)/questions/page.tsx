import { db, questions, projects } from "@/db";
import { desc } from "drizzle-orm";
import { Card, CardBody } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { AddQuestionForm } from "./add-question-form";
import { HelpCircle } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function QuestionsPage() {
  const [qs, allProjects] = await Promise.all([
    db.select().from(questions).orderBy(desc(questions.createdAt)),
    db.select().from(projects).orderBy(projects.name),
  ]);

  const projectMap = Object.fromEntries(allProjects.map(p => [p.id, p.name]));

  const open     = qs.filter(q => q.status === "open");
  const reviewing = qs.filter(q => q.status === "reviewing");
  const resolved  = qs.filter(q => q.status === "resolved");

  return (
    <div className="space-y-6">
      <div className="flex gap-4 text-sm">
        <span className="text-yellow-600 font-medium">{open.length} Open</span>
        <span className="text-blue-600 font-medium">{reviewing.length} Reviewing</span>
        <span className="text-green-600 font-medium">{resolved.length} Resolved</span>
      </div>

      <AddQuestionForm projects={allProjects} />

      {qs.length === 0 ? (
        <Card>
          <CardBody>
            <div className="py-12 text-center">
              <HelpCircle className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No questions yet. Add your first council question.</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {qs.map(q => (
            <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{q.question}</p>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <Badge variant={statusVariant(q.status)}>{q.status}</Badge>
                    {q.projectId && (
                      <span className="text-xs text-gray-500">
                        {projectMap[q.projectId] ?? "Unknown project"}
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{q.author} · {formatDate(q.createdAt)}</span>
                  </div>
                </div>
              </div>
              {q.answer && (
                <div className="mt-3 rounded-lg bg-green-50 border border-green-100 px-4 py-3">
                  <p className="text-xs font-semibold text-green-700 mb-1">Answer</p>
                  <p className="text-sm text-green-900">{q.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
