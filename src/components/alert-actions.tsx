"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateAlertStatus } from "@/app/dashboard/alerts/actions";

export function AlertActions({
  alertId,
  status,
}: {
  alertId: number;
  status: string;
}) {
  const [isPending, startTransition] = useTransition();

  function act(next: "read" | "resolved") {
    startTransition(async () => {
      const result = await updateAlertStatus(alertId, next);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(next === "read" ? "Marked as read." : "Alert resolved.");
      }
    });
  }

  if (status === "resolved") return null;

  return (
    <div className="flex justify-end gap-1">
      {status === "pending" && (
        <Button size="sm" variant="ghost" disabled={isPending} onClick={() => act("read")}>
          Mark Read
        </Button>
      )}
      <Button size="sm" variant="outline" disabled={isPending} onClick={() => act("resolved")}>
        Resolve
      </Button>
    </div>
  );
}
