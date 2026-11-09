import Link from "next/link";
import { AlertTriangle, Boxes, CheckCircle2, PackageX } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate, isoDaysFromNow, todayIso } from "@/lib/format";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { count: totalAssets },
    { count: expiringCount },
    { count: activeCount },
    { count: repairCount },
    { count: pendingDisposalCount },
    { data: recentAssignments },
    { data: pendingAlerts },
    { data: categories },
  ] = await Promise.all([
    supabase.from("assets").select("*", { count: "exact", head: true }),
    supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .gte("expiration_date", todayIso())
      .lte("expiration_date", isoDaysFromNow(90))
      .neq("status", "disposed"),
    supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("status", "repair"),
    supabase
      .from("disposal")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("asset_assignments")
      .select(
        "*, assets(asset_name, asset_code), accountable_officers(first_name, last_name)",
      )
      .order("assigned_date", { ascending: false })
      .limit(5),
    supabase
      .from("alerts")
      .select("*, assets(asset_name, asset_code)")
      .eq("status", "pending")
      .order("alert_date", { ascending: true })
      .limit(5),
    supabase.from("categories").select("category_id, category_name"),
  ]);

  const categoryCounts = await Promise.all(
    (categories ?? []).map(async (category) => {
      const { count } = await supabase
        .from("assets")
        .select("*", { count: "exact", head: true })
        .eq("category_id", category.category_id);
      return { ...category, count: count ?? 0 };
    }),
  );

  const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    issued: "default",
    returned: "secondary",
    transferred: "outline",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of property assets and lifecycle status
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Assets" value={totalAssets ?? 0} icon={Boxes} />
        <StatCard
          label="Expiring (≤ 90 days)"
          value={expiringCount ?? 0}
          hint="Action required"
          icon={AlertTriangle}
        />
        <StatCard
          label="Active / In-Use"
          value={activeCount ?? 0}
          icon={CheckCircle2}
        />
        <StatCard
          label="For Disposal / Repair"
          value={(repairCount ?? 0) + (pendingDisposalCount ?? 0)}
          hint={`${repairCount ?? 0} for repair, ${pendingDisposalCount ?? 0} pending disposal`}
          icon={PackageX}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Transactions</CardTitle>
            <Link
              href="/dashboard/movements"
              className="text-xs text-muted-foreground hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAssignments && recentAssignments.length > 0 ? (
              recentAssignments.map((row) => (
                <div
                  key={row.assignment_id}
                  className="flex items-center justify-between border-b border-border/60 pb-3 text-sm last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">
                      {row.assets?.asset_name ?? "Unknown asset"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.assets?.asset_code} &middot;{" "}
                      {row.accountable_officers
                        ? `${row.accountable_officers.first_name} ${row.accountable_officers.last_name}`
                        : "Unassigned"}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusVariant[row.status] ?? "outline"}>
                      {row.status}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(row.assigned_date)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No transactions recorded yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Expiry / Warranty Alerts</CardTitle>
            <Link
              href="/dashboard/alerts"
              className="text-xs text-muted-foreground hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingAlerts && pendingAlerts.length > 0 ? (
              pendingAlerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  className="flex items-center justify-between border-b border-border/60 pb-3 text-sm last:border-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">
                      {alert.assets?.asset_name ?? "Unknown asset"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {alert.alert_message}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(alert.alert_date)}
                  </p>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No pending alerts.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Asset Categories Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categoryCounts.map((category) => (
            <div
              key={category.category_id}
              className="rounded-lg border border-border/60 p-3"
            >
              <p className="text-xs text-muted-foreground">
                {category.category_name}
              </p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                {category.count}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
