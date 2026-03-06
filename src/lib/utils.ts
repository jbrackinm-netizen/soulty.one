import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function parseTags(tags: string | null | undefined): string[] {
  if (!tags) return [];
  try { return JSON.parse(tags); } catch { return []; }
}

export function stringifyTags(tags: string[]): string {
  return JSON.stringify(tags);
}
