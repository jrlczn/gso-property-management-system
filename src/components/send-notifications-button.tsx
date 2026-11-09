"use client";

import { useTransition } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateAlerts } from "@/app/dashboard/expiry/actions";

export function SendNotificationsButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await generateAlerts();
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success(
            result.created > 0
              ? `${result.created} new alert(s) generated.`
              : "No new alerts — everything already flagged is up to date.",
          );
        })
      }
    >
      <Bell className="h-4 w-4" />
      {isPending ? "Checking..." : "Send Notifications"}
    </Button>
  );
}
