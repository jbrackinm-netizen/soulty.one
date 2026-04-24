"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { Clock, Trash2, ChevronRight, RotateCcw } from "lucide-react";
import type { Task } from "@/db";

type Props = {
  tasks: Task[];
  projectMap: Record<number, string>;
};

export function TaskBoard({ tasks, projectMap }: Props) {
  const todo = tasks.filter((t) => t.status === "todo");
  const inProgress = tasks.filter((t) => t.status === "in_progress");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Column title="To-do" color="gray" tasks={todo} projectMap={projectMap} />
      <Column title="In Progress" color="blue" tasks={inProgress} projectMap={projectMap} />
      <Column title="Done" color="green" tasks={done} projectMap={projectMap} />
    </div>
  );
}

function Column({
  title,
  color,
  tasks,
  projectMap,
}: {
  title: string;
  color: "gray" | "blue" | "green";
  tasks: Task[];
  projectMap: Record<number, string>;
}) {
  const headingColor =
    color === "blue" ? "text-blue-500" : color === "green" ? "text-green-500" : "text-gray-400";

  return (
    <div>
      <h3 className={`text-xs font-semibold uppercase tracking-wide ${headingColor} mb-3`}>
        {title}
      </h3>
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            {color === "gray" ? "All clear" : color === "blue" ? "Nothing in progress" : "Nothing done yet"}
          </p>
        ) : (
          tasks.map((t) => <TaskCard key={t.id} task={t} projectMap={projectMap} />)
        )}
      </div>
    </div>
  );
}

function TaskCard({ task: t, projectMap }: { task: Task; projectMap: Record<number, string> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function moveTo(status: "todo" | "in_progress" | "done") {
    setLoading(true);
    await fetch(`/api/tasks/${t.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${t.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm transition-opacity ${loading ? "opacity-50" : ""}`}>
      <p className="text-sm font-medium text-gray-900">{t.title}</p>
      <div className="mt-2 flex items-center justify-between flex-wrap gap-1">
        <div className="flex flex-col gap-0.5">
          {t.description && <span className="text-xs text-gray-500">{t.description}</span>}
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
      {/* Action row */}
      <div className="mt-3 flex items-center gap-1.5 pt-2 border-t border-gray-100">
        {t.status === "todo" && (
          <button
            onClick={() => moveTo("in_progress")}
            disabled={loading}
            className="flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100 transition-colors"
          >
            <ChevronRight className="h-3 w-3" />
            Start
          </button>
        )}
        {t.status === "in_progress" && (
          <>
            <button
              onClick={() => moveTo("done")}
              disabled={loading}
              className="flex items-center gap-1 rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-600 hover:bg-green-100 transition-colors"
            >
              <ChevronRight className="h-3 w-3" />
              Complete
            </button>
            <button
              onClick={() => moveTo("todo")}
              disabled={loading}
              className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              Back
            </button>
          </>
        )}
        {t.status === "done" && (
          <button
            onClick={() => moveTo("todo")}
            disabled={loading}
            className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Reopen
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={loading}
          className="ml-auto rounded-md p-1 text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
