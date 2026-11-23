
import Link from "next/link";
import { FileText, QrCode, Pencil } from "lucide-react";

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
import { DeleteButton } from "@/components/delete-button";
import { ArchiveButton } from "@/components/archive-button";

import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/supabase/auth";
import { formatDate } from "@/lib/format";

import {
  archiveMovement,
  deleteMovement,
} from "@/app/dashboard/movements/actions";

function getEditorLabel(
  name: string | null,
  role: string | null,
  userId: string | null,
) {
  if (!userId) return "Not edited yet";

  return `${name || "Unknown user"} (${role || "user"})`;
}

function formatEditedAt(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(new Date(value));
}

export default async function MovementsPage() {
  const profile = await requireUser();
  const supabase = await createClient();

  // GET MOVEMENT RECORDS
  // Staff only sees records that are not archived.
  let assignmentsQuery = supabase
    .from("asset_assignments")
    .select(
      "*, assets(asset_code, asset_name), accountable_officers(first_name, last_name), offices(office_name)",
    );

  if (profile.role === "staff") {
    assignmentsQuery = assignmentsQuery.is("archived_at", null);
  }

  const [
    { data: assignments },
    { data: assets },
    { data: officers },
    { data: offices },
    { data: parRecords },
    { data: icsRecords },
  ] = await Promise.all([
    assignmentsQuery.order("assigned_date", {
      ascending: false,
    }),

    supabase
      .from("assets")
      .select("*")
      .neq("status", "disposed")
      .order("asset_name"),

    supabase
      .from("accountable_officers")
      .select("*")
      .eq("status", "active"),

    supabase
      .from("offices")
      .select("*")
      .order("office_name"),

    supabase
      .from("par_records")
      .select("par_id, par_no, assignment_id"),

    supabase
      .from("ics_records")
      .select("ics_id, ics_no, assignment_id"),
  ]);

  // MAP DOCUMENT NUMBERS TO ASSIGNMENTS
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Movement & Issuance
          </h1>

          <p className="text-sm text-muted-foreground">
            Track asset transfers, issuances, and returns
          </p>
        </div>

        {/* CREATE MOVEMENT */}
        <MovementFormDialog
          assets={assets ?? []}
          officers={officers ?? []}
          offices={offices ?? []}
        />
      </div>

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
                  <TableHead>Date</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Last Edited</TableHead>
                  <TableHead className="text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {assignments && assignments.length > 0 ? (
                  assignments.map((row) => {
                    // HANDLE ASSET RELATIONSHIP
                    const asset = Array.isArray(row.assets)
                      ? row.assets[0]
                      : row.assets;

                    const doc = docByAssignment.get(
                      row.assignment_id,
                    );

                    return (
                      <TableRow key={row.assignment_id}>

                        {/* DOCUMENT NUMBER */}
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

                        {/* ASSET */}
                        <TableCell>
                          <div className="font-medium">
                            {asset?.asset_name ?? "—"}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            {asset?.asset_code ?? "—"}
                          </div>
                        </TableCell>

                        {/* TYPE */}
                        <TableCell>
                          <StatusBadge status={row.status} />
                        </TableCell>

                        {/* DEPARTMENT */}
                        <TableCell>
                          {row.offices?.office_name ?? "—"}
                        </TableCell>

                        {/* OFFICER */}
                        <TableCell>
                          {row.accountable_officers
                            ? `${row.accountable_officers.first_name} ${row.accountable_officers.last_name}`
                            : "—"}
                        </TableCell>

                        {/* DATE */}
                        <TableCell>
                          {formatDate(row.assigned_date)}
                        </TableCell>

                        {/* REMARKS */}
                        <TableCell className="max-w-48 truncate text-muted-foreground">
                          {row.remarks ?? "—"}
                        </TableCell>

                        {/* LAST EDITED */}
                        <TableCell>
                          <div className="space-y-1 text-xs">
                            <p className="font-medium">
                              {getEditorLabel(
                                row.updated_by_name,
                                row.updated_by_role,
                                row.updated_by,
                              )}
                            </p>

                            <p className="text-muted-foreground">
                              {formatEditedAt(row.updated_at)}
                            </p>
                          </div>
                        </TableCell>

                        {/* DESKTOP ACTIONS */}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">

                            {/* EDIT */}
                            <MovementFormDialog
                              key={row.assignment_id}
                              assets={assets ?? []}
                              officers={officers ?? []}
                              offices={offices ?? []}
                              assignment={row}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  title="Edit transaction"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              }
                            />

                            {/* ADMIN: DELETE | STAFF: ARCHIVE */}
                            {profile.role === "admin" ? (
                              <DeleteButton
                                action={deleteMovement.bind(
                                  null,
                                  row.assignment_id,
                                )}
                                confirmMessage="Are you sure you want to permanently delete this transaction? This action cannot be undone."
                              />
                            ) : profile.role === "staff" ? (
                              <ArchiveButton
                                action={archiveMovement.bind(
                                  null,
                                  row.assignment_id,
                                )}
                                confirmMessage="Are you sure you want to archive this transaction? The record will remain stored in the system."
                              />
                            ) : null}

                            {/* PRINT STICKER */}
                            {row.status !== "returned" && (
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                title="Print sticker"
                              >
                                <Link
                                  href={`/dashboard/assets/${row.asset_id}/sticker`}
                                >
                                  <QrCode className="h-4 w-4" />
                                  Sticker
                                </Link>
                              </Button>
                            )}

                          </div>
                        </TableCell>

                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No transactions recorded yet.
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
                // HANDLE ASSET RELATIONSHIP
                const asset = Array.isArray(row.assets)
                  ? row.assets[0]
                  : row.assets;

                const doc = docByAssignment.get(
                  row.assignment_id,
                );

                return (
                  <div
                    key={row.assignment_id}
                    className="rounded-lg border border-border/60 p-3"
                  >

                    {/* ASSET INFORMATION */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium">
                          {asset?.asset_name ?? "—"}
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {asset?.asset_code ?? "—"}
                        </div>
                      </div>

                      <StatusBadge status={row.status} />
                    </div>

                    {/* MOVEMENT DETAILS */}
                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">

                      {/* DOCUMENT NUMBER */}
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
                              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                              {doc.docNo}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </p>
                      </div>

                      {/* DEPARTMENT */}
                      <div>
                        <p className="text-muted-foreground">
                          Department
                        </p>

                        <p className="font-medium">
                          {row.offices?.office_name ?? "—"}
                        </p>
                      </div>

                      {/* OFFICER */}
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

                      {/* DATE */}
                      <div>
                        <p className="text-muted-foreground">
                          Date
                        </p>

                        <p className="font-medium">
                          {formatDate(row.assigned_date)}
                        </p>
                      </div>

                      {/* REMARKS */}
                      <div className="col-span-2">
                        <p className="text-muted-foreground">
                          Remarks
                        </p>

                        <p className="font-medium">
                          {row.remarks ?? "—"}
                        </p>
                      </div>

                      {/* LAST EDITED */}
                      <div className="col-span-2">
                        <p className="text-muted-foreground">
                          Last Edited
                        </p>

                        <p className="font-medium">
                          {getEditorLabel(
                            row.updated_by_name,
                            row.updated_by_role,
                            row.updated_by,
                          )}
                        </p>

                        <p className="text-muted-foreground">
                          {formatEditedAt(row.updated_at)}
                        </p>
                      </div>

                    </div>

                    {/* MOBILE ACTIONS */}
                    <div className="mt-3 flex justify-end gap-1 border-t border-border/60 pt-2">

                      {/* EDIT */}
                      <MovementFormDialog
                        key={row.assignment_id}
                        assets={assets ?? []}
                        officers={officers ?? []}
                        offices={offices ?? []}
                        assignment={row}
                        trigger={
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit transaction"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                        }
                      />

                      {/* ADMIN: DELETE | STAFF: ARCHIVE */}
                      {profile.role === "admin" ? (
                        <DeleteButton
                          action={deleteMovement.bind(
                            null,
                            row.assignment_id,
                          )}
                          confirmMessage="Are you sure you want to permanently delete this transaction? This action cannot be undone."
                        />
                      ) : profile.role === "staff" ? (
                        <ArchiveButton
                          action={archiveMovement.bind(
                            null,
                            row.assignment_id,
                          )}
                          confirmMessage="Are you sure you want to archive this transaction? The record will remain stored in the system."
                          showLabel
                        />
                      ) : null}

                      {/* PRINT STICKER */}
                      {row.status !== "returned" && (
                        <Button
                          asChild
                          variant="ghost"
                          size="sm"
                          title="Print sticker"
                        >
                          <Link
                            href={`/dashboard/assets/${row.asset_id}/sticker`}
                          >
                            <QrCode className="h-4 w-4" />
                            Sticker
                          </Link>
                        </Button>
                      )}

                    </div>

                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-border/60 p-6 text-center text-sm text-muted-foreground">
                No transactions recorded yet.
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
