import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/format";

export default async function RpcppePage() {
  const supabase = await createClient();

  const { data: assets } = await supabase
    .from("assets")
    .select(
      "*, categories(category_name), offices:assigned_office_id(office_name)",
    )
    .neq("status", "disposed")
    .order("asset_code");

  const totalCost = (assets ?? []).reduce((sum, a) => sum + a.acquisition_cost, 0);
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
          Report on the Physical Count of Property, Plant and Equipment
        </h1>
        <p className="text-sm text-muted-foreground">As of {today}</p>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-foreground">
            <th className="p-2 text-left">Property No.</th>
            <th className="p-2 text-left">Description</th>
            <th className="p-2 text-left">Category</th>
            <th className="p-2 text-left">Acquisition Date</th>
            <th className="p-2 text-right">Acquisition Cost</th>
            <th className="p-2 text-left">Office</th>
            <th className="p-2 text-left">Condition</th>
          </tr>
        </thead>
        <tbody>
          {(assets ?? []).map((asset) => (
            <tr key={asset.asset_id} className="border-b border-border">
              <td className="p-2">{asset.asset_code}</td>
              <td className="p-2">{asset.asset_name}</td>
              <td className="p-2">{asset.categories?.category_name ?? "—"}</td>
              <td className="p-2">{formatDate(asset.acquisition_date)}</td>
              <td className="p-2 text-right">
                {formatCurrency(asset.acquisition_cost)}
              </td>
              <td className="p-2">{asset.offices?.office_name ?? "—"}</td>
              <td className="p-2 capitalize">{asset.status}</td>
            </tr>
          ))}
          {(!assets || assets.length === 0) && (
            <tr>
              <td colSpan={7} className="p-6 text-center text-muted-foreground">
                No active assets to report.
              </td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-foreground font-medium">
            <td colSpan={4} className="p-2 text-right">
              Total
            </td>
            <td className="p-2 text-right">{formatCurrency(totalCost)}</td>
            <td colSpan={2} />
          </tr>
        </tfoot>
      </table>

      <div className="grid grid-cols-2 gap-8 pt-16 text-sm">
        <div>
          <p className="border-t border-foreground pt-1 text-center">
            Certified Correct: GSO Property Officer
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
