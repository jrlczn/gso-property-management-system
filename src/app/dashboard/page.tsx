
import Link from "next/link";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  PackageX,
} from "lucide-react";

import { StatCard } from "@/components/stat-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { createClient } from "@/lib/supabase/server";
import {
  formatDate,
  isoDaysFromNow,
  todayIso,
} from "@/lib/format";

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
    // TOTAL ASSETS
    supabase
      .from("assets")
      .select("*", { count: "exact", head: true }),

    // EXPIRING ASSETS
    supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .gte("expiration_date", todayIso())
      .lte("expiration_date", isoDaysFromNow(90))
      .neq("status", "disposed"),

    // ACTIVE ASSETS
    supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),

    // ASSETS FOR REPAIR
    supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("status", "repair"),

    // PENDING DISPOSALS
    supabase
      .from("disposal")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),

    // RECENT TRANSACTIONS
    // Fetch assignments without nested asset relationship.
    supabase
      .from("asset_assignments")
      .select(`
        *,
        accountable_officers (
          first_name,
          last_name
        )
      `)
      .order("assigned_date", { ascending: false })
      .limit(5),

    // PENDING ALERTS
    supabase
      .from("alerts")
      .select("*, assets(asset_name, asset_code)")
      .eq("status", "pending")
      .order("alert_date", { ascending: true })
      .limit(5),

    // ASSET CATEGORIES
    supabase
      .from("categories")
      .select("category_id, category_name"),
  ]);

  // GET ASSET IDs FROM RECENT TRANSACTIONS
  const recentAssetIds = Array.from(
    new Set(
      (recentAssignments ?? [])
        .map((row) => row.asset_id)
        .filter((id): id is number => id !== null),
    ),
  );

  // FETCH ASSET DETAILS DIRECTLY FROM ASSETS TABLE
  const {
    data: recentAssets,
    error: recentAssetsError,
  } = recentAssetIds.length > 0
    ? await supabase
        .from("assets")
        .select("asset_id, asset_name, asset_code")
        .in("asset_id", recentAssetIds)
    : { data: [], error: null };

  // LOG ERRORS IF ASSET LOOKUP FAILS
  if (recentAssetsError) {
    console.error(
      "Dashboard recent asset lookup failed:",
      recentAssetsError.message,
    );
  }

  // CREATE ASSET LOOKUP MAP
  const assetById = new Map(
    (recentAssets ?? []).map((asset) => [
      asset.asset_id,
      asset,
    ]),
  );

  // CATEGORY COUNTS
  const categoryCounts = await Promise.all(
    (categories ?? []).map(async (category) => {
      const { count } = await supabase
        .from("assets")
        .select("*", { count: "exact", head: true })
        .eq("category_id", category.category_id);

      return {
        ...category,
        count: count ?? 0,
      };
    }),
  );

  // TRANSACTION STATUS BADGES
  const statusVariant: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    issued: "default",
    returned: "secondary",
    transferred: "outline",
  };

  return (
    <div className="space-y-6">

      {/* DASHBOARD HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Dashboard
        </h1>

        <p className="text-sm text-muted-foreground">
          Overview of property assets and lifecycle status
        </p>
      </div>

      {/* STATISTICS CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard
          label="Total Assets"
          value={totalAssets ?? 0}
          icon={Boxes}
        />

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

      {/* RECENT TRANSACTIONS AND ALERTS */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* RECENT TRANSACTIONS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Recent Transactions
            </CardTitle>

            <Link
              href="/dashboard/movements"
              className="text-xs text-muted-foreground hover:underline"
            >
              View all
            </Link>
          </CardHeader>

          <CardContent className="space-y-3">
            {recentAssignments && recentAssignments.length > 0 ? (
              recentAssignments.map((row) => {

                // FIND ASSET USING ITS FOREIGN KEY ID
                const asset =
                  row.asset_id != null
                    ? assetById.get(row.asset_id)
                    : undefined;

                return (
                  <div
                    key={row.assignment_id}
                    className="flex items-center justify-between border-b border-border/60 pb-3 text-sm last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">
                        {asset?.asset_name ??
                          (row.asset_id != null
                            ? `Asset #${row.asset_id}`
                            : "Unknown asset")}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        {asset?.asset_code ?? "—"} &middot;{" "}
                        {row.accountable_officers
                          ? `${row.accountable_officers.first_name} ${row.accountable_officers.last_name}`
                          : "Unassigned"}
                      </p>
                    </div>

                    <div className="text-right">
                      <Badge
                        variant={
                          statusVariant[row.status] ?? "outline"
                        }
                      >
                        {row.status}
                      </Badge>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(row.assigned_date)}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No transactions recorded yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* EXPIRY / WARRANTY ALERTS */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              Expiry / Warranty Alerts
            </CardTitle>

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

      {/* ASSET CATEGORIES SUMMARY */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Asset Categories Summary
          </CardTitle>
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
