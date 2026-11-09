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
    .from("assets")
    .select("*, categories(category_name), offices:assigned_office_id(office_name)")
    .order("asset_code");

  if (categoryId) {
    query = query.eq("category_id", Number(categoryId));
  }

  const { data: assets } = await query;

  const headers = [
    "Property No.",
    "Description",
    "Category",
    "Department",
    "Brand",
    "Model",
    "Serial No.",
    "Acquisition Date",
    "Acquisition Cost",
    "Useful Life (yrs)",
    "Expiry Date",
    "Warranty Expiry",
    "Status",
    "Remarks",
  ];

  const rows = (assets ?? []).map((a) => [
    a.asset_code,
    a.asset_name,
    a.categories?.category_name ?? "",
    a.offices?.office_name ?? "",
    a.brand ?? "",
    a.model ?? "",
    a.serial_number ?? "",
    a.acquisition_date,
    a.acquisition_cost,
    a.useful_life_years,
    a.expiration_date ?? "",
    a.warranty_expiry ?? "",
    a.status,
    a.remarks ?? "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gso-pms-assets-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
