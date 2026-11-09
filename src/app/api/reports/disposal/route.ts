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
    .from("disposal")
    .select("*, assets!inner(asset_code, asset_name, category_id)")
    .order("disposal_date", { ascending: false });

  if (categoryId) {
    query = query.eq("assets.category_id", Number(categoryId));
  }

  const { data: disposals } = await query;

  const headers = [
    "Property No.",
    "Description",
    "Disposal Date",
    "Method",
    "Appraisal Value",
    "Status",
    "Previous Status",
    "Approved By",
    "Remarks",
  ];

  const rows = (disposals ?? []).map((row) => [
    row.assets?.asset_code ?? "",
    row.assets?.asset_name ?? "",
    row.disposal_date,
    row.disposal_method,
    row.appraisal_value,
    row.status,
    row.previous_status ?? "",
    row.approved_by ?? "",
    row.remarks ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gso-pms-disposal-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
