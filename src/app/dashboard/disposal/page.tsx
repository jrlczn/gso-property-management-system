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
import { DisposalFormDialog } from "@/components/disposal-form-dialog";
import { ApproveDisposalButton } from "@/components/approve-disposal-button";
import { RevertDisposalButton } from "@/components/revert-disposal-button";
import { RevertToPendingButton } from "@/components/revert-to-pending-button";
import { requireUser } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatCurrency } from "@/lib/format";

export default async function DisposalPage() {
  const profile = await requireUser();
  const supabase = await createClient();

  const [{ data: rows }, { data: assets }] = await Promise.all([
    supabase
      .from("disposal")
      .select("*, assets(asset_code, asset_name)")
      .order("disposal_date", { ascending: false }),
    supabase
      .from("assets")
      .select("*")
      .neq("status", "disposed")
      .order("asset_name"),
  ]);

  const isAdmin = profile.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Disposal & Write-off
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage condemned and disposed government assets
          </p>
        </div>
        <DisposalFormDialog assets={assets ?? []} />
      </div>

      <Card>
        <CardContent>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Appraisal Value</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Inspection Date</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows && rows.length > 0 ? (
                  rows.map((row) => (
                    <TableRow key={row.disposal_id}>
                      <TableCell>
                        <div className="font-medium">
                          {row.assets?.asset_name ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.assets?.asset_code}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-48 truncate text-muted-foreground">
                        {row.remarks ?? "—"}
                      </TableCell>
                      <TableCell>{formatCurrency(row.appraisal_value)}</TableCell>
                      <TableCell>{row.disposal_method}</TableCell>
                      <TableCell>{formatDate(row.inspection_date)}</TableCell>
                      <TableCell>{row.approved_by ?? "—"}</TableCell>
                      <TableCell>
                        <StatusBadge status={row.status} />
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right space-x-1">
                          {row.status === "pending" && (
                            <ApproveDisposalButton disposalId={row.disposal_id} />
                          )}
                          {row.status === "approved" && (
                            <RevertToPendingButton disposalId={row.disposal_id} />
                          )}
                          <RevertDisposalButton disposalId={row.disposal_id} />
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={isAdmin ? 8 : 7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No disposal records yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {rows && rows.length > 0 ? (
              rows.map((row) => (
                <div
                  key={row.disposal_id}
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
                      <p className="text-muted-foreground">Appraisal Value</p>
                      <p className="font-medium">
                        {formatCurrency(row.appraisal_value)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Method</p>
                      <p className="font-medium">{row.disposal_method}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Inspection Date</p>
                      <p className="font-medium">
                        {formatDate(row.inspection_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Approved By</p>
                      <p className="font-medium">{row.approved_by ?? "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Reason</p>
                      <p className="font-medium">{row.remarks ?? "—"}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="mt-3 flex flex-wrap justify-end gap-1 border-t border-border/60 pt-2">
                      {row.status === "pending" && (
                        <ApproveDisposalButton disposalId={row.disposal_id} />
                      )}
                      {row.status === "approved" && (
                        <RevertToPendingButton disposalId={row.disposal_id} />
                      )}
                      <RevertDisposalButton disposalId={row.disposal_id} />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No disposal records yet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
