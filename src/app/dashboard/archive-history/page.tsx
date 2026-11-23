
import Link from "next/link";
import { Archive, FileText } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { RestoreButton } from "@/components/restore-button";

import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/supabase/auth";
import { formatDate } from "@/lib/format";

import {
  restoreMovement,
} from "@/app/dashboard/movements/actions";

export default async function ArchiveHistoryPage() {
  // ADMIN-ONLY ACCESS
  await requireAdmin();

  const supabase = await createClient();

  const [
    { data: assignments, error: assignmentsError },
    { data: parRecords },
    { data: icsRecords },
  ] = await Promise.all([
    supabase
      .from("asset_assignments")
      .select(
        "*, assets(asset_code, asset_name), accountable_officers(first_name, last_name), offices(office_name)",
      )
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false }),

    supabase
      .from("par_records")
      .select("par_id, par_no, assignment_id"),

    supabase
      .from("ics_records")
      .select("ics_id, ics_no, assignment_id"),
  ]);

  if (assignmentsError) {
    return (
      <div className="p-6 text-sm text-destructive">
        Failed to load archived transactions:{" "}
        {assignmentsError.message}
      </div>
    );
  }

  // MAP DOCUMENT NUMBERS
  const docByAssignment = new Map<
    number,
    { docNo: string; href: string }
  >();

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

      {/* PAGE HEADER */}
      <div>
        <div className="flex items-center gap-2">
          <Archive className="h-6 w-6 text-muted-foreground" />

          <h1 className="text-2xl font-bold tracking-tight">
            Archive History
          </h1>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          View and restore previously archived movement and issuance records.
        </p>
      </div>

      {/* ARCHIVED RECORDS */}
      <Card>
        <CardContent>

          {/* DESKTOP TABLE */}
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doc No.</TableHead>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Officer</TableHead>
                  <TableHead>Transaction Date</TableHead>
                  <TableHead>Archived Date</TableHead>
                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {assignments && assignments.length > 0 ? (
                  assignments.map((row) => {
                    const doc = docByAssignment.get(
                      row.assignment_id
                    );
                    const archivedAt = (
                      row as typeof row & { archived_at: string | null }
                    ).archived_at;

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
                            {row.assets?.[0]?.asset_name ?? "—"}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {row.assets?.[0]?.asset_code}
                          </div>
                        </TableCell>

                        <TableCell>
                          <StatusBadge status={row.status} />
                        </TableCell>

                        <TableCell>
                          {row.offices?.office_name ?? "—"}
                        </TableCell>

                        <TableCell>
                          {row.accountable_officers
                            ? `${row.accountable_officers.first_name} ${row.accountable_officers.last_name}`
                            : "—"}
                        </TableCell>

                        <TableCell>
                          {formatDate(row.assigned_date)}
                        </TableCell>

                        <TableCell>
                          {archivedAt
                            ? formatDate(archivedAt)
                            : "—"}
                        </TableCell>

                        <TableCell className="text-right">
                          <RestoreButton
                            action={restoreMovement.bind(
                              null,
                              row.assignment_id
                            )}
                          />
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
                      No archived transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* MOBILE CARDS */}
          <div className="space-y-3 md:hidden">
            {assignments && assignments.length > 0 ? (
              assignments.map((row) => {
                const doc = docByAssignment.get(
                  row.assignment_id
                );
                const archivedAt = (
                  row as typeof row & { archived_at: string | null }
                ).archived_at;

                return (
                  <div
                    key={row.assignment_id}
                    className="rounded-lg border border-border/60 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium">
                          {row.assets?.[0]?.asset_name ?? "—"}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {row.assets?.[0]?.asset_code}
                        </div>
                      </div>

                      <StatusBadge status={row.status} />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">

                      <div>
                        <p className="text-muted-foreground">
                          Doc No.
                        </p>

                        <p className="font-medium">
                          {doc ? (
                            <Link
                              href={doc.href}
                              className="inline-flex items-center gap-1 hover:underline"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {doc.docNo}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">
                          Department
                        </p>

                        <p className="font-medium">
                          {row.offices?.office_name ?? "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">
                          Officer
                        </p>

                        <p className="font-medium">
                          {row.accountable_officers
                            ? `${row.accountable_officers.first_name} ${row.accountable_officers.last_name}`
                            : "—"}
                        </p>
                      </div>

                      <div>
                        <p className="text-muted-foreground">
                          Transaction Date
                        </p>

                        <p className="font-medium">
                          {formatDate(row.assigned_date)}
                        </p>
                      </div>

                      <div className="col-span-2">
                        <p className="text-muted-foreground">
                          Archived Date
                        </p>

                        <p className="font-medium">
                          {archivedAt
                            ? formatDate(archivedAt)
                            : "—"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end border-t border-border/60 pt-3">
                      <RestoreButton
                        action={restoreMovement.bind(
                          null,
                          row.assignment_id
                        )}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No archived transactions found.
              </p>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
