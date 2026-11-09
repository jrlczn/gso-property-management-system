import Link from "next/link";
import { FileText, QrCode } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { MovementFormDialog } from "@/components/movement-form-dialog";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

export default async function MovementsPage() {
  const supabase = await createClient();

  const [
    { data: assignments },
    { data: assets },
    { data: officers },
    { data: offices },
    { data: parRecords },
    { data: icsRecords },
  ] = await Promise.all([
    supabase
      .from("asset_assignments")
      .select(
        "*, assets(asset_code, asset_name), accountable_officers(first_name, last_name), offices(office_name)",
      )
      .order("assigned_date", { ascending: false }),
    supabase
      .from("assets")
      .select("*")
      .neq("status", "disposed")
      .order("asset_name"),
    supabase.from("accountable_officers").select("*").eq("status", "active"),
    supabase.from("offices").select("*").order("office_name"),
    supabase.from("par_records").select("par_id, par_no, assignment_id"),
    supabase.from("ics_records").select("ics_id, ics_no, assignment_id"),
  ]);

  const docByAssignment = new Map<number, { docNo: string; href: string }>();
  parRecords?.forEach((r) => {
    if (r.assignment_id) {
      docByAssignment.set(r.assignment_id, {
        docNo: r.par_no,
        href: `/dashboard/records/par/${r.par_id}`,
      });
    }
  });
  icsRecords?.forEach((r) => {
    if (r.assignment_id) {
      docByAssignment.set(r.assignment_id, {
        docNo: r.ics_no,
        href: `/dashboard/records/ics/${r.ics_id}`,
      });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Movement & Issuance
          </h1>
          <p className="text-sm text-muted-foreground">
            Track asset transfers, issuances, and returns
          </p>
        </div>
        <MovementFormDialog
          assets={assets ?? []}
          officers={officers ?? []}
          offices={offices ?? []}
        />
      </div>

      <Card>
        <CardContent>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doc No.</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Officer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments && assignments.length > 0 ? (
                  assignments.map((row) => {
                    const doc = docByAssignment.get(row.assignment_id);
                    return (
                      <TableRow key={row.assignment_id}>
                        <TableCell className="font-medium">
                          {doc ? (
                            <Link
                              href={doc.href}
                              className="inline-flex items-center gap-1 hover:underline"
                            >
                              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                              {doc.docNo}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {row.assets?.asset_name ?? "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.assets?.asset_code}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={row.status} />
                        </TableCell>
                        <TableCell>{row.offices?.office_name ?? "—"}</TableCell>
                        <TableCell>
                          {row.accountable_officers
                            ? `${row.accountable_officers.first_name} ${row.accountable_officers.last_name}`
                            : "—"}
                        </TableCell>
                        <TableCell>{formatDate(row.assigned_date)}</TableCell>
                        <TableCell className="max-w-48 truncate text-muted-foreground">
                          {row.remarks ?? "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          {row.status !== "returned" && (
                            <Button asChild variant="ghost" size="sm" title="Print sticker now that custody is known">
                              <Link href={`/dashboard/assets/${row.asset_id}/sticker`}>
                                <QrCode className="h-4 w-4" /> Sticker
                              </Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No transactions recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {assignments && assignments.length > 0 ? (
              assignments.map((row) => {
                const doc = docByAssignment.get(row.assignment_id);
                return (
                  <div
                    key={row.assignment_id}
                    className="rounded-lg border border-border/60 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium">
                          {row.assets?.asset_name ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.assets?.asset_code}
                        </div>
                      </div>
                      <StatusBadge status={row.status} />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Doc No.</p>
                        <p className="font-medium">
                          {doc ? (
                            <Link
                              href={doc.href}
                              className="inline-flex items-center gap-1 hover:underline"
                            >
                              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                              {doc.docNo}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Department</p>
                        <p className="font-medium">
                          {row.offices?.office_name ?? "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Officer</p>
                        <p className="font-medium">
                          {row.accountable_officers
                            ? `${row.accountable_officers.first_name} ${row.accountable_officers.last_name}`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">{formatDate(row.assigned_date)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Remarks</p>
                        <p className="font-medium">{row.remarks ?? "—"}</p>
                      </div>
                    </div>
                    {row.status !== "returned" && (
                      <div className="mt-3 flex justify-end border-t border-border/60 pt-2">
                        <Button asChild variant="ghost" size="sm" title="Print sticker now that custody is known">
                          <Link href={`/dashboard/assets/${row.asset_id}/sticker`}>
                            <QrCode className="h-4 w-4" /> Sticker
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No transactions recorded yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
