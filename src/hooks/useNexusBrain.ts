import { useState, useCallback } from "react";

// Type definitions (match the API)
export interface ProjectItem {
  id?: string;
  name: string;
  status?: string;
  progress?: number;
  description?: string;
}

export interface TaskItem {
  id?: string;
  title: string;
  status?: "open" | "in_progress" | "blocked" | "done";
  priority?: "high" | "medium" | "low";
  assignee?: string;
  dueDate?: string;
  description?: string;
}

export interface NoteItem {
  id?: string;
  title: string;
  content: string;
  createdAt?: string;
  tags?: string[];
}

export interface MeetingItem {
  id?: string;
  title: string;
  date?: string;
  attendees?: string[];
  summary?: string;
  decisions?: string[];
  nextSteps?: string[];
}

export interface NexusResponse {
  summary: string;
  priorities: string[];
  blockers: string[];
  recommendations: string[];
  nextActions: string[];
  timestamp: string;
  mode: string;
}

interface UseNexusBrainOptions {
  onSuccess?: (data: NexusResponse) => void;
  onError?: (error: string) => void;
}

export function useNexusBrain(options?: UseNexusBrainOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NexusResponse | null>(null);

  // Insight mode: dashboard summary
  const getInsight = useCallback(
    async (projects: ProjectItem[], tasks: TaskItem[], notes: NoteItem[], meetings: MeetingItem[]) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/nexus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projects,
            tasks,
            notes,
            meetings,
            mode: "insight",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result: NexusResponse = await response.json();
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        options?.onError?.(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  // Chat mode: answer user question
  const chat = useCallback(
    async (
      userQuery: string,
      projects: ProjectItem[],
      tasks: TaskItem[],
      notes: NoteItem[],
      meetings: MeetingItem[]
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/nexus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projects,
            tasks,
            notes,
            meetings,
            mode: "chat",
            userQuery,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result: NexusResponse = await response.json();
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        options?.onError?.(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  // Action mode: get specific action (blockers, priorities, next steps, summary)
  const getAction = useCallback(
    async (
      actionType: "blockers" | "priorities" | "next_steps" | "summary",
      projects: ProjectItem[],
      tasks: TaskItem[],
      notes: NoteItem[],
      meetings: MeetingItem[]
    ) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/nexus", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projects,
            tasks,
            notes,
            meetings,
            mode: "action",
            actionType,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const result: NexusResponse = await response.json();
        setData(result);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        options?.onError?.(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return {
    loading,
    error,
    data,
    getInsight,
    chat,
    getAction,
    reset: () => {
      setData(null);
      setError(null);
    },
  };
}
