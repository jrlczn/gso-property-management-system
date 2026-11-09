import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export default async function MovementReportPage({
  searchParams,
}: {
  searchParams: Promise<{ category_id?: string }>;
}) {
  const { category_id: categoryId } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("asset_assignments")
    .select(
      "*, assets!inner(asset_code, asset_name, category_id), accountable_officers(first_name, last_name), offices(office_name)",
    )
    .order("assigned_date", { ascending: false });

  if (categoryId) {
    query = query.eq("assets.category_id", Number(categoryId));
  }

  const { data: movements } = await query;

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
          Movement Report
        </h1>
        <p className="text-sm text-muted-foreground">As of {today}</p>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-foreground">
            <th className="p-2 text-left">Property No.</th>
            <th className="p-2 text-left">Description</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Department</th>
            <th className="p-2 text-left">Accountable Officer</th>
            <th className="p-2 text-left">Assigned Date</th>
            <th className="p-2 text-left">Returned Date</th>
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
              <td className="p-2">{formatDate(row.returned_date)}</td>
            </tr>
          ))}
          {(!movements || movements.length === 0) && (
            <tr>
              <td colSpan={7} className="p-6 text-center text-muted-foreground">
                No movement records to report.
              </td>
            </tr>
          )}
        </tbody>
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
