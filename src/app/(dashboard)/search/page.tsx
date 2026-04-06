"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Loader2, FileText, HelpCircle, Calendar, FolderOpen } from "lucide-react";
import type { SearchResult } from "@/app/api/ai/search/route";

const typeConfig: Record<
  SearchResult["type"],
  { icon: React.ElementType; label: string; color: string }
> = {
  project:  { icon: FolderOpen,  label: "Project",  color: "text-soul-600 bg-soul-50 border-soul-200" },
  document: { icon: FileText,    label: "Document",  color: "text-blue-600 bg-blue-50 border-blue-200" },
  question: { icon: HelpCircle,  label: "Question",  color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  meeting:  { icon: Calendar,    label: "Meeting",   color: "text-green-600 bg-green-50 border-green-200" },
};

function SearchInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const initialQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (initialQuery) runSearch(initialQuery);
    inputRef.current?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function runSearch(q: string) {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    router.replace(`/search?q=${encodeURIComponent(q)}`, { scroll: false });

    const res = await fetch("/api/ai/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: q }),
    });

    setLoading(false);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Unknown error" }));
      setError(err.error);
      return;
    }
    const data = await res.json();
    setResults(data.results ?? []);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runSearch(query);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across projects, documents, questions, meetings…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-soul-300"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="flex items-center gap-1.5 rounded-xl bg-soul-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-soul-700 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {searched && !loading && !error && (
        <>
          {results.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              No relevant content found for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-400">
                {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
              </p>
              {results.map((r, i) => {
                const cfg = typeConfig[r.type];
                const Icon = cfg.icon;
                return (
                  <Link
                    key={`${r.type}-${r.id}-${i}`}
                    href={r.href}
                    className="block rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-soul-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${cfg.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color.split(" ")[0]}`}>
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 truncate">{r.label}</p>
                        {r.summary && (
                          <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{r.summary}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}

      {!searched && !loading && (
        <div className="py-12 text-center">
          <Search className="mx-auto h-10 w-10 text-gray-200" />
          <p className="mt-3 text-sm text-gray-400">
            AI-powered search across your entire council knowledge base.
          </p>
          <p className="text-xs text-gray-300 mt-1">Projects · Documents · Questions · Meetings</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-sm text-gray-400">Loading search…</div>}>
      <SearchInner />
    </Suspense>
  );
}
