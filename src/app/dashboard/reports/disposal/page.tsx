import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/format";

export default async function DisposalReportPage({
  searchParams,
}: {
  searchParams: Promise<{ category_id?: string }>;
}) {
  const { category_id: categoryId } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("disposal")
    .select("*, assets!inner(asset_code, asset_name, category_id)")
    .order("disposal_date", { ascending: false });

  if (categoryId) {
    query = query.eq("assets.category_id", Number(categoryId));
  }

  const { data: disposals } = await query;

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
    <div className="mx-auto max-w-5xl space-y-4">
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
          Disposal &amp; Write-off Report
        </h1>
        <p className="text-sm text-muted-foreground">As of {today}</p>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-foreground">
            <th className="p-2 text-left">Property No.</th>
            <th className="p-2 text-left">Description</th>
            <th className="p-2 text-left">Method</th>
            <th className="p-2 text-right">Appraisal Value</th>
            <th className="p-2 text-left">Disposal Date</th>
            <th className="p-2 text-left">Inspection Date</th>
            <th className="p-2 text-left">Approved By</th>
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
              <td className="p-2">{formatDate(row.inspection_date)}</td>
              <td className="p-2">{row.approved_by ?? "—"}</td>
              <td className="p-2 capitalize">{row.status}</td>
            </tr>
          ))}
          {(!disposals || disposals.length === 0) && (
            <tr>
              <td colSpan={8} className="p-6 text-center text-muted-foreground">
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
            <td colSpan={4} />
          </tr>
        </tfoot>
      </table>

      <div className="grid grid-cols-3 gap-8 pt-16 text-sm">
        <div>
          <p className="border-t border-foreground pt-1 text-center">
            Requested By: GSO Property Officer
          </p>
        </div>
        <div>
          <p className="border-t border-foreground pt-1 text-center">
            Inspected By: Inspection Committee
          </p>
        </div>
        <div>
          <p className="border-t border-foreground pt-1 text-center">
            Approved: GSO Administrator
          </p>
        </div>
      </div>
    </div>
  );
}
