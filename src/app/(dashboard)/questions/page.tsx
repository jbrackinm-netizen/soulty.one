import { db, questions, projects } from "@/db";
import { desc } from "drizzle-orm";
import { Card, CardBody } from "@/components/ui/card";
import { AddQuestionForm } from "./add-question-form";
import { QuestionCard } from "./question-card";
import { HelpCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function QuestionsPage() {
  const [qs, allProjects] = await Promise.all([
    db.select().from(questions).orderBy(desc(questions.createdAt)),
    db.select().from(projects).orderBy(projects.name),
  ]);

  const projectMap = Object.fromEntries(allProjects.map((p) => [p.id, p.name]));

  const open      = qs.filter((q) => q.status === "open");
  const reviewing = qs.filter((q) => q.status === "reviewing");
  const resolved  = qs.filter((q) => q.status === "resolved");

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
          {qs.map((q) => (
            <QuestionCard key={q.id} q={q} projectMap={projectMap} />
          ))}
        </div>
      )}
    </div>
  );
}
