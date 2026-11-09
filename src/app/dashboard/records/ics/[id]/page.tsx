import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/format";

export default async function IcsPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: record } = await supabase
    .from("ics_records")
    .select(
      "*, assets(*, categories(category_name), offices:assigned_office_id(office_name)), accountable_officers(first_name, last_name, position, offices(office_name)), profiles:issued_by(full_name)",
    )
    .eq("ics_id", Number(id))
    .single();

  if (!record) notFound();

  const asset = record.assets;
  const officer = record.accountable_officers;
  const issuedBy = record.profiles?.full_name;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard/records">
            <ArrowLeft className="h-4 w-4" /> Back to Records
          </Link>
        </Button>
        <PrintButton />
      </div>

      <div className="space-y-1 text-center">
        <p className="text-sm">Municipality of Villanueva, Misamis Oriental</p>
        <p className="text-sm font-medium">General Services Office</p>
        <h1 className="pt-2 text-lg font-bold uppercase tracking-wide">
          Inventory Custodian Slip
        </h1>
      </div>

      <div className="flex justify-between text-sm">
        <div>
          <span className="font-medium">Entity Name:</span> LGU Villanueva
        </div>
        <div>
          <span className="font-medium">ICS No.:</span> {record.ics_no}
        </div>
      </div>
      <div className="flex justify-between text-sm">
        <div>
          <span className="font-medium">Fund Cluster:</span> General Fund
        </div>
        <div>
          <span className="font-medium">Date:</span> {formatDate(record.issue_date)}
        </div>
      </div>

      <table className="w-full border-collapse border border-foreground text-sm">
        <thead>
          <tr className="border-b border-foreground">
            <th className="border-r border-foreground p-2 text-left">Quantity</th>
            <th className="border-r border-foreground p-2 text-left">Unit</th>
            <th className="border-r border-foreground p-2 text-left">
              Description / Property No.
            </th>
            <th className="border-r border-foreground p-2 text-left">Unit Cost</th>
            <th className="p-2 text-right">Total Cost</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border-r border-foreground p-2">1</td>
            <td className="border-r border-foreground p-2">unit</td>
            <td className="border-r border-foreground p-2">
              <p className="font-medium">{asset?.asset_name}</p>
              <p className="text-xs text-muted-foreground">
                {asset?.asset_code} &middot; {asset?.categories?.category_name}
                {asset?.brand ? ` · ${asset.brand}` : ""}
                {asset?.model ? ` ${asset.model}` : ""}
              </p>
            </td>
            <td className="border-r border-foreground p-2">
              {formatCurrency(asset?.acquisition_cost ?? null)}
            </td>
            <td className="p-2 text-right">
              {formatCurrency(asset?.acquisition_cost ?? null)}
            </td>
          </tr>
        </tbody>
      </table>

      {record.remarks && (
        <p className="text-sm">
          <span className="font-medium">Remarks:</span> {record.remarks}
        </p>
      )}

      <div className="grid grid-cols-2 gap-8 pt-16 text-sm">
        <div className="space-y-8">
          <div>
            <p className="border-t border-foreground pt-1 text-center">
              Issued by: {issuedBy ?? "GSO Property Officer"}
            </p>
          </div>
        </div>
        <div className="space-y-1">
          <p className="border-t border-foreground pt-1 text-center font-medium">
            {officer ? `${officer.first_name} ${officer.last_name}` : "—"}
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Custodian {officer?.position ? `— ${officer.position}` : ""}
            {officer?.offices ? `, ${officer.offices.office_name}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
