import Link from "next/link";
import { Printer, QrCode } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export default async function RecordsPage() {
  const supabase = await createClient();

  const [{ data: parRecords }, { data: icsRecords }] = await Promise.all([
    supabase
      .from("par_records")
      .select(
        "*, assets(asset_id, asset_code, asset_name), accountable_officers(first_name, last_name)",
      ),
    supabase
      .from("ics_records")
      .select(
        "*, assets(asset_id, asset_code, asset_name), accountable_officers(first_name, last_name)",
      ),
  ]);

  const combined = [
    ...(parRecords ?? []).map((r) => ({
      id: `par-${r.par_id}`,
      printHref: `/dashboard/records/par/${r.par_id}`,
      docNo: r.par_no,
      docType: "PAR" as const,
      asset: r.assets,
      officer: r.accountable_officers,
      issueDate: r.issue_date,
      remarks: r.remarks,
    })),
    ...(icsRecords ?? []).map((r) => ({
      id: `ics-${r.ics_id}`,
      printHref: `/dashboard/records/ics/${r.ics_id}`,
      docNo: r.ics_no,
      docType: "ICS" as const,
      asset: r.assets,
      officer: r.accountable_officers,
      issueDate: r.issue_date,
      remarks: r.remarks,
    })),
  ].sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">PAR / ICS Records</h1>
        <p className="text-sm text-muted-foreground">
          Property Acknowledgement Receipts and Inventory Custodian Slips issued
          for government assets
        </p>
      </div>

      <Card>
        <CardContent>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doc No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Custodian</TableHead>
                  <TableHead>Issue Date</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {combined.length > 0 ? (
                  combined.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.docNo}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.docType}</Badge>
                      </TableCell>
                      <TableCell>
                        <div>{doc.asset?.asset_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">
                          {doc.asset?.asset_code}
                        </div>
                      </TableCell>
                      <TableCell>
                        {doc.officer
                          ? `${doc.officer.first_name} ${doc.officer.last_name}`
                          : "—"}
                      </TableCell>
                      <TableCell>{formatDate(doc.issueDate)}</TableCell>
                      <TableCell className="max-w-64 truncate text-muted-foreground">
                        {doc.remarks ?? "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {doc.asset?.asset_id && (
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/dashboard/assets/${doc.asset.asset_id}/sticker`}>
                                <QrCode className="h-4 w-4" /> Sticker
                              </Link>
                            </Button>
                          )}
                          <Button asChild variant="ghost" size="sm">
                            <Link href={doc.printHref}>
                              <Printer className="h-4 w-4" /> Print
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No PAR or ICS documents generated yet. These are created
                      automatically from Movement & Issuance.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {combined.length > 0 ? (
              combined.map((doc) => (
                <div
                  key={doc.id}
                  className="rounded-lg border border-border/60 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">{doc.docNo}</p>
                      <p className="truncate text-sm text-muted-foreground">
                        {doc.asset?.asset_name ?? "—"}
                      </p>
                    </div>
                    <Badge variant="outline">{doc.docType}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Asset Code</p>
                      <p className="font-medium">{doc.asset?.asset_code ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Issue Date</p>
                      <p className="font-medium">{formatDate(doc.issueDate)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Custodian</p>
                      <p className="font-medium">
                        {doc.officer
                          ? `${doc.officer.first_name} ${doc.officer.last_name}`
                          : "—"}
                      </p>
                    </div>
                    {doc.remarks && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Remarks</p>
                        <p className="font-medium">{doc.remarks}</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 flex justify-end gap-1 border-t border-border/60 pt-2">
                    {doc.asset?.asset_id && (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/assets/${doc.asset.asset_id}/sticker`}>
                          <QrCode className="h-4 w-4" /> Sticker
                        </Link>
                      </Button>
                    )}
                    <Button asChild variant="ghost" size="sm">
                      <Link href={doc.printHref}>
                        <Printer className="h-4 w-4" /> Print
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No PAR or ICS documents generated yet. These are created
                automatically from Movement & Issuance.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
