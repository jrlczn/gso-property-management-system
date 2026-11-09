"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markDisposalApproved } from "@/app/dashboard/disposal/actions";

export function ApproveDisposalButton({ disposalId }: { disposalId: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await markDisposalApproved(disposalId);
          if (result?.error) {
            toast.error(result.error);
          } else {
            toast.success("Marked as approved.");
          }
        })
      }
    >
      Mark Approved
    </Button>
  );
}
