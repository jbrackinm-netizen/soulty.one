"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects":  "Projects",
  "/documents": "Document Vault",
  "/questions": "Council Q&A",
  "/meetings":  "Meeting Notes",
  "/tasks":     "Task Tracker",
  "/council":   "AI Council",
  "/search":    "AI Search",
};

function getTitle(pathname: string) {
  for (const [key, val] of Object.entries(titles)) {
    if (pathname === key || pathname.startsWith(key + "/")) return val;
  }
  return "SoulT Council";
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    setQuery("");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur px-6 gap-4">
      <h1 className="text-base font-semibold text-gray-900 shrink-0">{getTitle(pathname)}</h1>

      {/* Quick search */}
      <form onSubmit={handleSearch} className="relative max-w-xs w-full hidden sm:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="AI Search…"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-soul-300 focus:bg-white transition-colors"
        />
      </form>
    </header>
  );
}
