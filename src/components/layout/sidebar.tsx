"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  HelpCircle,
  Calendar,
  CheckSquare,
  Brain,
  Users,
  Search,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard",  label: "Dashboard",    icon: LayoutDashboard },
  { href: "/projects",   label: "Projects",     icon: FolderOpen },
  { href: "/documents",  label: "Documents",    icon: FileText },
  { href: "/questions",  label: "Council Q&A",  icon: HelpCircle },
  { href: "/meetings",   label: "Meetings",     icon: Calendar },
  { href: "/tasks",      label: "Tasks",        icon: CheckSquare },
];

const aiItems = [
  { href: "/council",              label: "AI Council",      icon: Users },
  { href: "/council/visualizer",   label: "Visualizer",      icon: Eye },
  { href: "/search",               label: "AI Search",       icon: Search },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-gray-200 px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-soul-600">
          <Brain className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 leading-none">SoulT</p>
          <p className="text-xs text-gray-500 leading-none mt-0.5">AI Council</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {/* Core modules */}
        <div className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-soul-50 text-soul-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-soul-600" : "text-gray-400")} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* AI features */}
        <div>
          <p className="px-3 mb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
            AI Layer
          </p>
          <div className="space-y-0.5">
            {aiItems.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-soul-50 text-soul-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", active ? "text-soul-600" : "text-gray-400")} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 px-5 py-4">
        <p className="text-xs text-gray-400">soulty.one · Phase 2</p>
      </div>
    </aside>
  );
}
