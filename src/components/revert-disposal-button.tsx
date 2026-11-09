"use client";

import { useTransition } from "react";
import { Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { revertDisposal } from "@/app/dashboard/disposal/actions";

export function RevertDisposalButton({ disposalId }: { disposalId: number }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-muted-foreground hover:text-foreground"
      disabled={isPending}
      onClick={() => {
        if (
          !window.confirm(
            "Undo this disposal? The asset will be restored to its prior status and this disposal record will be removed.",
          )
        )
          return;

        startTransition(async () => {
          const result = await revertDisposal(disposalId);
          if (result?.error) {
            toast.error(result.error);
          } else {
            toast.success("Disposal undone. Asset restored.");
          }
        });
      }}
    >
      <Undo2 className="h-4 w-4" /> Undo
    </Button>
  );
}
