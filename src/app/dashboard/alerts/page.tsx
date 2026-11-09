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
import { AlertActions } from "@/components/alert-actions";
import { SendNotificationsButton } from "@/components/send-notifications-button";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

const typeLabels: Record<string, string> = {
  warranty: "Warranty",
  useful_life: "Useful Life",
  maintenance: "Maintenance",
};

export default async function AlertsPage() {
  const supabase = await createClient();

  const { data: alerts } = await supabase
    .from("alerts")
    .select("*, assets(asset_code, asset_name)")
    .order("status", { ascending: true })
    .order("alert_date", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            Warranty expiry, useful life, and maintenance notifications
          </p>
        </div>
        <SendNotificationsButton />
      </div>

      <Card>
        <CardContent>
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts && alerts.length > 0 ? (
                  alerts.map((alert) => (
                    <TableRow key={alert.alert_id}>
                      <TableCell>
                        <div className="font-medium">
                          {alert.assets?.asset_name ?? "—"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {alert.assets?.asset_code}
                        </div>
                      </TableCell>
                      <TableCell>{typeLabels[alert.alert_type]}</TableCell>
                      <TableCell className="max-w-80 text-muted-foreground">
                        {alert.alert_message}
                      </TableCell>
                      <TableCell>{formatDate(alert.alert_date)}</TableCell>
                      <TableCell>
                        <StatusBadge status={alert.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <AlertActions alertId={alert.alert_id} status={alert.status} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No alerts. Use &quot;Send Notifications&quot; on the Expiry
                      Tracker to scan for approaching thresholds.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-3 md:hidden">
            {alerts && alerts.length > 0 ? (
              alerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  className="rounded-lg border border-border/60 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {alert.assets?.asset_name ?? "—"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {alert.assets?.asset_code}
                      </p>
                    </div>
                    <StatusBadge status={alert.status} />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Type</p>
                      <p className="font-medium">{typeLabels[alert.alert_type]}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">{formatDate(alert.alert_date)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Message</p>
                      <p className="font-medium">{alert.alert_message}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end border-t border-border/60 pt-2">
                    <AlertActions alertId={alert.alert_id} status={alert.status} />
                  </div>
                </div>
              ))
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No alerts. Use &quot;Send Notifications&quot; on the Expiry
                Tracker to scan for approaching thresholds.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
