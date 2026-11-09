import Link from "next/link";
import { Download, FileStack, Printer } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { ReportCategoryFilter } from "@/components/report-category-filter";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/format";

const PREVIEW_LIMIT = 10;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ category_id?: string }>;
}) {
  const { category_id: categoryId } = await searchParams;
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("category_name");

  let assetsCountQuery = supabase
    .from("assets")
    .select("*", { count: "exact", head: true });
  let assetsValueQuery = supabase.from("assets").select("acquisition_cost, status");
  let movementsQuery = supabase
    .from("asset_assignments")
    .select(
      "*, assets!inner(asset_code, asset_name, category_id), accountable_officers(first_name, last_name), offices(office_name)",
      { count: "exact" },
    )
    .order("assigned_date", { ascending: false })
    .limit(PREVIEW_LIMIT);
  let disposalQuery = supabase
    .from("disposal")
    .select("*, assets!inner(asset_code, asset_name, category_id)", {
      count: "exact",
    })
    .order("disposal_date", { ascending: false })
    .limit(PREVIEW_LIMIT);

  if (categoryId) {
    const categoryNum = Number(categoryId);
    assetsCountQuery = assetsCountQuery.eq("category_id", categoryNum);
    assetsValueQuery = assetsValueQuery.eq("category_id", categoryNum);
    movementsQuery = movementsQuery.eq("assets.category_id", categoryNum);
    disposalQuery = disposalQuery.eq("assets.category_id", categoryNum);
  }

  const [
    { count: totalAssets },
    { data: assets },
    { data: movements, count: movementsCount },
    { data: disposals, count: disposalsCount },
  ] = await Promise.all([
    assetsCountQuery,
    assetsValueQuery,
    movementsQuery,
    disposalQuery,
  ]);

  const totalValue = (assets ?? []).reduce((sum, a) => sum + a.acquisition_cost, 0);
  const activeValue = (assets ?? [])
    .filter((a) => a.status !== "disposed")
    .reduce((sum, a) => sum + a.acquisition_cost, 0);

  const exportQuery = categoryId ? `?category_id=${categoryId}` : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Export and print property inventory reports
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Filter by Category</p>
            <p className="text-sm text-muted-foreground">
              Applies to the asset, movement, and disposal reports below.
            </p>
          </div>
          <ReportCategoryFilter categories={categories ?? []} />
        </CardContent>
      </Card>

      <Card className="border-primary/30 bg-primary/[0.03]">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <FileStack className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Comprehensive Report</p>
              <p className="text-sm text-muted-foreground">
                One printable document covering asset registry, movement, and
                disposal — for leadership review or a full operations
                snapshot.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href={`/dashboard/reports/comprehensive${exportQuery}`}>
              <Printer className="h-4 w-4" /> Open Comprehensive Report
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold tabular-nums">
            {totalAssets ?? 0}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Acquisition Value
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold tabular-nums">
            {formatCurrency(totalValue)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Property Value
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold tabular-nums">
            {formatCurrency(activeValue)}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asset Registry (CSV)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Export the full property asset registry as a spreadsheet-ready
              CSV file, including category, department, cost, and lifecycle
              dates.
            </p>
            <Button asChild>
              <a href={`/api/reports/assets${exportQuery}`} download>
                <Download className="h-4 w-4" /> Export CSV
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Report on the Physical Count of Property, Plant and Equipment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Generate a printable RPCPPE document for physical inventory
              verification and COA reporting.
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/reports/rpcppe">
                <Printer className="h-4 w-4" /> Open Printable Report
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Movement Report</CardTitle>
            <p className="text-sm text-muted-foreground">
              Asset transfers, issuances, and returns
              {typeof movementsCount === "number" ? ` (${movementsCount} total)` : ""}.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/reports/movement${exportQuery}`}>
                <Printer className="h-4 w-4" /> Printable Report
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/api/reports/movements${exportQuery}`} download>
                <Download className="h-4 w-4" /> Export CSV
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Officer</TableHead>
                  <TableHead>Assigned Date</TableHead>
                  <TableHead>Returned Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements && movements.length > 0 ? (
                  movements.map((row) => (
                    <TableRow key={row.assignment_id}>
                      <TableCell>
                        <div className="font-medium">
                          {row.assets?.asset_name ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.assets?.asset_code}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      <TableCell>{row.offices?.office_name ?? "—"}</TableCell>
                      <TableCell>
                        {row.accountable_officers
                          ? `${row.accountable_officers.first_name} ${row.accountable_officers.last_name}`
                          : "—"}
                      </TableCell>
                      <TableCell>{formatDate(row.assigned_date)}</TableCell>
                      <TableCell>{formatDate(row.returned_date)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No movement records found for this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {typeof movementsCount === "number" && movementsCount > PREVIEW_LIMIT && (
            <p className="pt-3 text-xs text-muted-foreground">
              Showing the latest {PREVIEW_LIMIT} of {movementsCount} records.
              Export CSV for the full report.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Disposal Report</CardTitle>
            <p className="text-sm text-muted-foreground">
              Condemned and disposed government assets
              {typeof disposalsCount === "number" ? ` (${disposalsCount} total)` : ""}.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/reports/disposal${exportQuery}`}>
                <Printer className="h-4 w-4" /> Printable Report
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/api/reports/disposal${exportQuery}`} download>
                <Download className="h-4 w-4" /> Export CSV
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Appraisal Value</TableHead>
                  <TableHead>Disposal Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disposals && disposals.length > 0 ? (
                  disposals.map((row) => (
                    <TableRow key={row.disposal_id}>
                      <TableCell>
                        <div className="font-medium">
                          {row.assets?.asset_name ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.assets?.asset_code}
                        </div>
                      </TableCell>
                      <TableCell>{row.disposal_method}</TableCell>
                      <TableCell>{formatCurrency(row.appraisal_value)}</TableCell>
                      <TableCell>{formatDate(row.disposal_date)}</TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No disposal records found for this filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {typeof disposalsCount === "number" && disposalsCount > PREVIEW_LIMIT && (
            <p className="pt-3 text-xs text-muted-foreground">
              Showing the latest {PREVIEW_LIMIT} of {disposalsCount} records.
              Export CSV for the full report.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
