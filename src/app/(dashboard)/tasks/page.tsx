import { db, tasks, projects } from "@/db";
import { desc } from "drizzle-orm";
import { Card, CardBody } from "@/components/ui/card";
import { AddTaskForm } from "./add-task-form";
import { TaskBoard } from "./task-board";
import { CheckSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const [tsks, allProjects] = await Promise.all([
    db.select().from(tasks).orderBy(desc(tasks.createdAt)),
    db.select().from(projects).orderBy(projects.name),
  ]);

  const projectMap = Object.fromEntries(allProjects.map((p) => [p.id, p.name]));

  const todo       = tsks.filter((t) => t.status === "todo");
  const inProgress = tsks.filter((t) => t.status === "in_progress");
  const done       = tsks.filter((t) => t.status === "done");

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
        <TaskBoard tasks={tsks} projectMap={projectMap} />
      )}
    </div>
  );
}
