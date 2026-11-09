import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { generateQrDataUrl } from "@/lib/qrcode";
import { formatDate, formatCurrency } from "@/lib/format";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const assetId = Number(id);
  const supabase = await createClient();

  const { data: asset } = await supabase
    .from("assets")
    .select("*, categories(category_name), offices:assigned_office_id(office_name)")
    .eq("asset_id", assetId)
    .single();

  if (!asset) notFound();

  const [{ data: assignments }, { data: maintenance }, qrDataUrl] =
    await Promise.all([
      supabase
        .from("asset_assignments")
        .select(
          "*, accountable_officers(first_name, last_name), offices(office_name)",
        )
        .eq("asset_id", assetId)
        .order("assigned_date", { ascending: false }),
      supabase
        .from("maintenance")
        .select("*")
        .eq("asset_id", assetId)
        .order("date_reported", { ascending: false }),
      generateQrDataUrl(asset.asset_code),
    ]);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/dashboard/assets">
          <ArrowLeft className="h-4 w-4" /> Back to Registry
        </Link>
      </Button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-xl">{asset.asset_name}</CardTitle>
              <p className="text-sm text-muted-foreground">{asset.asset_code}</p>
            </div>
            <StatusBadge status={asset.status} />
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Category</p>
              <p className="font-medium">{asset.categories?.category_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Department</p>
              <p className="font-medium">{asset.offices?.office_name ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Brand / Model</p>
              <p className="font-medium">
                {[asset.brand, asset.model].filter(Boolean).join(" / ") || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Serial No.</p>
              <p className="font-medium">{asset.serial_number ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Acquisition Date
              </p>
              <p className="font-medium">{formatDate(asset.acquisition_date)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Acquisition Cost
              </p>
              <p className="font-medium">{formatCurrency(asset.acquisition_cost)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Useful Life</p>
              <p className="font-medium">{asset.useful_life_years} years</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Expiry Date</p>
              <p className="font-medium">{formatDate(asset.expiration_date)}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">
                Warranty Expiry
              </p>
              <p className="font-medium">{formatDate(asset.warranty_expiry)}</p>
            </div>
            {asset.description && (
              <div className="col-span-full">
                <p className="text-xs uppercase text-muted-foreground">
                  Description
                </p>
                <p className="font-medium">{asset.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">QR Asset Tag</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <div className="rounded-lg border border-border p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt={`QR code for ${asset.asset_code}`} width={200} height={200} />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Encodes property code <strong>{asset.asset_code}</strong>. Print
              a sticker sheet and affix one to the physical asset before
              issuing it, then use Scan to Verify during physical count.
            </p>
            <Button asChild className="w-full">
              <Link href={`/dashboard/assets/${asset.asset_id}/sticker`}>
                <Printer className="h-4 w-4" /> Print Sticker Sheet
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movement History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Officer</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments && assignments.length > 0 ? (
                assignments.map((a) => (
                  <TableRow key={a.assignment_id}>
                    <TableCell>
                      <StatusBadge status={a.status} />
                    </TableCell>
                    <TableCell>
                      {a.accountable_officers
                        ? `${a.accountable_officers.first_name} ${a.accountable_officers.last_name}`
                        : "—"}
                    </TableCell>
                    <TableCell>{a.offices?.office_name ?? "—"}</TableCell>
                    <TableCell>{formatDate(a.assigned_date)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    No movement history yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Maintenance History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Service Provider</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenance && maintenance.length > 0 ? (
                maintenance.map((m) => (
                  <TableRow key={m.maintenance_id}>
                    <TableCell>{m.maintenance_type}</TableCell>
                    <TableCell>{formatDate(m.date_reported)}</TableCell>
                    <TableCell>{m.service_provider ?? "—"}</TableCell>
                    <TableCell>{formatCurrency(m.cost)}</TableCell>
                    <TableCell>
                      <StatusBadge status={m.status} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                    No maintenance records yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
