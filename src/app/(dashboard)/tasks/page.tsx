import { db, tasks, projects } from "@/db";
import { desc, eq } from "drizzle-orm";
import { Card, CardBody } from "@/components/ui/card";
import { Badge, statusVariant } from "@/components/ui/badge";
import { AddTaskForm } from "./add-task-form";
import { CheckSquare, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [tsks, allProjects] = await Promise.all([
    db.select().from(tasks).orderBy(desc(tasks.createdAt)),
    db.select().from(projects).orderBy(projects.name),
  ]);

  const projectMap = Object.fromEntries(allProjects.map(p => [p.id, p.name]));

  const todo       = tsks.filter(t => t.status === "todo");
  const inProgress = tsks.filter(t => t.status === "in_progress");
  const done       = tsks.filter(t => t.status === "done");

  return (
    <div className="space-y-6">
      <div className="flex gap-4 text-sm">
        <span className="text-gray-500 font-medium">{todo.length} To-do</span>
        <span className="text-blue-600 font-medium">{inProgress.length} In progress</span>
        <span className="text-green-600 font-medium">{done.length} Done</span>
      </div>

      <AddTaskForm projects={allProjects} />

      {tsks.length === 0 ? (
        <Card>
          <CardBody>
            <div className="py-12 text-center">
              <CheckSquare className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm text-gray-500">No tasks yet. Add your first task above.</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* To-do */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">To-do</h3>
            <div className="space-y-3">
              {todo.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">All clear</p>
              )}
              {todo.map(t => <TaskCard key={t.id} task={t} projectMap={projectMap} />)}
            </div>
          </div>
          {/* In progress */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-500 mb-3">In Progress</h3>
            <div className="space-y-3">
              {inProgress.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Nothing in progress</p>
              )}
              {inProgress.map(t => <TaskCard key={t.id} task={t} projectMap={projectMap} />)}
            </div>
          </div>
          {/* Done */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-green-500 mb-3">Done</h3>
            <div className="space-y-3">
              {done.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Nothing done yet</p>
              )}
              {done.map(t => <TaskCard key={t.id} task={t} projectMap={projectMap} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task: t,
  projectMap,
}: {
  task: { id: number; task: string; owner: string | null; status: string; dueDate: string | null; projectId: number | null };
  projectMap: Record<number, string>;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-medium text-gray-900">{t.task}</p>
      <div className="mt-2 flex items-center justify-between flex-wrap gap-1">
        <div className="flex flex-col gap-0.5">
          {t.owner && <span className="text-xs text-gray-500">{t.owner}</span>}
          {t.projectId && (
            <span className="text-xs text-gray-400">{projectMap[t.projectId] ?? ""}</span>
          )}
        </div>
        <Badge variant={statusVariant(t.status)}>{t.status.replace("_", " ")}</Badge>
      </div>
      {t.dueDate && (
        <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
          <Clock className="h-3 w-3" />
          {formatDate(t.dueDate)}
        </div>
      )}
    </div>
  );
}
