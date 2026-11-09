import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function csvEscape(value: string | number | null): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("category_id");

  let query = supabase
    .from("asset_assignments")
    .select(
      "*, assets!inner(asset_code, asset_name, category_id), accountable_officers(first_name, last_name), offices(office_name)",
    )
    .order("assigned_date", { ascending: false });

  if (categoryId) {
    query = query.eq("assets.category_id", Number(categoryId));
  }

  const { data: assignments } = await query;

  const headers = [
    "Property No.",
    "Description",
    "Status",
    "Department",
    "Officer",
    "Assigned Date",
    "Returned Date",
    "Remarks",
  ];

  const rows = (assignments ?? []).map((row) => [
    row.assets?.asset_code ?? "",
    row.assets?.asset_name ?? "",
    row.status,
    row.offices?.office_name ?? "",
    row.accountable_officers
      ? `${row.accountable_officers.first_name} ${row.accountable_officers.last_name}`
      : "",
    row.assigned_date,
    row.returned_date ?? "",
    row.remarks ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gso-pms-movements-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
