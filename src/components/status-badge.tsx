import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  issued: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  expiring: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  repair: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  ongoing: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  transferred: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  returned: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  read: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  disposed: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  inactive: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-transparent capitalize",
        styles[status] ?? "bg-muted text-muted-foreground",
      )}
    >
      {status.replace("_", " ")}
    </Badge>
  );
}
