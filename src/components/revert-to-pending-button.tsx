"use client";

import { useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markDisposalPending } from "@/app/dashboard/disposal/actions";

export function RevertToPendingButton({ disposalId }: { disposalId: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await markDisposalPending(disposalId);
          if (result?.error) {
            toast.error(result.error);
          } else {
            toast.success("Status reverted to pending.");
          }
        })
      }
    >
      <RotateCcw className="h-4 w-4" /> Revert to Pending
    </Button>
  );
}
