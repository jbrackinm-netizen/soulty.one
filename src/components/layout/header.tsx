"use client";

import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects":  "Projects",
  "/documents": "Document Vault",
  "/questions": "Council Q&A",
  "/meetings":  "Meeting Notes",
  "/tasks":     "Task Tracker",
};

function getTitle(pathname: string) {
  for (const [key, val] of Object.entries(titles)) {
    if (pathname === key || pathname.startsWith(key + "/")) return val;
  }
  return "SoulT Council";
}

export function Header() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-200 bg-white/80 backdrop-blur px-6">
      <h1 className="text-base font-semibold text-gray-900">{getTitle(pathname)}</h1>
    </header>
  );
}
