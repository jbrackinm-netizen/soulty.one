import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

const variants: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  error:   "bg-red-100 text-red-700",
  info:    "bg-blue-100 text-blue-700",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function statusVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    active:      "success",
    complete:    "info",
    paused:      "warning",
    open:        "warning",
    reviewing:   "info",
    resolved:    "success",
    todo:        "default",
    in_progress: "info",
    done:        "success",
  };
  return map[status] ?? "default";
}
