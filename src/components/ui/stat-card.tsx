import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  label,
  value,
  icon: Icon,
  color = "soul",
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: "soul" | "green" | "yellow" | "blue";
}) {
  const colors = {
    soul:   { bg: "bg-soul-50",   icon: "text-soul-600"  },
    green:  { bg: "bg-green-50",  icon: "text-green-600" },
    yellow: { bg: "bg-yellow-50", icon: "text-yellow-600"},
    blue:   { bg: "bg-blue-50",   icon: "text-blue-600"  },
  };
  const c = colors[color];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", c.bg)}>
          <Icon className={cn("h-6 w-6", c.icon)} />
        </div>
      </div>
    </div>
  );
}
