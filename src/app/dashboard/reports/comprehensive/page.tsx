import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/format";

export default async function ComprehensiveReportPage({
  searchParams,
}: {
  searchParams: Promise<{ category_id?: string }>;
}) {
  const { category_id: categoryId } = await searchParams;
  const supabase = await createClient();
  const categoryNum = categoryId ? Number(categoryId) : undefined;

  let assetsQuery = supabase
    .from("assets")
    .select(
      "*, categories(category_name), offices:assigned_office_id(office_name)",
    )
    .order("asset_code");
  let movementsQuery = supabase
    .from("asset_assignments")
    .select(
      "*, assets!inner(asset_code, asset_name, category_id), accountable_officers(first_name, last_name), offices(office_name)",
    )
    .order("assigned_date", { ascending: false });
  let disposalQuery = supabase
    .from("disposal")
    .select("*, assets!inner(asset_code, asset_name, category_id)")
    .order("disposal_date", { ascending: false });

  if (categoryNum) {
    assetsQuery = assetsQuery.eq("category_id", categoryNum);
    movementsQuery = movementsQuery.eq("assets.category_id", categoryNum);
    disposalQuery = disposalQuery.eq("assets.category_id", categoryNum);
  }

  const [{ data: assets }, { data: movements }, { data: disposals }] =
    await Promise.all([assetsQuery, movementsQuery, disposalQuery]);

  const activeAssets = (assets ?? []).filter((a) => a.status !== "disposed");
  const totalCost = activeAssets.reduce((sum, a) => sum + a.acquisition_cost, 0);
  const totalAppraisal = (disposals ?? []).reduce(
    (sum, d) => sum + (d.appraisal_value ?? 0),
    0,
  );
  const today = new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between print:hidden">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard/reports">
            <ArrowLeft className="h-4 w-4" /> Back to Reports
          </Link>
        </Button>
        <PrintButton />
      </div>

      <div className="space-y-1 text-center">
        <p className="text-sm">Municipality of Villanueva, Misamis Oriental</p>
        <p className="text-sm font-medium">General Services Office</p>
        <h1 className="pt-2 text-lg font-bold uppercase tracking-wide">
          Comprehensive Property Report
        </h1>
        <p className="text-sm text-muted-foreground">
          Asset Registry, Movement, and Disposal — As of {today}
        </p>
      </div>

      {/* Section 1: Asset Registry */}
      <section className="break-after-page space-y-3">
        <h2 className="text-base font-bold uppercase tracking-wide">
          I. Asset Registry ({activeAssets.length} active)
        </h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-foreground">
              <th className="p-2 text-left">Property No.</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-right">Acquisition Cost</th>
              <th className="p-2 text-left">Office</th>
              <th className="p-2 text-left">Condition</th>
            </tr>
          </thead>
          <tbody>
            {activeAssets.map((asset) => (
              <tr key={asset.asset_id} className="border-b border-border">
                <td className="p-2">{asset.asset_code}</td>
                <td className="p-2">{asset.asset_name}</td>
                <td className="p-2">{asset.categories?.category_name ?? "—"}</td>
                <td className="p-2 text-right">
                  {formatCurrency(asset.acquisition_cost)}
                </td>
                <td className="p-2">{asset.offices?.office_name ?? "—"}</td>
                <td className="p-2 capitalize">{asset.status}</td>
              </tr>
            ))}
            {activeAssets.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No active assets to report.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-foreground font-medium">
              <td colSpan={3} className="p-2 text-right">
                Total
              </td>
              <td className="p-2 text-right">{formatCurrency(totalCost)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </section>

      {/* Section 2: Movement Report */}
      <section className="break-after-page space-y-3">
        <h2 className="text-base font-bold uppercase tracking-wide">
          II. Movement Report ({(movements ?? []).length} record
          {(movements ?? []).length === 1 ? "" : "s"})
        </h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-foreground">
              <th className="p-2 text-left">Property No.</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Department</th>
              <th className="p-2 text-left">Accountable Officer</th>
              <th className="p-2 text-left">Assigned Date</th>
            </tr>
          </thead>
          <tbody>
            {(movements ?? []).map((row) => (
              <tr key={row.assignment_id} className="border-b border-border">
                <td className="p-2">{row.assets?.asset_code}</td>
                <td className="p-2">{row.assets?.asset_name}</td>
                <td className="p-2 capitalize">{row.status}</td>
                <td className="p-2">{row.offices?.office_name ?? "—"}</td>
                <td className="p-2">
                  {row.accountable_officers
                    ? `${row.accountable_officers.first_name} ${row.accountable_officers.last_name}`
                    : "—"}
                </td>
                <td className="p-2">{formatDate(row.assigned_date)}</td>
              </tr>
            ))}
            {(!movements || movements.length === 0) && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No movement records to report.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Section 3: Disposal Report */}
      <section className="space-y-3">
        <h2 className="text-base font-bold uppercase tracking-wide">
          III. Disposal &amp; Write-off Report ({(disposals ?? []).length} record
          {(disposals ?? []).length === 1 ? "" : "s"})
        </h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-foreground">
              <th className="p-2 text-left">Property No.</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-left">Method</th>
              <th className="p-2 text-right">Appraisal Value</th>
              <th className="p-2 text-left">Disposal Date</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {(disposals ?? []).map((row) => (
              <tr key={row.disposal_id} className="border-b border-border">
                <td className="p-2">{row.assets?.asset_code}</td>
                <td className="p-2">{row.assets?.asset_name}</td>
                <td className="p-2">{row.disposal_method}</td>
                <td className="p-2 text-right">
                  {formatCurrency(row.appraisal_value)}
                </td>
                <td className="p-2">{formatDate(row.disposal_date)}</td>
                <td className="p-2 capitalize">{row.status}</td>
              </tr>
            ))}
            {(!disposals || disposals.length === 0) && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  No disposal records to report.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-foreground font-medium">
              <td colSpan={3} className="p-2 text-right">
                Total
              </td>
              <td className="p-2 text-right">{formatCurrency(totalAppraisal)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </section>

      <div className="grid grid-cols-3 gap-8 pt-16 text-sm">
        <div>
          <p className="border-t border-foreground pt-1 text-center">
            Prepared By: GSO Property Officer
          </p>
        </div>
        <div>
          <p className="border-t border-foreground pt-1 text-center">
            Reviewed By: GSO Administrator
          </p>
        </div>
        <div>
          <p className="border-t border-foreground pt-1 text-center">
            Approved By: Municipal Mayor
          </p>
        </div>
      </div>
    </div>
  );
}
